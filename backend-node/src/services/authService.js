const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { jwtSecret, jwtExpiresIn } = require('../config/auth');
const { User } = require('../models');

const generateToken = (user) => {
  return jwt.sign({ userId: user.id, email: user.email }, jwtSecret, {
    expiresIn: jwtExpiresIn,
  });
};

const register = async (userData) => {
  // Check if user already exists
  const existingUser = await User.findOne({
    where: {
      email: userData.email,
    },
  });

  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  // Create user
  const user = await User.create({
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    passwordHash: userData.password,
  });

  // Generate token
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    token,
  };
};

const login = async (email, password) => {
  // Find user
  const user = await User.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Validate password
  const isValidPassword = await user.validatePassword(password);

  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Update last login
  await user.update({
    lastLoginAt: new Date(),
  });

  // Generate token
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    token,
  };
};

module.exports = {
  register,
  login,
  generateToken,
};
