/* eslint-env node */
/* global console */

const { User, Role, UserRole, initializeAssociations } = require('./src/models');
const sequelize = require('./src/config/database');

async function fixUserRole() {
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
    
    // Check if UserRole association already exists
    const existingUserRole = await UserRole.findOne({
      where: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });
    
    if (existingUserRole) {
      console.log('UserRole association already exists:', existingUserRole.toJSON());
      return;
    }
    
    // Create the UserRole association
    const newUserRole = await UserRole.create({
      userId: adminUser.id,
      roleId: adminRole.id,
      assignedAt: new Date()
    });
    
    console.log('UserRole association created successfully:', newUserRole.toJSON());
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixUserRole();