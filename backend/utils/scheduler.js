const cron = require('node-cron');
const User = require('../models/User');
const Checkup = require('../models/Checkup');
const Medicine = require('../models/Medicine');
const { sendMail, checkupReminderEmail, lowStockEmail } = require('../utils/mailer');

function startScheduler() {
    // Run every day at 8:00 AM server time
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ Running daily notification check...');
        await sendCheckupReminders();
        await sendDailyLowStockAlerts();
    });

    console.log('📅 Daily notification scheduler started (8:00 AM)');
}

async function sendCheckupReminders() {
    try {
        const users = await User.find();

        for (const user of users) {
            const checkups = await Checkup.find({ userId: user._id });
            if (checkups.length === 0) continue;

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            const dueCheckups = checkups.filter(c => {
                const nextDate = new Date(c.lastDate);
                nextDate.setDate(nextDate.getDate() + c.interval);
                const nextStr = nextDate.toISOString().split('T')[0];
                return nextStr === tomorrowStr;
            });

            if (dueCheckups.length === 0) continue;

            const checkupTypeLabels = {
                general: 'General Checkup', dental: 'Dental', eye: 'Eye / Vision',
                cardio: 'Cardiology', derma: 'Dermatology', ortho: 'Orthopedic',
                gynec: 'Gynecology', ent: 'ENT', neuro: 'Neurology', other: 'Other'
            };

            const checkupData = dueCheckups.map(c => ({
                type: checkupTypeLabels[c.type] || c.type,
                doctor: c.doctor || '',
                date: tomorrow.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            }));

            const html = checkupReminderEmail(user.name, checkupData);
            await sendMail(user.email, '🩺 MedVault: Appointment Tomorrow!', html);
            console.log(`📧 Checkup reminder sent to ${user.email} for ${dueCheckups.length} appointment(s)`);
        }
    } catch (err) {
        console.error('❌ Checkup reminder cron error:', err.message);
    }
}

async function sendDailyLowStockAlerts() {
    try {
        const users = await User.find();

        for (const user of users) {
            const medicines = await Medicine.find({ userId: user._id });
            if (medicines.length === 0) continue;

            const lowStockMeds = medicines.filter(m => {
                const remaining = m.totalQuantity - m.dosesTaken;
                return remaining > 0 && (remaining / m.totalQuantity) <= 0.2;
            });

            if (lowStockMeds.length === 0) continue;

            const medData = lowStockMeds.map(m => ({
                name: m.name,
                remaining: m.totalQuantity - m.dosesTaken,
                total: m.totalQuantity
            }));

            const html = lowStockEmail(user.name, medData);
            await sendMail(user.email, '⚠️ MedVault: Daily Low Stock Alert', html);
            console.log(`📧 Low stock alert sent to ${user.email} for ${lowStockMeds.length} medicine(s)`);
        }
    } catch (err) {
        console.error('❌ Low stock cron error:', err.message);
    }
}

module.exports = { startScheduler };
