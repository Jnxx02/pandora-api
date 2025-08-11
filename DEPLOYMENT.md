# 🚀 Pandora Backend Deployment Guide

## Vercel Deployment

### 1. Environment Variables yang Harus Diisi di Vercel

Buka **Vercel Dashboard** → **Project Settings** → **Environment Variables** dan tambahkan:

#### 🔐 Supabase Configuration
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### 📧 Email Configuration (Gmail)
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
```

#### 🌐 Frontend URL
```
FRONTEND_URL=https://your-frontend-domain.com
```

#### 📬 Email Recipients
```
DESA_EMAIL_RECIPIENTS=admin@desa.com,staff@desa.com
```

#### ⚙️ Environment
```
NODE_ENV=production
```

### 2. Cara Mendapatkan Gmail App Password

1. Buka [Google Account Settings](https://myaccount.google.com/)
2. Pilih **Security** → **2-Step Verification** (harus aktif)
3. Pilih **App passwords**
4. Generate password untuk "Mail"
5. Gunakan password yang dihasilkan sebagai `EMAIL_PASSWORD`

### 3. Cara Mendapatkan Supabase Credentials

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Buka **Settings** → **API**
4. Copy **Project URL** sebagai `SUPABASE_URL`
5. Copy **service_role** key sebagai `SUPABASE_SERVICE_ROLE_KEY`

### 4. Deployment Steps

1. **Push code ke GitHub**
2. **Connect repository ke Vercel**
3. **Set environment variables** (lihat langkah 1)
4. **Deploy**

### 5. Testing Deployment

Setelah deploy, test endpoint berikut:

- **Health Check**: `https://your-backend.vercel.app/api/health`
- **Debug Info**: `https://your-backend.vercel.app/api/debug`

### 6. Troubleshooting

#### Backend tidak terbaca
- ✅ Pastikan semua environment variables sudah diisi
- ✅ Check Vercel function logs
- ✅ Pastikan `vercel.json` sudah benar

#### Email tidak terkirim
- ✅ Pastikan `EMAIL_USER` dan `EMAIL_PASSWORD` benar
- ✅ Pastikan Gmail App Password sudah dibuat
- ✅ Check email logs di Vercel

#### Supabase error
- ✅ Pastikan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` benar
- ✅ Pastikan Supabase project aktif
- ✅ Check Supabase logs

### 7. Local Development

Untuk development lokal, buat file `.env` dengan isi yang sama seperti environment variables di atas.

```bash
npm install
npm run dev
```

### 8. Important Notes

- **Jangan commit** file `.env` ke repository
- **Gunakan App Password**, bukan password Gmail biasa
- **Service Role Key** memiliki akses penuh ke database
- **Environment Variables** di Vercel bersifat private dan aman
