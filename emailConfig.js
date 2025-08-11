const nodemailer = require('nodemailer');
const { createPengaduanNotificationTemplate, createStatusUpdateTemplate } = require('./emailTemplates');

// Konfigurasi transporter email
const createTransporter = () => {
  // Log environment variables untuk debugging (tidak menampilkan password)
  console.log('🔧 Email Configuration Debug:');
  console.log('  - EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
  console.log('  - EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set');
  console.log('  - EMAIL_HOST:', process.env.EMAIL_HOST || 'Not set (using Gmail)');
  console.log('  - NODE_ENV:', process.env.NODE_ENV || 'Not set');
  console.log('  - VERCEL:', process.env.VERCEL || 'Not set');
  console.log('  - VERCEL_ENV:', process.env.VERCEL_ENV || 'Not set');
  
  // Log tambahan untuk debugging Vercel
  if (process.env.VERCEL) {
    console.log('🚀 Running on Vercel - checking environment variables...');
    console.log('🔍 All Environment Variables:', {
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    });
  }
  
  // Konfigurasi berdasarkan environment variables
  const emailConfig = {
    user: process.env.EMAIL_USER || 'desa.moncongloebulu@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  };

  // Jika ada konfigurasi SMTP custom
  if (process.env.EMAIL_HOST) {
    // Try different methods to create transporter
    if (typeof nodemailer.createTransporter === 'function') {
      return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: emailConfig
      });
    } else if (typeof nodemailer.createTransport === 'function') {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: emailConfig
      });
    } else {
      return new nodemailer.Transporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: emailConfig
      });
    }
  }

  // Default: Gmail SMTP
  // Try different methods to create transporter
  let transporter;
  
  try {
    if (typeof nodemailer.createTransporter === 'function') {
      transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: emailConfig,
        // Tambahan konfigurasi untuk production
        secure: true,
        port: 465,
        tls: {
          rejectUnauthorized: false
        }
      });
    } else if (typeof nodemailer.createTransport === 'function') {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: emailConfig,
        // Tambahan konfigurasi untuk production
        secure: true,
        port: 465,
        tls: {
          rejectUnauthorized: false
        }
      });
    } else {
      transporter = new nodemailer.Transporter({
        service: 'gmail',
        auth: emailConfig,
        // Tambahan konfigurasi untuk production
        secure: true,
        port: 465,
        tls: {
          rejectUnauthorized: false
        }
      });
    }
    
    console.log('✅ Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Error creating email transporter:', error);
    throw error;
  }
};

// Template email untuk notifikasi pengaduan baru (menggunakan template baru)
const createPengaduanNotificationEmail = (pengaduanData) => {
  return createPengaduanNotificationTemplate(pengaduanData);
};

// Fungsi untuk mengirim email notifikasi
const sendPengaduanNotification = async (pengaduanData, recipientEmail) => {
  try {
    const transporter = createTransporter();
    const emailContent = createPengaduanNotificationEmail(pengaduanData);
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'desa.moncongloebulu@gmail.com',
      to: recipientEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email notifikasi pengaduan berhasil dikirim:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error mengirim email notifikasi:', error);
    return { success: false, error: error.message };
  }
};

// Fungsi untuk mengirim email ke multiple recipients
const sendPengaduanNotificationToMultiple = async (pengaduanData, recipientEmails) => {
  try {
    console.log('📧 Attempting to send email to multiple recipients:', recipientEmails);
    
    // Validasi input
    if (!recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
      console.error('❌ Invalid recipient emails:', recipientEmails);
      return { success: false, error: 'Invalid recipient emails' };
    }
    
    // Validasi pengaduan data
    if (!pengaduanData || !pengaduanData.judul) {
      console.error('❌ Invalid pengaduan data:', pengaduanData);
      return { success: false, error: 'Invalid pengaduan data' };
    }
    
    const transporter = createTransporter();
    const emailContent = createPengaduanNotificationEmail(pengaduanData);
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'desa.moncongloebulu@gmail.com',
      to: recipientEmails.join(', '),
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    console.log('📤 Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html,
      hasText: !!mailOptions.text
    });

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email notifikasi pengaduan berhasil dikirim ke multiple recipients:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error mengirim email notifikasi ke multiple recipients:', error);
    
    // Log error details untuk debugging
    if (error.code) {
      console.error('  - Error Code:', error.code);
    }
    if (error.response) {
      console.error('  - Response:', error.response);
    }
    if (error.responseCode) {
      console.error('  - Response Code:', error.responseCode);
    }
    if (error.command) {
      console.error('  - Command:', error.command);
    }
    
    return { 
      success: false, 
      error: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode
    };
  }
};

