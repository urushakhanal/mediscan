require('dotenv').config();

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../database/models/user.model');
const {
    DEFAULT_DOCTOR_TIME_SLOTS,
    DEFAULT_MAX_APPOINTMENTS_PER_DAY,
} = require('../constants/user.constants');

const seedUsers = [
    {
        name: 'Seed Doctor',
        email: 'doctor@gmail.com',
        password: 'doctor123',
        role: 'doctor',
        phone: '9800000001',
        nmcNumber: 'NMC-SEED-001',
        specialization: 'general-medicine',
        isVerified: true,
        availabilitySettings: {
            maxAppointmentsPerDay: DEFAULT_MAX_APPOINTMENTS_PER_DAY,
            availableTimeSlots: [...DEFAULT_DOCTOR_TIME_SLOTS],
        },
    },
    {
        name: 'Seed Patient',
        email: 'patient@gmail.com',
        password: 'patient123',
        role: 'patient',
        phone: '9800000002',
    },
];

const run = async () => {
    try {
        await connectDB();

        for (const user of seedUsers) {
            const hashedPassword = await bcrypt.hash(user.password, 10);

            await User.findOneAndUpdate(
                { email: user.email },
                {
                    name: user.name,
                    email: user.email,
                    password: hashedPassword,
                    role: user.role,
                    phone: user.phone,
                    nmcNumber: user.role === 'doctor' ? user.nmcNumber : undefined,
                    specialization: user.role === 'doctor' ? user.specialization : undefined,
                    isVerified: user.role === 'doctor' ? Boolean(user.isVerified) : false,
                    availabilitySettings: user.role === 'doctor' ? user.availabilitySettings : undefined,
                },
                {
                    upsert: true,
                    new: true,
                    runValidators: true,
                    setDefaultsOnInsert: true,
                }
            );
        }

        console.log('Seeded default users successfully.');
        console.log('Doctor: doctor@gmail.com / doctor123');
        console.log('Patient: patient@gmail.com / patient123');
    } catch (error) {
        console.error('Failed to seed default users:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close().catch(() => null);
    }
};

run();
