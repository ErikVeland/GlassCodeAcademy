const { User, Role, UserRole, initializeAssociations } = require('./src/models');
const sequelize = require('./src/config/database');

async function testUserRole() {
  try {
    // Initialize associations
    initializeAssociations();
    
    // Check if admin user exists
    const adminUser = await User.findOne({
      where: { email: 'admin@example.com' }
    });
    
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }
    
    console.log('Admin user found:', adminUser.toJSON());
    
    // Check if admin role exists
    const adminRole = await Role.findOne({
      where: { name: 'admin' }
    });
    
    if (!adminRole) {
      console.log('Admin role not found');
      return;
    }
    
    console.log('Admin role found:', adminRole.toJSON());
    
    // Check if UserRole association exists
    const userRole = await UserRole.findOne({
      where: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });
    
    if (!userRole) {
      console.log('UserRole association not found');
      return;
    }
    
    console.log('UserRole association found:', userRole.toJSON());
    
    // Test fetching user with roles
    const userWithRoles = await User.findByPk(adminUser.id, {
      include: [
        {
          model: Role,
          as: 'userRoles',
          through: { attributes: [] }
        }
      ]
    });
    
    console.log('User with roles:', userWithRoles.toJSON());
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

testUserRole();