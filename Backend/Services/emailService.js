// Backend/Services/emailService.js
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
require('dotenv').config(); // Đảm bảo .env được đọc

// Kiểm tra xem SENDGRID_API_KEY có được nạp không
// if (!process.env.SENDGRID_API_KEY) {
//     console.error("FATAL ERROR: SENDGRID_API_KEY is not defined in your .env file.");
//     // Có thể không cần process.exit(1) ở đây để server vẫn chạy,
//     // nhưng việc gửi email sẽ thất bại.
//     // Hoặc bạn có thể throw new Error để dừng nếu email là critical.
// }
// if (!process.env.EMAIL_FROM_ADDRESS) {
//     console.error("FATAL ERROR: EMAIL_FROM_ADDRESS for SendGrid is not defined in your .env file.");
// }


const options = {
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
};



let mailer;
if (process.env.SENDGRID_API_KEY) {
    mailer = nodemailer.createTransport(sgTransport(options));
} else {
    console.warn("SendGrid API Key not found, email sending will be disabled.");
    // Tạo một mailer giả để không bị lỗi khi gọi sendMail, nhưng nó sẽ không gửi gì cả
    mailer = {
        sendMail: async () => {
            console.error("Attempted to send email but SendGrid is not configured.");
            return { success: false, error: "Email service (SendGrid) not configured." };
        }
    };
}

/**
 * Gửi email sử dụng SendGrid.
 * @param {object} emailOptions - Các tùy chọn cho email.
 * @param {string} emailOptions.to - Địa chỉ email người nhận.
 * @param {string} emailOptions.subject - Tiêu đề email.
 * @param {string} emailOptions.html - Nội dung HTML của email.
 * @param {string} [emailOptions.text] - Nội dung text thuần (tùy chọn, dự phòng).
 */
const sendEmail = async (emailOptions) => {
    if (!process.env.SENDGRID_API_KEY || !process.env.EMAIL_FROM_ADDRESS) {
        console.error("SendGrid is not configured properly. Missing API Key or From Address in .env. Email not sent.");
        return { success: false, error: "Email service (SendGrid) not configured." };
    }

    try {
        const emailToSend = {
            to: emailOptions.to,
            from: `"${process.env.EMAIL_FROM_NAME || 'E-Shop'}" <${process.env.EMAIL_FROM_ADDRESS}>`, // Sử dụng email đã xác thực
            subject: emailOptions.subject,
            html: emailOptions.html,
            ...(emailOptions.text && { text: emailOptions.text }), // Thêm text nếu có
        };

        console.log("Attempting to send email via SendGrid with options:", {
            to: emailToSend.to,
            from: emailToSend.from,
            subject: emailToSend.subject,
            // Không log html/text để tránh log dài
        });

        const info = await mailer.sendMail(emailToSend);
        console.log('Email sent successfully via SendGrid. Message ID:', info.messageId);
        return { success: true, messageId: info.messageId, info };
    } catch (error) {
        console.error('Error sending email via SendGrid:', error.message);
        if (error.response && error.response.body && error.response.body.errors) {
            console.error('SendGrid Error Details:', JSON.stringify(error.response.body.errors, null, 2));
        }
        return { success: false, error: error.message };
    }
};

module.exports = sendEmail;