// Fungsi untuk mengirim notifikasi update status pengaduan
const sendStatusUpdateNotification = async (pengaduanData, oldStatus, newStatus, recipientEmails) => {
  try {
    const transporter = createTransporter();
    const emailContent = createStatusUpdateTemplate(pengaduanData, oldStatus, newStatus);
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'desa.moncongloebulu@gmail.com',
      to: recipientEmails.join(', '),
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email notifikasi update status berhasil dikirim:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error mengirim email notifikasi update status:', error);
    return { success: false, error: error.message };
  }
};

// Fungsi untuk mengirim notifikasi ke pelapor (jika ada email)
const sendNotificationToReporter = async (pengaduanData, status, catatan_admin) => {
  try {
    // Hanya kirim jika pelapor bukan anonim dan ada email
    if (pengaduanData.nama === 'Anonim' || !pengaduanData.email) {
      console.log('ℹ️ Skipping reporter notification - anonymous or no email');
      return { success: true, skipped: true, reason: 'anonymous_or_no_email' };
    }

    const transporter = createTransporter();
    
    // Template khusus untuk pelapor
    const subject = `📊 Update Status Laporan Anda: ${pengaduanData.judul}`;
    const htmlBody = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; background: #ffffff; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; text-transform: uppercase; }
          .status-${status} { background: ${getStatusColor(status)}; color: white; }
          .info-row { margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .label { font-weight: 600; color: #3b82f6; display: block; margin-bottom: 5px; }
          .value { color: #374151; }
          .footer { text-align: center; margin-top: 30px; padding: 25px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Update Status Laporan</h1>
            <p>Desa Moncongloe Bulu - Sistem PANDORA</p>
          </div>
          
          <div class="content">
            <div class="info-row">
              <div class="label">Judul Laporan:</div>
              <div class="value">${pengaduanData.judul}</div>
            </div>
            
            <div class="info-row">
              <div class="label">Status Terbaru:</div>
              <div class="value">
                <span class="status-badge status-${status}">${status}</span>
              </div>
            </div>
            
            ${catatan_admin ? `
            <div class="info-row">
              <div class="label">Catatan dari Tim Desa:</div>
              <div class="value">${catatan_admin}</div>
            </div>
            ` : ''}
            
            <div class="info-row">
              <div class="label">Tanggal Update:</div>
              <div class="value">${new Date().toLocaleDateString('id-ID', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>📧 Email ini dikirim otomatis oleh sistem PANDORA Desa Moncongloe Bulu</strong></p>
            <p>Terima kasih telah melaporkan hal ini kepada kami</p>
            <p>Untuk informasi lebih lanjut, silakan hubungi tim desa</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
📊 Update Status Laporan: ${pengaduanData.judul}

Status Terbaru: ${status}
${catatan_admin ? `Catatan dari Tim Desa: ${catatan_admin}` : ''}
Tanggal Update: ${new Date().toLocaleDateString('id-ID')}

---
Email ini dikirim otomatis oleh sistem PANDORA Desa Moncongloe Bulu
Terima kasih telah melaporkan hal ini kepada kami
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'desa.moncongloebulu@gmail.com',
      to: pengaduanData.email,
      subject: subject,
      html: htmlBody,
      text: textBody
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email notifikasi ke pelapor berhasil dikirim:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error mengirim email notifikasi ke pelapor:', error);
    return { success: false, error: error.message };
  }
};

// Helper function untuk warna status
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return '#f59e0b';
    case 'proses': return '#3b82f6';
    case 'selesai': return '#10b981';
    default: return '#6b7280';
  }
};

module.exports = {
  createTransporter,
  createPengaduanNotificationEmail,
  sendPengaduanNotification,
  sendPengaduanNotificationToMultiple,
  sendStatusUpdateNotification,
  sendNotificationToReporter
};
