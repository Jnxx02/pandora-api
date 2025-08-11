const nodemailer = require('nodemailer');
require('dotenv').config();

// Check nodemailer version
console.log(`📦 Nodemailer Version: ${nodemailer.version}`);
console.log(`🔧 Available methods:`, Object.keys(nodemailer).filter(key => typeof nodemailer[key] === 'function'));

// Test email configuration
async function testEmailConfig() {
  console.log('\n🧪 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set' : '❌ Not set'}`);
  console.log(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set'}`);
  console.log(`DESA_EMAIL_RECIPIENTS: ${process.env.DESA_EMAIL_RECIPIENTS ? '✅ Set' : '❌ Not set'}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('\n❌ Error: Email configuration incomplete!');
    console.log('Please check your .env file');
    return;
  }
  
  console.log('\n📧 Creating email transporter...');
  
  try {
    // Try different methods to create transporter
    let transporter;
    
    // Method 1: Try createTransporter (newer versions)
    if (typeof nodemailer.createTransporter === 'function') {
      console.log('✅ Using nodemailer.createTransporter()');
      transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
    // Method 2: Try createTransport (older versions)
    else if (typeof nodemailer.createTransport === 'function') {
      console.log('✅ Using nodemailer.createTransport()');
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
    // Method 3: Try direct constructor
    else {
      console.log('✅ Using new nodemailer.Transporter()');
      transporter = new nodemailer.Transporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    }
    
    console.log('✅ Transporter created successfully');
    
    // Test connection
    console.log('\n🔗 Testing connection...');
    await transporter.verify();
    console.log('✅ Connection verified successfully');
    
    // Send test email
    console.log('\n📤 Sending test email...');
    
    const testPengaduanData = {
      nama: 'Test User',
      email: 'test@example.com',
      whatsapp: '08123456789',
      klasifikasi: 'pengaduan',
      judul: 'Test Pengaduan - Sistem Email',
      isi: 'Ini adalah test pengaduan untuk memverifikasi sistem email PANDORA berfungsi dengan baik.',
      tanggal_kejadian: new Date().toISOString(),
      kategori: 'Test Kategori',
      lampiran_info: 'test-image.jpg',
      status: 'pending',
      tanggal_pengaduan: new Date().toISOString()
    };
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.DESA_EMAIL_RECIPIENTS || process.env.EMAIL_USER,
      subject: '🧪 TEST EMAIL: Sistem PANDORA Email Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1>🧪 TEST EMAIL SISTEM PANDORA</h1>
            <p>Verifikasi Konfigurasi Email</p>
          </div>
          
          <div style="padding: 20px; background: #f9fafb;">
            <h2>✅ Email Test Berhasil!</h2>
            <p>Sistem notifikasi email PANDORA berfungsi dengan baik.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6;">
              <h3>📋 Data Test Pengaduan:</h3>
              <p><strong>Nama:</strong> ${testPengaduanData.nama}</p>
              <p><strong>Judul:</strong> ${testPengaduanData.judul}</p>
              <p><strong>Kategori:</strong> ${testPengaduanData.kategori}</p>
              <p><strong>Status:</strong> ${testPengaduanData.status}</p>
            </div>
            
            <p><strong>Waktu Test:</strong> ${new Date().toLocaleString('id-ID')}</p>
          </div>
          
          <div style="background: #e5e7eb; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; color: #6b7280;">
            <p>🎉 Sistem PANDORA Email Notification siap digunakan!</p>
          </div>
        </div>
      `,
      text: `
🧪 TEST EMAIL SISTEM PANDORA - Verifikasi Konfigurasi Email

✅ Email Test Berhasil!
Sistem notifikasi email PANDORA berfungsi dengan baik.

📋 Data Test Pengaduan:
- Nama: ${testPengaduanData.nama}
- Judul: ${testPengaduanData.judul}
- Kategori: ${testPengaduanData.kategori}
- Status: ${testPengaduanData.status}

Waktu Test: ${new Date().toLocaleString('id-ID')}

🎉 Sistem PANDORA Email Notification siap digunakan!
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📨 To: ${mailOptions.to}`);
    console.log(`📤 From: ${mailOptions.from}`);
    
    console.log('\n🎉 SUCCESS: Email configuration is working perfectly!');
    console.log('Sistem PANDORA siap mengirim notifikasi email otomatis.');
    
  } catch (error) {
    console.error('\n❌ Error during email test:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Troubleshooting Tips:');
      console.log('1. Pastikan App Password sudah benar');
      console.log('2. Pastikan 2-Step Verification aktif di Gmail');
      console.log('3. Cek apakah ada pembatasan keamanan Google');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Troubleshooting Tips:');
      console.log('1. Cek koneksi internet');
      console.log('2. Pastikan port 587 tidak diblokir firewall');
    }
    
    console.log('\n🔍 Additional Debug Info:');
    console.log('Error Code:', error.code);
    console.log('Error Stack:', error.stack);
  }
}

// Run the test
testEmailConfig();
