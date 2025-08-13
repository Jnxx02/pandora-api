const { sendPasswordResetEmail } = require('./emailConfig');
const passwordResetStore = require('./passwordResetStore');

async function testPasswordResetRequest() {
  try {
    console.log('🚀 Testing Password Reset Request...');
    console.log('📧 Target Email: moncongloebulu.desa@gmail.com');
    
    // Generate reset token
    const resetToken = passwordResetStore.generateResetToken();
    console.log('🔑 Generated Reset Token:', resetToken);
    
    // Store token with admin data
    const adminData = {
      email: 'moncongloebulu.desa@gmail.com',
      username: 'admin',
      timestamp: new Date().toISOString()
    };
    
    passwordResetStore.storeResetToken(resetToken, adminData);
    console.log('💾 Token stored successfully');
    
    // Send password reset email
    console.log('📤 Sending password reset email...');
    await sendPasswordResetEmail('moncongloebulu.desa@gmail.com', resetToken);
    
    console.log('✅ Password reset email sent successfully!');
    console.log('📧 Check email: moncongloebulu.desa@gmail.com');
    console.log('🔗 Reset link will be in the email');
    
    // Show active tokens
    const activeTokens = passwordResetStore.getActiveTokens();
    console.log('🔍 Active tokens:', activeTokens);
    
  } catch (error) {
    console.error('❌ Error during password reset request:', error);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔐 Authentication Error:');
      console.error('   - Check if Gmail App Password is correct');
      console.error('   - Make sure 2-Step Verification is enabled');
      console.error('   - Verify the email credentials');
    }
  }
}

// Run test if called directly
if (require.main === module) {
  testPasswordResetRequest();
}

module.exports = { testPasswordResetRequest };
