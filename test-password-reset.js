// Test script untuk sistem reset password admin
const { sendPasswordResetEmail, sendPasswordChangeConfirmationEmail } = require('./emailConfig');
const passwordResetStore = require('./passwordResetStore');

async function testPasswordResetSystem() {
  console.log('🧪 Testing Password Reset System...\n');

  try {
    // Test 1: Generate reset token
    console.log('1️⃣ Testing token generation...');
    const resetToken = passwordResetStore.generateResetToken();
    console.log(`✅ Token generated: ${resetToken}\n`);

    // Test 2: Store token
    console.log('2️⃣ Testing token storage...');
    const adminData = {
      username: 'admin',
      email: 'desa.moncongloebulu@gmail.com',
      requestTime: Date.now()
    };
    
    passwordResetStore.storeResetToken(resetToken, adminData);
    console.log('✅ Token stored successfully\n');

    // Test 3: Retrieve token
    console.log('3️⃣ Testing token retrieval...');
    const retrievedToken = passwordResetStore.getResetToken(resetToken);
    if (retrievedToken) {
      console.log('✅ Token retrieved successfully');
      console.log(`   Username: ${retrievedToken.username}`);
      console.log(`   Email: ${retrievedToken.email}`);
      console.log(`   Expires at: ${new Date(retrievedToken.expiryTime).toLocaleString()}\n`);
    } else {
      console.log('❌ Failed to retrieve token\n');
    }

    // Test 4: Send reset email
    console.log('4️⃣ Testing reset email...');
    const emailResult = await sendPasswordResetEmail(
      resetToken, 
      'admin', 
      'desa.moncongloebulu@gmail.com'
    );
    
    if (emailResult.success) {
      console.log('✅ Reset email sent successfully');
      console.log(`   Message ID: ${emailResult.messageId}\n`);
    } else {
      console.log('❌ Failed to send reset email');
      console.log(`   Error: ${emailResult.error}\n`);
    }

    // Test 5: Test token expiry
    console.log('5️⃣ Testing token expiry...');
    const activeTokens = passwordResetStore.getActiveTokens();
    console.log(`   Active tokens: ${activeTokens.length}`);
    activeTokens.forEach(token => {
      console.log(`   - ${token.token.substring(0, 20)}... (expires: ${token.expiresAt})`);
    });
    console.log('');

    // Test 6: Remove token
    console.log('6️⃣ Testing token removal...');
    passwordResetStore.removeResetToken(resetToken);
    const removedToken = passwordResetStore.getResetToken(resetToken);
    if (!removedToken) {
      console.log('✅ Token removed successfully\n');
    } else {
      console.log('❌ Failed to remove token\n');
    }

    // Test 7: Send confirmation email
    console.log('7️⃣ Testing confirmation email...');
    const changeTime = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const confirmationResult = await sendPasswordChangeConfirmationEmail(
      'admin',
      changeTime,
      'desa.moncongloebulu@gmail.com'
    );
    
    if (confirmationResult.success) {
      console.log('✅ Confirmation email sent successfully');
      console.log(`   Message ID: ${confirmationResult.messageId}\n`);
    } else {
      console.log('❌ Failed to send confirmation email');
      console.log(`   Error: ${confirmationResult.error}\n`);
    }

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testPasswordResetSystem();
}

module.exports = { testPasswordResetSystem };
