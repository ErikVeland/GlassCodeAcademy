/* eslint-env node */
/* global console */

const sequelize = require('./src/config/database');

async function fixUserRoleWithSQL() {
  try {
    // Insert the UserRole association directly with SQL
    const [result] = await sequelize.query(
      `INSERT INTO user_roles (user_id, role_id, assigned_at, created_at, updated_at) 
       VALUES (1, 1, NOW(), NOW(), NOW()) 
       ON CONFLICT (user_id, role_id) DO NOTHING
       RETURNING *`
    );
    
    if (result) {
      console.log('UserRole association created successfully:', result);
    } else {
      console.log('UserRole association already exists or creation failed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixUserRoleWithSQL();