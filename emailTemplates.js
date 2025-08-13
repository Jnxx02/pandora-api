/**
 * Email Templates untuk Sistem PANDORA
 * Template ini bisa dikustomisasi sesuai kebutuhan desa
 */

// Template untuk notifikasi pengaduan baru
const createPengaduanNotificationTemplate = (pengaduanData) => {
  // Debug incoming data
  console.log('📧 EMAIL TEMPLATE DEBUG:', {
    receivedData: pengaduanData,
    judulField: pengaduanData?.judul,
    judulType: typeof pengaduanData?.judul,
    allKeys: Object.keys(pengaduanData || {}),
    hasJudul: !!pengaduanData?.judul
  });

  // Additional detailed debugging for judul field
  if (pengaduanData?.judul !== undefined) {
    console.log('🔍 JUDUL FIELD DETAILED DEBUG:', {
      judul: pengaduanData.judul,
      judulLength: pengaduanData.judul.length,
      judulTrimmed: pengaduanData.judul.trim(),
      judulTrimmedLength: pengaduanData.judul.trim().length,
      judulIsEmpty: pengaduanData.judul.trim() === '',
      judulIsWhitespace: /^\s*$/.test(pengaduanData.judul)
    });
  } else {
    console.log('❌ JUDUL FIELD IS UNDEFINED OR NULL');
  }

  const {
    nama,
    email,
    whatsapp,
    klasifikasi,
    judul,
    isi,
    tanggal_kejadian,
    kategori,
    lampiran_info,
    lampiran_data_url,
    tanggal_pengaduan,
    status = 'pending'
  } = pengaduanData;

  // Debug destructured values
  console.log('🔍 DESTRUCTURED VALUES DEBUG:', {
    nama,
    email,
    whatsapp,
    klasifikasi,
    judul,
    isi,
    tanggal_kejadian,
    kategori,
    lampiran_info,
    lampiran_data_url,
    tanggal_pengaduan,
    status
  });

  const isAnonim = nama === 'Anonim';
  const contactInfo = isAnonim 
    ? `WhatsApp: ${whatsapp || 'Tidak diisi'}`
    : `Nama: ${nama}\nEmail: ${email || 'Tidak diisi'}\nWhatsApp: ${whatsapp || 'Tidak diisi'}`;

  const attachmentInfo = lampiran_info 
    ? `\n\n📎 Lampiran: ${lampiran_info}`
    : '';

  const urgencyLevel = getUrgencyLevel(kategori, klasifikasi);
  const urgencyColor = getUrgencyColor(urgencyLevel);
  const urgencyIcon = getUrgencyIcon(urgencyLevel);

  const subject = `${urgencyIcon} ${klasifikasi.toUpperCase()} BARU: ${judul}`;
  
  // Debug values before template construction
  console.log('🔍 TEMPLATE CONSTRUCTION DEBUG:', {
    urgencyIcon,
    klasifikasi,
    judul,
    nama,
    whatsapp,
    isAnonim
  });
  
  const htmlBody = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f4f4f4; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff; 
          box-shadow: 0 0 20px rgba(0,0,0,0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #dc2626, #b91c1c); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
          border-radius: 8px 8px 0 0; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .header p { 
          margin: 10px 0 0 0; 
          opacity: 0.9; 
          font-size: 16px; 
        }
        .urgency-badge {
          display: inline-block;
          background: ${urgencyColor};
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 10px;
          text-transform: uppercase;
        }
        .content { 
          padding: 30px 20px; 
          background: #ffffff; 
        }
        .info-section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        .info-row { 
          margin: 12px 0; 
          padding: 15px; 
          background: #f9fafb; 
          border-radius: 8px; 
          border-left: 4px solid #dc2626; 
          transition: all 0.3s ease;
        }
        .info-row:hover {
          background: #f3f4f6;
          transform: translateX(5px);
        }
        .label { 
          font-weight: 600; 
          color: #dc2626; 
          display: block;
          margin-bottom: 5px;
          font-size: 14px;
        }
        .value { 
          color: #374151; 
          font-size: 15px;
          line-height: 1.5;
        }
        .urgent { 
          background: #fef2f2; 
          border-left-color: #dc2626; 
        }
        .contact-info {
          background: #eff6ff;
          border-left-color: #3b82f6;
        }
        .contact-info .label {
          color: #3b82f6;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          padding: 25px 20px; 
          background: #f9fafb; 
          border-top: 1px solid #e5e7eb;
          color: #6b7280; 
          font-size: 14px; 
        }
        .action-buttons {
          text-align: center;
          margin: 25px 0;
        }
        .btn {
          display: inline-block;
          padding: 12px 24px;
          background: #dc2626;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          margin: 0 10px;
          transition: all 0.3s ease;
        }
        .btn:hover {
          background: #b91c1c;
          transform: translateY(-2px);
        }
        .btn-secondary {
          background: #6b7280;
        }
        .btn-secondary:hover {
          background: #4b5563;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 15px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-proses {
          background: #dbeafe;
          color: #1e40af;
        }
        .status-selesai {
          background: #d1fae5;
          color: #065f46;
        }
        @media (max-width: 600px) {
          .container { margin: 10px; }
          .header { padding: 20px 15px; }
          .content { padding: 20px 15px; }
          .btn { display: block; margin: 10px 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 ${klasifikasi.toUpperCase()} BARU</h1>
          <p>Desa Moncongloe Bulu - Sistem PANDORA</p>
          <div class="urgency-badge">
            ${urgencyLevel} Priority
          </div>
        </div>
        
        <div class="content">
          <div class="info-section">
            <div class="section-title">📋 Detail ${klasifikasi}</div>
            
            <div class="info-row urgent">
              <div class="label">Judul ${klasifikasi}:</div>
              <div class="value">${judul}</div>
            </div>
            
            <div class="info-row">
              <div class="label">Klasifikasi:</div>
              <div class="value">${klasifikasi}</div>
            </div>
            
            <div class="info-row">
              <div class="label">Kategori:</div>
              <div class="value">${kategori}</div>
            </div>
            
            <div class="info-row">
              <div class="label">Isi ${klasifikasi}:</div>
              <div class="value">${isi}</div>
            </div>
            
            ${tanggal_kejadian ? `
            <div class="info-row">
              <div class="label">Tanggal Kejadian:</div>
              <div class="value">${formatDate(tanggal_kejadian)}</div>
            </div>
            ` : ''}
            
            <div class="info-row">
              <div class="label">Tanggal ${klasifikasi}:</div>
              <div class="value">${formatDate(tanggal_pengaduan)}</div>
            </div>
            
            <div class="info-row">
              <div class="label">Status:</div>
              <div class="value">
                <span class="status-badge status-${status}">${status}</span>
              </div>
            </div>
          </div>
          
          <div class="info-section">
            <div class="section-title">👤 Informasi Pelapor</div>
            
            <div class="info-row contact-info">
              <div class="label">Kontak:</div>
              <div class="value">${contactInfo}</div>
            </div>
            
            ${attachmentInfo ? `
            <div class="info-row">
              <div class="label">Lampiran:</div>
              <div class="value">${lampiran_info}</div>
            </div>
            ` : ''}
          </div>
          
          <div class="action-buttons">
            <a href="${process.env.FRONTEND_URL || 'https://www.moncongloebulu.com/#/admin/pengaduan'}" class="btn">📋 Lihat Detail Lengkap</a>
            ${!isAnonim && whatsapp ? `<a href="https://wa.me/${whatsapp.replace(/[^0-9+]/g, '').replace(/^0/, '+62')}?text=Halo ${nama},%0A%0AKami telah menerima laporan Anda dan sedang dalam proses penanganan.%0A%0ATerima kasih." class="btn btn-secondary">📱 Hubungi Pelapor</a>` : ''}
          </div>
        </div>
        
        <div class="footer">
          <p><strong>📧 Email ini dikirim otomatis oleh sistem PANDORA Desa Moncongloe Bulu</strong></p>
          <p>Silakan segera tindak lanjuti ${klasifikasi} ini sesuai dengan prosedur yang berlaku</p>
          <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
            © ${new Date().getFullYear()} Desa Moncongloe Bulu. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
${urgencyIcon} ${klasifikasi.toUpperCase()} BARU: ${judul}

📋 Detail ${klasifikasi}:
- Klasifikasi: ${klasifikasi}
- Kategori: ${kategori}
- Isi: ${isi}
${tanggal_kejadian ? `- Tanggal Kejadian: ${formatDate(tanggal_kejadian)}` : ''}
- Tanggal ${klasifikasi}: ${formatDate(tanggal_pengaduan)}
- Status: ${status}
- Prioritas: ${urgencyLevel}

👤 Informasi Pelapor:
${contactInfo}${attachmentInfo}

💬 Template Chat WhatsApp (jika ingin hubungi pelapor):
Halo ${nama},

Kami telah menerima laporan Anda dan sedang dalam proses penanganan.

Terima kasih.

---
Email ini dikirim otomatis oleh sistem PANDORA Desa Moncongloe Bulu
Silakan segera tindak lanjuti ${klasifikasi} ini sesuai dengan prosedur yang berlaku

© ${new Date().getFullYear()} Desa Moncongloe Bulu
  `;

  // Debug the final template
  console.log('🔍 FINAL TEMPLATE DEBUG:', {
    subject,
    htmlLength: htmlBody.length,
    textLength: textBody.length,
    judulInSubject: subject.includes(judul),
    judulInHtml: htmlBody.includes(judul),
    judulInText: textBody.includes(judul)
  });

  return {
    subject,
    html: htmlBody,
    text: textBody
  };
};

// Template untuk notifikasi update status pengaduan
const createStatusUpdateTemplate = (pengaduanData, oldStatus, newStatus) => {
  const {
    nama,
    judul,
    klasifikasi,
    catatan_admin
  } = pengaduanData;

  const subject = `📊 Update Status: ${klasifikasi} - ${judul}`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f4f4f4; 
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: #ffffff; 
          box-shadow: 0 0 20px rgba(0,0,0,0.1); 
        }
        .header { 
          background: linear-gradient(135deg, #059669, #047857); 
          color: white; 
          padding: 30px 20px; 
          text-align: center; 
          border-radius: 8px 8px 0 0; 
        }
        .header h1 { 
          margin: 0; 
          font-size: 24px; 
          font-weight: 600; 
        }
        .status-change {
          background: #f0fdf4;
          border: 2px solid #22c55e;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .old-status {
          color: #dc2626;
          font-weight: 600;
        }
        .new-status {
          color: #059669;
          font-weight: 600;
        }
        .arrow {
          font-size: 20px;
          margin: 0 15px;
        }
        .content { 
          padding: 30px 20px; 
          background: #ffffff; 
        }
        .info-row { 
          margin: 12px 0; 
          padding: 15px; 
          background: #f9fafb; 
          border-radius: 8px; 
          border-left: 4px solid #059669; 
        }
        .label { 
          font-weight: 600; 
          color: #059669; 
          display: block;
          margin-bottom: 5px;
        }
        .value { 
          color: #374151; 
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          padding: 25px 20px; 
          background: #f9fafb; 
          border-top: 1px solid #e5e7eb;
          color: #6b7280; 
          font-size: 14px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Update Status ${klasifikasi}</h1>
          <p>Desa Moncongloe Bulu - Sistem PANDORA</p>
        </div>
        
        <div class="content">
          <div class="status-change">
            <div>
              <span class="old-status">${oldStatus.toUpperCase()}</span>
              <span class="arrow">→</span>
              <span class="new-status">${newStatus.toUpperCase()}</span>
            </div>
          </div>
          
          <div class="info-row">
            <div class="label">Judul ${klasifikasi}:</div>
            <div class="value">${judul}</div>
          </div>
          
          <div class="info-row">
            <div class="label">Pelapor:</div>
            <div class="value">${nama}</div>
          </div>
          
          ${catatan_admin ? `
          <div class="info-row">
            <div class="label">Catatan Admin:</div>
            <div class="value">${catatan_admin}</div>
          </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p><strong>📧 Email ini dikirim otomatis oleh sistem PANDORA Desa Moncongloe Bulu</strong></p>
          <p>Status ${klasifikasi} telah diperbarui</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
📊 Update Status: ${klasifikasi} - ${judul}

Status berubah dari: ${oldStatus.toUpperCase()} → ${newStatus.toUpperCase()}

Detail:
- Judul: ${judul}
- Pelapor: ${nama}
${catatan_admin ? `- Catatan Admin: ${catatan_admin}` : ''}

---
Email ini dikirim otomatis oleh sistem PANDORA Desa Moncongloe Bulu
Status ${klasifikasi} telah diperbarui
  `;

  return {
    subject,
    html: htmlBody,
    text: textBody
  };
};

// Helper functions
const getUrgencyLevel = (kategori, klasifikasi) => {
  const urgentCategories = [
    'Keamanan dan Ketertiban',
    'Infrastruktur (Jalan, Jembatan, dll.)'
  ];
  
  if (urgentCategories.includes(kategori)) return 'HIGH';
  if (klasifikasi === 'pengaduan') return 'MEDIUM';
  return 'LOW';
};

const getUrgencyColor = (level) => {
  switch (level) {
    case 'HIGH': return '#dc2626';
    case 'MEDIUM': return '#f59e0b';
    case 'LOW': return '#10b981';
    default: return '#6b7280';
  }
};

const getUrgencyIcon = (level) => {
  switch (level) {
    case 'HIGH': return '🚨';
    case 'MEDIUM': return '⚠️';
    case 'LOW': return 'ℹ️';
    default: return '📋';
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Template email untuk reset password admin
const createPasswordResetTemplate = (resetToken, adminUsername) => {
  const resetLink = `${process.env.FRONTEND_URL || 'https://moncongloebulu.com'}/#/admin/reset-password?token=${resetToken}`;
  
  const subject = '🔐 Reset Password Admin - Sistem PANDORA Desa Moncongloe Bulu';
  
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
        .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px 20px; background: #ffffff; }
        .warning-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .warning-icon { color: #dc2626; font-size: 24px; margin-right: 10px; }
        .reset-button { display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .reset-button:hover { background: #991b1b; }
        .info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 25px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
        .token-display { background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; padding: 15px; font-family: monospace; font-size: 14px; margin: 15px 0; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Password Admin</h1>
          <p>Sistem PANDORA Desa Moncongloe Bulu</p>
        </div>
        
        <div class="content">
          <p>Halo Admin,</p>
          
          <p>Kami menerima permintaan untuk mereset password akun admin Anda. Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
          
          <div class="warning-box">
            <span class="warning-icon">⚠️</span>
            <strong>Peringatan Keamanan:</strong> Jangan bagikan link reset password ini kepada siapapun. Link ini hanya berlaku untuk Anda dan akan kadaluarsa dalam waktu tertentu.
          </div>
          
          <p>Untuk melanjutkan proses reset password, silakan klik tombol di bawah ini:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="reset-button">Reset Password Sekarang</a>
          </div>
          
          <p>Atau jika tombol tidak berfungsi, Anda dapat menyalin dan paste link berikut ke browser:</p>
          
          <div class="token-display">
            ${resetLink}
          </div>
          
          <div class="info-box">
            <strong>Informasi Penting:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Link reset password hanya berlaku untuk sementara waktu</li>
              <li>Setelah berhasil reset, password lama tidak akan berlaku lagi</li>
              <li>Pastikan menggunakan password yang kuat dan unik</li>
              <li>Jangan bagikan password baru kepada siapapun</li>
            </ul>
          </div>
          
          <p>Jika Anda mengalami masalah atau tidak melakukan permintaan ini, segera hubungi tim IT desa.</p>
          
          <p>Terima kasih,<br>
          <strong>Tim IT Desa Moncongloe Bulu</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>📧 Email ini dikirim otomatis oleh sistem PANDORA Desa Moncongloe Bulu</strong></p>
          <p>Untuk keamanan, jangan balas email ini</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textBody = `
🔐 Reset Password Admin - Sistem PANDORA Desa Moncongloe Bulu

Halo Admin,

Kami menerima permintaan untuk mereset password akun admin Anda. Jika Anda tidak melakukan permintaan ini, abaikan email ini.

Peringatan Keamanan: Jangan bagikan link reset password ini kepada siapapun.

Untuk melanjutkan proses reset password, silakan kunjungi link berikut:
${resetLink}

Informasi Penting:
- Link reset password hanya berlaku untuk sementara waktu
- Setelah berhasil reset, password lama tidak akan berlaku lagi
- Pastikan menggunakan password yang kuat dan unik
- Jangan bagikan password baru kepada siapapun

Jika Anda mengalami masalah atau tidak melakukan permintaan ini, segera hubungi tim IT desa.

Terima kasih,
Tim IT Desa Moncongloe Bulu

---
Email ini dikirim otomatis oleh sistem PANDORA Desa Moncongloe Bulu
Untuk keamanan, jangan balas email ini
  `;
  
  return {
    subject,
    html: htmlBody,
    text: textBody
  };
};

// Template email untuk konfirmasi password berhasil diubah
const createPasswordChangeConfirmationTemplate = (adminUsername, changeTime) => {
  const subject = '✅ Password Admin Berhasil Diubah - Sistem PANDORA Desa Moncongloe Bulu';
  
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
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 30px 20px; background: #ffffff; }
        .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .success-icon { color: #10b981; font-size: 24px; margin-right: 10px; }
        .info-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding: 25px 20px; background: #f9fafb; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Berhasil Diubah</h1>
          <p>Sistem PANDORA Desa Moncongloe Bulu</p>
        </div>
        
        <div class="content">
          <p>Halo Admin,</p>
          
          <div class="success-box">
            <span class="success-icon">✅</span>
            <strong>Password akun admin Anda berhasil diubah!</strong>
          </div>
          
          <p>Password akun admin <strong>${adminUsername}</strong> telah berhasil diubah pada:</p>
          
          <div class="info-box">
            <strong>Waktu Perubahan:</strong> ${changeTime}<br>
            <strong>Status:</strong> Berhasil
          </div>
          
          <p>Jika Anda tidak melakukan perubahan ini, segera:</p>
          <ol style="margin: 10px 0; padding-left: 20px;">
            <li>Login ke akun admin</li>
            <li>Ubah password kembali</li>
            <li>Hubungi tim IT desa untuk bantuan lebih lanjut</li>
          </ol>
          
          <p>Untuk keamanan, pastikan:</p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>Password baru tidak dibagikan kepada siapapun</li>
            <li>Logout dari semua perangkat yang menggunakan akun ini</li>
            <li>Gunakan password yang kuat dan unik</li>
          </ul>
          
          <p>Terima kasih,<br>
          <strong>Tim IT Desa Moncongloe Bulu</strong></p>
        </div>
        
        <div class="footer">
          <p><strong>📧 Email ini dikirim otomatis oleh sistem PANDORA Desa Moncongloe Bulu</strong></p>
          <p>Untuk keamanan, jangan balas email ini</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const textBody = `
✅ Password Admin Berhasil Diubah - Sistem PANDORA Desa Moncongloe Bulu

Halo Admin,

Password akun admin Anda berhasil diubah!

Password akun admin ${adminUsername} telah berhasil diubah pada:
Waktu Perubahan: ${changeTime}
Status: Berhasil

Jika Anda tidak melakukan perubahan ini, segera:
1. Login ke akun admin
2. Ubah password kembali
3. Hubungi tim IT desa untuk bantuan lebih lanjut

Untuk keamanan, pastikan:
- Password baru tidak dibagikan kepada siapapun
- Logout dari semua perangkat yang menggunakan akun ini
- Gunakan password yang kuat dan unik

Terima kasih,
Tim IT Desa Moncongloe Bulu

---
Email ini dikirim otomatis oleh sistem PANDORA Desa Moncongloe Bulu
Untuk keamanan, jangan balas email ini
  `;
  
  return {
    subject,
    html: htmlBody,
    text: textBody
  };
};

module.exports = {
  createPengaduanNotificationTemplate,
  createStatusUpdateTemplate,
  createPasswordResetTemplate,
  createPasswordChangeConfirmationTemplate
};
