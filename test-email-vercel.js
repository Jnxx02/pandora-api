#!/usr/bin/env node

/**
 * Test Email Configuration untuk Vercel Deployment
 * Script ini membantu debug masalah email di Vercel
 */

const nodemailer = require('nodemailer');

console.log('🧪 Testing Email Configuration for Vercel...\n');

// 1. Check Environment Variables
console.log('🔍 Environment Variables Check:');
console.log('  - EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
console.log('  - EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set');
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('  - VERCEL:', process.env.VERCEL || 'Not set');
console.log('  - VERCEL_ENV:', process.env.VERCEL_ENV || 'Not set');
console.log('  - PORT:', process.env.PORT || 'Not set');
console.log('');

// 2. Test Transporter Creation
console.log('🔧 Testing Transporter Creation...');
try {
  // Test method 1: createTransporter
  let transporter;
  if (typeof nodemailer.createTransporter === 'function') {
    console.log('  - Using nodemailer.createTransporter');
    transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'test@example.com',
        pass: process.env.EMAIL_PASSWORD || 'test-password'
      },
      secure: true,
      port: 465,
      tls: {
        rejectUnauthorized: false
      }
    });
  } else if (typeof nodemailer.createTransport === 'function') {
    console.log('  - Using nodemailer.createTransport');
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'test@example.com',
        pass: process.env.EMAIL_PASSWORD || 'test-password'
      },
      secure: true,
      port: 465,
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    console.log('  - Using new nodemailer.Transporter');
    transporter = new nodemailer.Transporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'test@example.com',
        pass: process.env.EMAIL_PASSWORD || 'test-password'
      },
      secure: true,
      port: 465,
      tls: {
        rejectUnauthorized: false
      }
    });
  }
  
  console.log('  ✅ Transporter created successfully');
  
  // 3. Test Email Sending (if credentials are available)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('\n📧 Testing Email Sending...');
    
    const testEmail = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to self for testing
      subject: '🧪 Test Email dari Vercel - ' + new Date().toISOString(),
      text: 'Ini adalah test email untuk memverifikasi konfigurasi email di Vercel.',
      html: `
        <h2>🧪 Test Email dari Vercel</h2>
        <p>Ini adalah test email untuk memverifikasi konfigurasi email di Vercel.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'Not set'}</p>
        <p><strong>Vercel:</strong> ${process.env.VERCEL ? 'Yes' : 'No'}</p>
      `
    };
    
    console.log('  - Sending test email to:', testEmail.to);
    
    const info = await transporter.sendMail(testEmail);
    console.log('  ✅ Test email sent successfully!');
    console.log('  - Message ID:', info.messageId);
    console.log('  - Response:', info.response);
    
  } else {
    console.log('\n⚠️  Skipping email sending test - credentials not available');
    console.log('  - Set EMAIL_USER and EMAIL_PASSWORD in environment variables');
  }
  
} catch (error) {
  console.error('\n❌ Error during testing:');
  console.error('  - Error:', error.message);
  
  if (error.code) {
    console.error('  - Code:', error.code);
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
  
  // Provide specific solutions based on error
  if (error.code === 'EAUTH') {
    console.error('\n🔧 Solution for EAUTH error:');
    console.error('  1. Check if 2-Step Verification is enabled on Gmail');
    console.error('  2. Generate a new App Password');
    console.error('  3. Make sure EMAIL_PASSWORD is the App Password, not regular password');
  }
  
  if (error.code === 'ECONNECTION') {
    console.error('\n🔧 Solution for ECONNECTION error:');
    console.error('  1. Check if Gmail SMTP is accessible');
    console.error('  2. Try using port 587 instead of 465');
    console.error('  3. Check firewall/network restrictions');
  }
}

console.log('\n🏁 Email configuration test completed!');
console.log('\n📚 Next steps:');
console.log('  1. Check Vercel environment variables');
console.log('  2. Verify Gmail App Password');
console.log('  3. Redeploy after fixing environment variables');
console.log('  4. Check Vercel function logs for detailed error information');
