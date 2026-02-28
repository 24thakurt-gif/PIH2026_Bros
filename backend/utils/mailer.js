const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function sendMail(to, subject, html) {
    try {
        await transporter.sendMail({
            from: `"MedVault Health" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`📧 Email sent to ${to}: ${subject}`);
        return true;
    } catch (err) {
        console.error('❌ Email send error:', err.message);
        return false;
    }
}

// ---- Email Templates ----

function medicineDueEmail(userName, medicines) {
    const medList = medicines.map(m =>
        `<tr>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;font-weight:600;">${m.name}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;">${m.dosage}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;">${m.time}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;">${m.instruction}</td>
        </tr>`
    ).join('');

    return `
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;text-align:center;color:#fff;">
            <h1 style="margin:0;font-size:24px;">💊 Medicine Reminder</h1>
            <p style="margin:8px 0 0;opacity:0.9;">Hi ${userName}, it's time to take your medicine!</p>
        </div>
        <div style="padding:24px;">
            <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <thead>
                    <tr style="background:#667eea;color:#fff;">
                        <th style="padding:12px 16px;text-align:left;">Medicine</th>
                        <th style="padding:12px 16px;text-align:left;">Dosage</th>
                        <th style="padding:12px 16px;text-align:left;">Time</th>
                        <th style="padding:12px 16px;text-align:left;">Instruction</th>
                    </tr>
                </thead>
                <tbody>${medList}</tbody>
            </table>
            <p style="margin-top:20px;color:#666;font-size:14px;">Take your medicines on time for the best results. Stay healthy! 🌟</p>
        </div>
        <div style="background:#f0f0f0;padding:16px;text-align:center;font-size:12px;color:#999;">
            MedVault – Your Personal Health Manager
        </div>
    </div>`;
}

function lowStockEmail(userName, medicines) {
    const medList = medicines.map(m =>
        `<tr>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;font-weight:600;">${m.name}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;">${m.remaining} of ${m.total}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;color:${m.remaining <= 3 ? '#e74c3c' : '#f39c12'};font-weight:600;">
                ${m.remaining <= 3 ? '⚠️ Critical' : '⚡ Low'}
            </td>
        </tr>`
    ).join('');

    return `
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#e74c3c,#c0392b);padding:30px;text-align:center;color:#fff;">
            <h1 style="margin:0;font-size:24px;">⚠️ Low Stock Alert</h1>
            <p style="margin:8px 0 0;opacity:0.9;">Hi ${userName}, some medicines are running low!</p>
        </div>
        <div style="padding:24px;">
            <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <thead>
                    <tr style="background:#e74c3c;color:#fff;">
                        <th style="padding:12px 16px;text-align:left;">Medicine</th>
                        <th style="padding:12px 16px;text-align:left;">Remaining</th>
                        <th style="padding:12px 16px;text-align:left;">Status</th>
                    </tr>
                </thead>
                <tbody>${medList}</tbody>
            </table>
            <p style="margin-top:20px;color:#666;font-size:14px;">Please restock these medicines soon to avoid missing doses. 🏥</p>
        </div>
        <div style="background:#f0f0f0;padding:16px;text-align:center;font-size:12px;color:#999;">
            MedVault – Your Personal Health Manager
        </div>
    </div>`;
}

function checkupReminderEmail(userName, checkups) {
    const checkupList = checkups.map(c =>
        `<tr>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;font-weight:600;">${c.type}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;">${c.doctor || 'Not specified'}</td>
            <td style="padding:10px 16px;border-bottom:1px solid #eee;">${c.date}</td>
        </tr>`
    ).join('');

    return `
    <div style="font-family:'Segoe UI',Tahoma,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;border-radius:12px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#2ecc71,#27ae60);padding:30px;text-align:center;color:#fff;">
            <h1 style="margin:0;font-size:24px;">🩺 Appointment Reminder</h1>
            <p style="margin:8px 0 0;opacity:0.9;">Hi ${userName}, you have appointment(s) tomorrow!</p>
        </div>
        <div style="padding:24px;">
            <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <thead>
                    <tr style="background:#2ecc71;color:#fff;">
                        <th style="padding:12px 16px;text-align:left;">Checkup</th>
                        <th style="padding:12px 16px;text-align:left;">Doctor</th>
                        <th style="padding:12px 16px;text-align:left;">Due Date</th>
                    </tr>
                </thead>
                <tbody>${checkupList}</tbody>
            </table>
            <p style="margin-top:20px;color:#666;font-size:14px;">Don't forget to prepare any required documents or reports for your visit! 📋</p>
        </div>
        <div style="background:#f0f0f0;padding:16px;text-align:center;font-size:12px;color:#999;">
            MedVault – Your Personal Health Manager
        </div>
    </div>`;
}

module.exports = { sendMail, medicineDueEmail, lowStockEmail, checkupReminderEmail };
