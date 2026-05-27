const Appointment = require('../../../database/models/appointment.model');
const config = require('../../../config/env');
const { createNotification } = require('../../notifications/services/notification.service');

const DEFAULT_INTERVAL_MINUTES = 5;
const DEFAULT_LEAD_MINUTES = [1440, 120];
const MILLIS_PER_MINUTE = 60 * 1000;

let reminderInterval = null;
let sweepInProgress = false;

const formatAppointmentDateTime = (dateValue, slotValue) => {
    const [yearText, monthText, dayText] = String(dateValue || '').split('-');
    const [startText] = String(slotValue || '').split('-');
    const [hoursText, minutesText] = String(startText || '').split(':');

    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(hours) || !Number.isInteger(minutes)) {
        return null;
    }

    return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const formatLeadLabel = (minutes) => {
    if (minutes >= 1440) {
        const days = Math.round(minutes / 1440);
        return `${days} day${days === 1 ? '' : 's'}`;
    }

    if (minutes >= 60) {
        const hours = Math.round(minutes / 60);
        return `${hours} hour${hours === 1 ? '' : 's'}`;
    }

    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
};

const getLeadMinutes = () => {
    const configured = Array.isArray(config.appointmentReminders?.leadMinutes)
        ? config.appointmentReminders.leadMinutes
        : [];

    const normalized = configured.length ? configured : DEFAULT_LEAD_MINUTES;
    return [...new Set(normalized)]
        .filter((value) => Number.isInteger(value) && value > 0)
        .sort((left, right) => right - left);
};

const addDays = (date, count) => {
    const next = new Date(date);
    next.setDate(next.getDate() + count);
    return next;
};

const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getAppointmentWindow = () => {
    const leadMinutes = getLeadMinutes();
    const maxLeadMinutes = leadMinutes[0] || DEFAULT_LEAD_MINUTES[0];
    const windowDays = Math.max(2, Math.ceil(maxLeadMinutes / (24 * 60)) + 1);
    const today = new Date();
    const future = addDays(today, windowDays);

    return {
        startDate: formatDateKey(today),
        endDate: formatDateKey(future),
    };
};

const getReminderLeadMinutesDue = (appointment, now = new Date()) => {
    const appointmentStart = formatAppointmentDateTime(appointment?.date, appointment?.slot);
    if (!appointmentStart) {
        return [];
    }

    const diffMillis = appointmentStart.getTime() - now.getTime();
    if (diffMillis <= 0) {
        return [];
    }

    const alreadySent = Array.isArray(appointment.reminderLeadMinutesSent) ? appointment.reminderLeadMinutesSent : [];
    return getLeadMinutes()
        .filter((leadMinutes) => !alreadySent.includes(leadMinutes) && diffMillis <= leadMinutes * MILLIS_PER_MINUTE)
        .sort((left, right) => left - right);
};

const buildReminderPayload = async (appointment, leadMinutes) => {
    const doctor = appointment?.doctor;
    const patient = appointment?.patient;
    const appointmentDate = formatAppointmentDateTime(appointment?.date, appointment?.slot);
    const leadLabel = formatLeadLabel(leadMinutes);

    const formattedDate = appointmentDate
        ? new Intl.DateTimeFormat(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZone: config.appTimeZone,
        }).format(appointmentDate)
        : `${appointment?.date || 'your appointment date'} ${appointment?.slot || ''}`.trim();

    const doctorName = doctor?.name || 'your doctor';
    const patientName = patient?.name || 'there';

    return {
        recipientId: patient?._id,
        type: 'appointment-reminder',
        title: `Appointment reminder in ${leadLabel}`,
        message: `Hi ${patientName}, your appointment with ${doctorName} is scheduled for ${formattedDate}.`,
        link: '/patient/appointments',
        createdByRole: 'system',
        metadata: {
            appointmentId: appointment._id.toString(),
            doctorId: doctor?._id?.toString(),
            patientId: patient?._id?.toString(),
            date: appointment.date,
            slot: appointment.slot,
            leadMinutes,
        },
    };
};

const sendReminderForAppointment = async (appointment, leadMinutes) => {
    const updateResult = await Appointment.updateOne(
        {
            _id: appointment._id,
            reminderLeadMinutesSent: { $ne: leadMinutes },
        },
        {
            $addToSet: { reminderLeadMinutesSent: leadMinutes },
        }
    );

    if (!updateResult.modifiedCount) {
        return { skipped: true, reason: 'Reminder already sent.' };
    }

    try {
        const payload = await buildReminderPayload(appointment, leadMinutes);
        const patient = appointment.patient || null;

        if (!patient || patient.isActive === false || !patient.email) {
            return { skipped: true, reason: 'Recipient not available.' };
        }

        await createNotification(payload);
        return { skipped: false };
    } catch (error) {
        await Appointment.updateOne(
            { _id: appointment._id },
            { $pull: { reminderLeadMinutesSent: leadMinutes } }
        );
        throw error;
    }
};

const runAppointmentReminderSweep = async () => {
    if (!config.appointmentReminders?.enabled) {
        return { skipped: true, reason: 'Appointment reminders are disabled.' };
    }

    if (sweepInProgress) {
        return { skipped: true, reason: 'Reminder sweep already running.' };
    }

    sweepInProgress = true;
    try {
        const now = new Date();
        const { startDate, endDate } = getAppointmentWindow();
        const appointments = await Appointment.find({
            status: 'confirmed',
            date: { $gte: startDate, $lte: endDate },
        })
            .populate('doctor', 'name email')
            .populate('patient', 'name email role isActive')
            .sort({ date: 1, slot: 1, createdAt: 1 });

        const results = {
            checked: appointments.length,
            sent: 0,
            skipped: 0,
        };

        for (const appointment of appointments) {
            const dueLeads = getReminderLeadMinutesDue(appointment, now);
            const leadMinutes = dueLeads[0];

            if (!leadMinutes) {
                continue;
            }

            try {
                const outcome = await sendReminderForAppointment(appointment, leadMinutes);
                if (outcome.skipped) {
                    results.skipped += 1;
                } else {
                    results.sent += 1;
                }
            } catch (error) {
                results.skipped += 1;
                console.error('Failed to send appointment reminder:', error.message);
            }
        }

        return results;
    } finally {
        sweepInProgress = false;
    }
};

const startAppointmentReminderScheduler = async () => {
    if (!config.appointmentReminders?.enabled) {
        console.log('ℹ️  Appointment reminders are disabled.');
        return { stopped: true };
    }

    if (reminderInterval) {
        return { started: false, reason: 'Scheduler already running.' };
    }

    const intervalMinutes = Math.max(config.appointmentReminders.checkIntervalMinutes || DEFAULT_INTERVAL_MINUTES, 1);
    console.log(`ℹ️  Appointment reminders enabled. Checking every ${intervalMinutes} minute(s).`);

    reminderInterval = setInterval(() => {
        void runAppointmentReminderSweep().catch((error) => {
            console.error('Appointment reminder sweep failed:', error.message);
        });
    }, intervalMinutes * MILLIS_PER_MINUTE);

    void runAppointmentReminderSweep().catch((error) => {
        console.error('Appointment reminder sweep failed:', error.message);
    });

    return { started: true };
};

const stopAppointmentReminderScheduler = () => {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = null;
    }
};

module.exports = {
    runAppointmentReminderSweep,
    startAppointmentReminderScheduler,
    stopAppointmentReminderScheduler,
};
