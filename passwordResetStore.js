// Temporary storage untuk reset password admin
// Dalam production, sebaiknya menggunakan database atau Redis

class PasswordResetStore {
  constructor() {
    this.resetTokens = new Map();
    this.tokenExpiry = 15 * 60 * 1000; // 15 menit
  }

  // Generate token reset password
  generateResetToken() {
    const token = Math.random().toString(36).substr(2, 15) + 
                  Date.now().toString(36) + 
                  Math.random().toString(36).substr(2, 15);
    return token;
  }

  // Simpan token reset password
  storeResetToken(token, adminData) {
    const expiryTime = Date.now() + this.tokenExpiry;
    
    this.resetTokens.set(token, {
      ...adminData,
      expiryTime,
      createdAt: Date.now()
    });

    // Cleanup expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  // Ambil data reset token
  getResetToken(token) {
    const tokenData = this.resetTokens.get(token);
    
    if (!tokenData) {
      return null;
    }

    // Check if token expired
    if (Date.now() > tokenData.expiryTime) {
      this.resetTokens.delete(token);
      return null;
    }

    return tokenData;
  }

  // Hapus token setelah digunakan
  removeResetToken(token) {
    this.resetTokens.delete(token);
  }

  // Cleanup expired tokens
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.resetTokens.entries()) {
      if (now > data.expiryTime) {
        this.resetTokens.delete(token);
      }
    }
  }

  // Get all active tokens (for debugging)
  getActiveTokens() {
    this.cleanupExpiredTokens();
    return Array.from(this.resetTokens.entries()).map(([token, data]) => ({
      token,
      adminUsername: data.username,
      createdAt: new Date(data.createdAt).toISOString(),
      expiresAt: new Date(data.expiryTime).toISOString(),
      isExpired: Date.now() > data.expiryTime
    }));
  }

  // Clear all tokens (for testing)
  clearAllTokens() {
    this.resetTokens.clear();
  }
}

// Create singleton instance
const passwordResetStore = new PasswordResetStore();

module.exports = passwordResetStore;
