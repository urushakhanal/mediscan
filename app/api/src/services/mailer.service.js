const nodemailer = require('nodemailer');
const config = require('../config/env');

let cachedTransporter = null;

const isMailEnabled = () => Boolean(config.smtp?.enabled);

const getTransporter = () => {
    if (!isMailEnabled()) {
        return null;
    }

    if (!cachedTransporter) {
        cachedTransporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure,
            auth: {
                user: config.smtp.user,
                pass: config.smtp.pass,
            },
        });
    }

    return cachedTransporter;
};

const buildFromAddress = () => {
    const fromName = String(config.smtp.fromName || '').trim();
    const fromEmail = String(config.smtp.from || '').trim();
    return fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
};

const resolveAppLink = (value) => {
    const link = String(value || '').trim();
    if (!link) {
        return '';
    }

    if (/^https?:\/\//i.test(link)) {
        return link;
    }

    return `${config.clientUrl.replace(/\/$/, '')}${link.startsWith('/') ? link : `/${link}`}`;
};

const sendMail = async ({ to, subject, text, html }) => {
    const transporter = getTransporter();
    if (!transporter) {
        return { skipped: true, reason: 'SMTP is not configured.' };
    }

    const info = await transporter.sendMail({
        from: buildFromAddress(),
        to,
        subject,
        text,
        html,
    });

    return { skipped: false, info };
};

const sendWelcomeEmail = async (user) => {
    if (!user?.email) {
        return { skipped: true, reason: 'Missing recipient email.' };
    }

    const roleLabel = user.role === 'doctor'
        ? 'Doctor'
        : user.role === 'superadmin'
            ? 'Superadmin'
            : 'Patient';

    const subject = `Welcome to ${config.appName}`;
    const signInUrl = `${String(config.clientUrl || '').replace(/\/$/, '')}/signin`;
    const text = [
        `Hi ${user.name || 'there'},`,
        '',
        `Your ${roleLabel.toLowerCase()} account has been created successfully.`,
        user.role === 'doctor'
            ? 'Your doctor profile is ready and will become active once verification is completed.'
            : 'You can now sign in and continue using MediScan.',
        '',
        `Sign in: ${signInUrl}`,
        '',
        `- ${config.appName}`,
    ].join('\n');

    const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #0f172a;">
            <h2 style="margin: 0 0 16px;">Welcome to ${config.appName}</h2>
            <p style="margin: 0 0 12px;">Hi ${user.name || 'there'},</p>
            <p style="margin: 0 0 12px;">Your ${roleLabel.toLowerCase()} account has been created successfully.</p>
            <p style="margin: 0 0 16px;">
                ${
                    user.role === 'doctor'
                        ? 'Your doctor profile is ready and will become active once verification is completed.'
                        : 'You can now sign in and continue using MediScan.'
                }
            </p>
            <p style="margin: 0 0 20px;">
                <a href="${signInUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 999px;">
                    Sign in
                </a>
            </p>
            <p style="margin: 0; color: #64748b;">- ${config.appName}</p>
        </div>
    `;

    return sendMail({
        to: user.email,
        subject,
        text,
        html,
    });
};

const sendNotificationEmail = async (user, notification) => {
    if (!user?.email) {
        return { skipped: true, reason: 'Missing recipient email.' };
    }

    const subject = `[${config.appName}] ${notification?.title || 'New notification'}`;
    const link = String(notification?.link || '').trim();
    const resolvedLink = resolveAppLink(link);
    const linkLine = resolvedLink ? `View in app: ${resolvedLink}` : '';
    const text = [
        `Hi ${user.name || 'there'},`,
        '',
        notification?.title || 'You have a new notification.',
        notification?.message || '',
        linkLine ? '' : '',
        linkLine,
        '',
        `- ${config.appName}`,
    ].filter(Boolean).join('\n');

    const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #0f172a;">
            <h2 style="margin: 0 0 16px;">${config.appName}</h2>
            <p style="margin: 0 0 12px;">Hi ${user.name || 'there'},</p>
            <p style="margin: 0 0 12px; font-weight: 600;">${notification?.title || 'You have a new notification.'}</p>
            <p style="margin: 0 0 16px;">${notification?.message || ''}</p>
            ${
                resolvedLink
                    ? `<p style="margin: 0 0 20px;"><a href="${resolvedLink}" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 999px;">Open in app</a></p>`
                    : ''
            }
            <p style="margin: 0; color: #64748b;">- ${config.appName}</p>
        </div>
    `;

    return sendMail({
        to: user.email,
        subject,
        text,
        html,
    });
};

module.exports = {
    isMailEnabled,
    sendMail,
    sendWelcomeEmail,
    sendNotificationEmail,
};
