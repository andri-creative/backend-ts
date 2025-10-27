// src\utils\mailer.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Define types
interface SendOtpEmailParams {
  email: string;
  otp: string;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  message: string;
}

interface SendContactEmailParams {
  to: string;
  subject: string;
  formData: ContactFormData;
  isAutoReply?: boolean;
}

const sendOtpEmail = async ({
  email,
  otp,
}: SendOtpEmailParams): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"Andri Creative Developer" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "🔐 Kode OTP Verifikasi - Andri Creative Developer",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', 'Arial', sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 20px;
              min-height: 100vh;
            }
            
            .container {
              max-width: 500px;
              margin: 20px auto;
              background: white;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              position: relative;
            }
            
            .logo {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }
            
            .tagline {
              font-size: 14px;
              opacity: 0.9;
              font-weight: 400;
            }
            
            .content {
              padding: 40px 30px;
              color: #333;
            }
            
            .greeting {
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 16px;
              color: #2d3748;
            }
            
            .instruction {
              color: #718096;
              margin-bottom: 30px;
              line-height: 1.6;
            }
            
            .otp-container {
              background: #f7fafc;
              border: 2px dashed #cbd5e0;
              border-radius: 12px;
              padding: 30px;
              text-align: center;
              margin: 30px 0;
            }
            
            .otp-code {
              font-size: 42px;
              font-weight: 700;
              letter-spacing: 8px;
              color: #2d3748;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              margin: 10px 0;
            }
            
            .otp-label {
              font-size: 14px;
              color: #718096;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .warning {
              background: #fffaf0;
              border: 1px solid #feebc8;
              border-radius: 8px;
              padding: 16px;
              margin: 25px 0;
            }
            
            .warning-title {
              color: #dd6b20;
              font-weight: 600;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .warning-text {
              color: #c05621;
              font-size: 13px;
              line-height: 1.5;
            }
            
            .steps {
              background: #f0fff4;
              border: 1px solid #c6f6d5;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
            }
            
            .steps-title {
              color: #276749;
              font-weight: 600;
              margin-bottom: 12px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .step {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              margin-bottom: 12px;
            }
            
            .step-number {
              background: #48bb78;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 600;
              flex-shrink: 0;
            }
            
            .step-text {
              color: #2f855a;
              font-size: 14px;
              line-height: 1.4;
            }
            
            .footer {
              background: #f8f9fa;
              padding: 25px 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            
            .company-info {
              color: #718096;
              font-size: 13px;
              margin-bottom: 8px;
            }
            
            .links {
              margin-top: 15px;
            }
            
            .links a {
              color: #667eea;
              text-decoration: none;
              font-size: 13px;
              margin: 0 10px;
              transition: color 0.3s;
            }
            
            .links a:hover {
              color: #764ba2;
            }
            
            .support {
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
            }
            
            .support-text {
              color: #a0aec0;
              font-size: 12px;
            }
            
            @media (max-width: 480px) {
              .container {
                margin: 10px;
                border-radius: 12px;
              }
              
              .header {
                padding: 30px 20px;
              }
              
              .content {
                padding: 30px 20px;
              }
              
              .otp-code {
                font-size: 36px;
                letter-spacing: 6px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="logo">
                🚀 Andri Creative Developer
              </div>
              <div class="tagline">Innovation & Creativity in Every Code</div>
            </div>
            
            <!-- Content -->
            <div class="content">
              <div class="greeting">Halo! 👋</div>
              
              <p class="instruction">
                Terima kasih telah bergabung dengan kami. Gunakan kode OTP berikut untuk 
                memverifikasi akun Anda dan mulai menjelajahi layanan kami.
              </p>
              
              <!-- OTP Code -->
              <div class="otp-container">
                <div class="otp-label">Kode Verifikasi</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-label">Berlaku 10 menit</div>
              </div>
              
              <!-- Warning -->
              <div class="warning">
                <div class="warning-title">
                  ⚠️ Penting
                </div>
                <div class="warning-text">
                  Jangan bagikan kode OTP ini kepada siapa pun, termasuk pihak yang mengaku 
                  dari Andri Creative Developer. Kode ini bersifat rahasia dan hanya untuk 
                  Anda gunakan.
                </div>
              </div>
              
              <!-- Steps -->
              <div class="steps">
                <div class="steps-title">
                  📝 Cara Verifikasi
                </div>
                <div class="step">
                  <div class="step-number">1</div>
                  <div class="step-text">Salin kode OTP di atas</div>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <div class="step-text">Kembali ke halaman verifikasi</div>
                </div>
                <div class="step">
                  <div class="step-number">3</div>
                  <div class="step-text">Masukkan kode OTP pada kolom yang tersedia</div>
                </div>
                <div class="step">
                  <div class="step-number">4</div>
                  <div class="step-text">Klik tombol "Verifikasi" untuk menyelesaikan</div>
                </div>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <div class="company-info">
                © ${new Date().getFullYear()} Andri Creative Developer. All rights reserved.
              </div>
              
              <div class="links">
                <a href="https://andricreative.dev">Website</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
              
              <div class="support">
                <div class="support-text">
                  Butuh bantuan? Hubungi kami di 
                  <a href="mailto:support@andricreative.dev" style="color: #667eea;">
                    support@andricreative.dev
                  </a>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log("✅ OTP email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending OTP email:", error);
    throw new Error("Gagal mengirim email OTP");
  }
};

// NEW: Function untuk auto-reply ke user
const sendAutoReplyToUser = async (
  formData: ContactFormData
): Promise<void> => {
  try {
    const userName = formData.firstName;

    await transporter.sendMail({
      from: `"Andri Creative Developer" <${process.env.GMAIL_USER}>`,
      to: formData.email,
      subject: "🚀 Thank You for Contacting Andri Creative Developer!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              background-color: #f4f4f4; 
              margin: 0; 
              padding: 20px; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 10px; 
              overflow: hidden; 
              box-shadow: 0 4px 6px rgba(0,0,0,0.1); 
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 30px; 
              text-align: center; 
            }
            .logo { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
            .content { 
              padding: 30px; 
              color: #333; 
              line-height: 1.6; 
            }
            .footer { 
              background: #f8f9fa; 
              padding: 20px; 
              text-align: center; 
              color: #666; 
              font-size: 14px; 
            }
            .status { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 20px 0; 
            }
            .social-links { 
              margin: 20px 0; 
              text-align: center; 
            }
            .social-links a { 
              margin: 0 10px; 
              color: #667eea; 
              text-decoration: none; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚀 Andri Creative Developer</div>
              <p>Innovation & Creativity in Every Code</p>
            </div>
            
            <div class="content">
              <h2>Hi ${userName}! 👋</h2>
              <p>Thank you for reaching out to <strong>Andri Creative Developer</strong>!</p>
              
              <div class="status">
                <h3>🔄 Currently Busy</h3>
                <p>Our team is currently working on exciting projects and might take a bit longer to respond.</p>
                <p><strong>Expected Response Time:</strong> 24-48 hours</p>
              </div>
              
              <p>But don't worry! We've received your message and will get back to you as soon as possible.</p>
              
              <p><strong>What's next?</strong></p>
              <ul>
                <li>We'll review your inquiry carefully</li>
                <li>Prepare the best solution for your needs</li>
                <li>Schedule a call if needed</li>
              </ul>
              
              <div class="social-links">
                <p><strong>Follow us for updates:</strong></p>
                <a href="#">📘 Facebook</a> | 
                <a href="#">📷 Instagram</a> | 
                <a href="#">💼 LinkedIn</a>
              </div>
              
              <p>Best regards,<br>
              <strong>Andri Creative Developer Team</strong> 🎨</p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Andri Creative Developer. All rights reserved.</p>
              <p>
                <a href="https://andricreative.dev" style="color: #667eea;">Website</a> | 
                <a href="#" style="color: #667eea;">Privacy Policy</a> | 
                <a href="#" style="color: #667eea;">Terms of Service</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log("Auto-reply email sent to user:", formData.email);
  } catch (error) {
    console.error("Error sending auto-reply email:", error);
    throw new Error("Gagal mengirim auto-reply email");
  }
};

// NEW: Function untuk notification ke admin
const sendNotificationToAdmin = async (
  formData: ContactFormData
): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"Contact Form" <${process.env.GMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.GMAIL_USER,
      subject: `📧 New Contact Form: ${formData.firstName} ${formData.lastName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background-color: #f4f4f4; 
              margin: 0; 
              padding: 20px; 
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 10px; 
              overflow: hidden; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header { 
              background: #dc3545; 
              color: white; 
              padding: 20px; 
              text-align: center; 
            }
            .content { 
              padding: 25px; 
            }
            .field { 
              margin-bottom: 15px; 
              padding: 12px; 
              background: #f8f9fa; 
              border-radius: 5px; 
              border-left: 4px solid #667eea;
            }
            .label { 
              font-weight: bold; 
              color: #495057; 
              display: block;
              margin-bottom: 5px;
            }
            .value {
              color: #333;
            }
            .message-box {
              background: #e9ecef;
              padding: 15px;
              border-radius: 5px;
              border: 1px solid #dee2e6;
              white-space: pre-wrap;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>📧 New Contact Form Submission</h2>
              <p>From: ${formData.firstName} ${formData.lastName}</p>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">👤 Name:</span>
                <span class="value">${formData.firstName} ${
        formData.lastName
      }</span>
              </div>
              <div class="field">
                <span class="label">📧 Email:</span>
                <span class="value">${formData.email}</span>
              </div>
              <div class="field">
                <span class="label">🌍 Country:</span>
                <span class="value">${formData.country}</span>
              </div>
              <div class="field">
                <span class="label">💬 Message:</span>
                <div class="message-box">${formData.message}</div>
              </div>
              <div class="field">
                <span class="label">🕐 Submitted At:</span>
                <span class="value">${new Date().toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log("Notification email sent to admin");
  } catch (error) {
    console.error("Error sending notification email to admin:", error);
    throw new Error("Gagal mengirim notifikasi ke admin");
  }
};

// NEW: Main function untuk handle contact form
const sendContactEmails = async (
  formData: ContactFormData
): Promise<{ userEmailSent: boolean; adminEmailSent: boolean }> => {
  try {
    // Kirim auto-reply ke user
    await sendAutoReplyToUser(formData);

    // Kirim notifikasi ke admin
    await sendNotificationToAdmin(formData);

    console.log("All contact emails sent successfully");
    return { userEmailSent: true, adminEmailSent: true };
  } catch (error) {
    console.error("Error in sendContactEmails:", error);
    throw new Error("Gagal mengirim email kontak");
  }
};

export {
  transporter,
  sendOtpEmail,
  sendAutoReplyToUser,
  sendNotificationToAdmin,
  sendContactEmails,
};

export type { SendOtpEmailParams, ContactFormData, SendContactEmailParams };
