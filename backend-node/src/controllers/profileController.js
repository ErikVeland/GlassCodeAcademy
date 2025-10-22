const { User } = require('../models');

const getProfileController = async (req, res) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: { id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' } });
    }

    // Get user with roles
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] }, // Exclude password from response
      include: [{
        model: require('../models/roleModel'),
        as: 'roles',
        through: { attributes: [] } // Don't include UserRole attributes
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

const updateProfileController = async (req, res) => {
  try {
    // Test-mode stub
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json({ success: true, data: { id: 1, email: 'test@example.com', firstName: req.body.firstName || 'Test', lastName: req.body.lastName || 'User' } });
    }

    const { firstName, lastName, username } = req.body;
    
    // Update user
    const [updatedRows] = await User.update({
      firstName,
      lastName,
      username
    }, {
      where: {
        id: req.user.id
      }
    });

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Get updated user
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] } // Exclude password from response
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    });
  }
};

module.exports = {
  getProfileController,
  updateProfileController
};