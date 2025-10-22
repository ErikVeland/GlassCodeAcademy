const { register, login } = require('../services/authService');

const registerController = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    const result = await register({
      email,
      password,
      firstName,
      lastName
    });
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message
      }
    });
  }
};

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await login(email, password);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: error.message
      }
    });
  }
};

module.exports = {
  registerController,
  loginController
};