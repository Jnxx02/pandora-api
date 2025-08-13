const passwordResetStore = require('./passwordResetStore');

console.log('🧪 Testing Password Reset Token Store...\n');

// Test 1: Generate token
console.log('📝 Test 1: Generate token');
const token = passwordResetStore.generateResetToken();
console.log('Generated token:', token);
console.log('Token length:', token.length);
console.log('');

// Test 2: Store token
console.log('📝 Test 2: Store token');
const adminData = {
  username: 'test-admin',
  email: 'test@example.com',
  timestamp: Date.now()
};
passwordResetStore.storeResetToken(token, adminData);
console.log('Token stored successfully');
console.log('');

// Test 3: Retrieve token
console.log('📝 Test 3: Retrieve token');
const retrievedData = passwordResetStore.getResetToken(token);
console.log('Retrieved data:', retrievedData);
console.log('');

// Test 4: Check active tokens
console.log('📝 Test 4: Check active tokens');
const activeTokens = passwordResetStore.getActiveTokens();
console.log('Active tokens count:', activeTokens.length);
console.log('Active tokens:', activeTokens);
console.log('');

// Test 5: Remove token
console.log('📝 Test 5: Remove token');
passwordResetStore.removeResetToken(token);
console.log('Token removed');
console.log('');

// Test 6: Check after removal
console.log('📝 Test 6: Check after removal');
const retrievedAfterRemoval = passwordResetStore.getResetToken(token);
console.log('Token after removal:', retrievedAfterRemoval);
console.log('');

// Test 7: Check active tokens after removal
console.log('📝 Test 7: Check active tokens after removal');
const activeTokensAfterRemoval = passwordResetStore.getActiveTokens();
console.log('Active tokens count after removal:', activeTokensAfterRemoval.length);
console.log('');

console.log('✅ All tests completed!');
