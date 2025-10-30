const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');
const { User } = require('../models');
const logger = require('../utils/logger');

// Generate password reset token
const generatePasswordResetToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, action: 'password-reset' },
    jwtSecret,
    { expiresIn: '1h' } // Token expires in 1 hour
  );
};

// Verify password reset token
const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, jwtSecret);

    // Check if this is a password reset token
    if (decoded.action !== 'password-reset') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Request password reset
const requestPasswordReset = async (email) => {
  try {
    // Find user
    const user = await User.findOne({
      where: {
        email,
      },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { success: true };
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(user);

    // In a real application, you would send an email here
    // For now, we'll just log it
    logger.info(
      `Password reset token generated for user ${user.email}: ${resetToken}`
    );

    // Return success (in real app, you'd send email)
    return {
      success: true,
      // In a real app, you wouldn't return the token in the response
      // This is just for testing purposes
      token: resetToken,
    };
  } catch (error) {
    logger.error('Error requesting password reset:', error);
    throw error;
  }
};

// Reset password
const resetPassword = async (token, newPassword) => {
  try {
    // Verify token
    const decoded = verifyPasswordResetToken(token);

    // Find user
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Update password
    await user.update({
      passwordHash: newPassword,
    });

    logger.info(`Password reset successfully for user ${user.email}`);

    return { success: true };
  } catch (error) {
    logger.error('Error resetting password:', error);
    throw error;
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
