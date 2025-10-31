const {
  requestPasswordReset,
  resetPassword,
} = require('../services/passwordResetService');

const requestPasswordResetController = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await requestPasswordReset(email);

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: {
        message:
          'If your email exists in our system, you will receive password reset instructions.',
      },
    };

    res.status(200).json(successResponse);
  } catch (error) {
    next(error);
  }
};

const resetPasswordController = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const result = await resetPassword(token, newPassword);

    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: {
        message: 'Password reset successfully',
      },
    };

    res.status(200).json(successResponse);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestPasswordResetController,
  resetPasswordController,
};
