// Mock auth service for testing
const register = async (userData) => {
  return {
    user: {
      id: 1,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName
    },
    token: 'mock-jwt-token'
  };
};

const login = async (email, password) => {
  if (email === 'nonexistent@test.com') {
    throw new Error('Invalid credentials');
  }
  
  return {
    user: {
      id: 1,
      email: email,
      firstName: 'Test',
      lastName: 'User'
    },
    token: 'mock-jwt-token'
  };
};

const generateToken = (user) => {
  return 'mock-jwt-token';
};

module.exports = {
  register,
  login,
  generateToken
};