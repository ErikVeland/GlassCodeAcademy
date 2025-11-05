const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
(() => {
  const isProd = process.env.NODE_ENV === 'production';
  const envCandidates = isProd
    ? [
      path.resolve(__dirname, '../.env.production'),
      path.resolve(__dirname, '../.env'),
    ]
    : [
      path.resolve(__dirname, '../.env'),
      path.resolve(__dirname, '../.env.production'),
    ];
  for (const p of envCandidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }
})();

const sequelize = require('../src/config/database');
const User = require('../src/models/userModel');
const Role = require('../src/models/roleModel');
const UserRole = require('../src/models/userRoleModel');
const ForumCategory = require('../src/models/forumCategoryModel');

async function seedDatabase() {
  try {
    // Authenticate database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Create default roles if they don't exist
    const roles = [
      { name: 'admin', description: 'Administrator with full access' },
      { name: 'instructor', description: 'Instructor with course management access' },
      { name: 'student', description: 'Student user' },
      { name: 'guest', description: 'Guest user with limited access' }
    ];

    for (const roleData of roles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: { ...roleData, is_active: true }
      });
      
      if (created) {
        console.log(`Created role: ${role.name}`);
      } else {
        console.log(`Role already exists: ${role.name}`);
      }
    }

    // Create admin user if it doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    const [adminUser, userCreated] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        email: adminEmail,
        passwordHash: adminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }
    });
    
    if (userCreated) {
      console.log('Admin user created successfully with ID:', adminUser.id);
    } else {
      console.log('Admin user already exists with ID:', adminUser.id);
    }
    
    // Assign admin role to admin user
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (adminRole) {
      console.log('Admin role found with ID:', adminRole.id);
      try {
        // Try to find if the association already exists
        const existingUserRole = await UserRole.findOne({
          where: { 
            userId: adminUser.id,
            roleId: adminRole.id
          },
          attributes: ['userId', 'roleId'] // Don't select id field since it doesn't exist
        });
        
        if (!existingUserRole) {
          console.log('Creating new UserRole with userId:', adminUser.id, 'and roleId:', adminRole.id);
          // Use raw SQL query to create the association
          await sequelize.query(
            'INSERT INTO user_roles (user_id, role_id, assigned_at, created_at, updated_at) VALUES (?, ?, NOW(), NOW(), NOW())',
            {
              replacements: [adminUser.id, adminRole.id],
              type: sequelize.QueryTypes.INSERT
            }
          );
          console.log('Admin role assigned to admin user successfully!');
        } else {
          console.log('Admin user already has admin role assigned.');
        }
      } catch (error) {
        console.error('Error assigning admin role:', error.message);
        console.error('Full error:', error);
        console.error('User ID:', adminUser.id);
        console.error('Role ID:', adminRole.id);
      }
    }
    
    // Create default forum categories
    const defaultCategories = [
      {
        name: 'General Discussion',
        slug: 'general-discussion',
        description: 'General discussions about programming, technology, and learning',
        order: 1,
        is_active: true
      },
      {
        name: 'Course Help',
        slug: 'course-help',
        description: 'Get help with course content, lessons, and exercises',
        order: 2,
        is_active: true
      },
      {
        name: 'Career Advice',
        slug: 'career-advice',
        description: 'Discuss career paths, job opportunities, and professional development',
        order: 3,
        is_active: true
      },
      {
        name: 'Show & Tell',
        slug: 'show-and-tell',
        description: 'Share your projects, achievements, and learning milestones',
        order: 4,
        is_active: true
      }
    ];
    
    for (const category of defaultCategories) {
      await ForumCategory.findOrCreate({
        where: { name: category.name },
        defaults: category,
      });
    }
    
    console.log('Forum categories created successfully!');
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error?.message || error);
    if (error?.original) {
      console.error('Original error:', error.original);
    }
    if (error?.parent) {
      console.error('Parent error:', error.parent);
    }
    console.error('Full error object:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
}

seedDatabase();