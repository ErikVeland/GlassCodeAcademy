const {
  requestPasswordReset,
  resetPassword,
} = require('../services/passwordResetService');

const requestPasswordResetController = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await requestPasswordReset(email);

    res.status(200).json({
      success: true,
      data: {
        message:
          'If your email exists in our system, you will receive password reset instructions.',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    });
  }
};

const resetPasswordController = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const result = await resetPassword(token, newPassword);

    res.status(200).json({
      success: true,
      data: {
        message: 'Password reset successfully',
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
      },
    });
  }
};

module.exports = {
  requestPasswordResetController,
  resetPasswordController,
};
