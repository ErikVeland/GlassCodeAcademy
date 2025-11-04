/* eslint-env node */
/* global require, console, process */
const sequelize = require('../src/config/database');
const { Course, Module, Lesson, User, Role, Tier, initializeAssociations } = require('../src/models');
const { ForumCategory } = require('../src/models');

console.log('Seeding using DATABASE_URL:', process.env.DATABASE_URL || '(not set)');
console.log('Seeding using DB_DIALECT:', process.env.DB_DIALECT || '(not set)');

async function seedDatabase() {
  try {
    // Initialize model associations
    initializeAssociations();
    
    // Conditional sync: only for Postgres environments
    const shouldSync = process.env.DB_DIALECT === 'postgres';
    if (shouldSync) {
      await sequelize.sync({ force: true });
      console.log('Database synced via sequelize for Postgres dialect');
    } else {
      console.log('Skipping sequelize.sync — using existing migrated schema');
    }
    
    // Create roles idempotently
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: { description: 'Administrator role' }
    });
    const [userRole] = await Role.findOrCreate({
      where: { name: 'user' },
      defaults: { description: 'Regular user role' }
    });
    
    console.log('Roles created successfully!');
    
    // Create tiers idempotently aligned with content registry
    const tiers = [
      {
        key: 'foundational',
        level: 1,
        title: 'Foundational',
        description: 'Build essential programming skills and concepts',
        focusArea: 'Programming basics, web fundamentals, version control',
        color: 'from-blue-500 to-cyan-500',
        learningObjectives: [
          'Master basic programming concepts',
          'Understand web development fundamentals',
          'Learn version control workflows'
        ]
      },
      {
        key: 'core',
        level: 2,
        title: 'Core Technologies',
        description: 'Master primary development technologies',
        focusArea: 'Essential technologies (.NET, React, Database, Backend frameworks)',
        color: 'from-green-500 to-emerald-500',
        learningObjectives: [
          'Master core backend technologies',
          'Build sophisticated frontend applications',
          'Design and optimize database systems'
        ]
      },
      {
        key: 'specialized',
        level: 3,
        title: 'Specialised Skills',
        description: 'Develop expertise in modern development practices',
        focusArea: 'Advanced frameworks (Next.js, GraphQL, DevOps)',
        color: 'from-purple-500 to-violet-500',
        learningObjectives: [
          'Master advanced frontend frameworks',
          'Build scalable API architectures',
          'Implement modern DevOps practices'
        ]
      },
      {
        key: 'quality',
        level: 4,
        title: 'Quality & Testing',
        description: 'Professional quality assurance capabilities',
        focusArea: 'Testing, performance, security',
        color: 'from-orange-500 to-red-500',
        learningObjectives: [
          'Implement comprehensive testing strategies',
          'Optimize application performance',
          'Secure applications with best practices'
        ]
      }
    ];

    for (const tier of tiers) {
      await Tier.findOrCreate({
        where: { key: tier.key },
        defaults: tier,
      });
    }

    console.log('Tiers created successfully!');
    
    // Create forum categories
    const forumCategories = [
      {
        name: 'General Discussion',
        description: 'General discussions about programming, career advice, and learning resources',
        slug: 'general-discussion',
        order: 1,
        icon: '💬'
      },
      {
        name: 'Web Development',
        description: 'Questions and discussions about web development technologies',
        slug: 'web-development',
        order: 2,
        icon: '🌐'
      },
      {
        name: 'Backend Development',
        description: 'Backend frameworks, databases, and server-side technologies',
        slug: 'backend-development',
        order: 3,
        icon: '⚙️'
      },
      {
        name: 'Frontend Development',
        description: 'Frontend frameworks, UI/UX, and client-side technologies',
        slug: 'frontend-development',
        order: 4,
        icon: '🎨'
      },
      {
        name: 'DevOps & Deployment',
        description: 'CI/CD, deployment, containers, and infrastructure',
        slug: 'devops-deployment',
        order: 5,
        icon: '🚀'
      },
      {
        name: 'Career & Jobs',
        description: 'Career advice, job postings, and professional development',
        slug: 'career-jobs',
        order: 6,
        icon: '💼'
      }
    ];

    for (const category of forumCategories) {
      await ForumCategory.findOrCreate({
        where: { slug: category.slug },
        defaults: category,
      });
    }

    console.log('Forum categories created successfully!');
    
    // Create a sample course
    const [course] = await Course.findOrCreate({
      where: { slug: 'web-fundamentals' },
      defaults: {
        title: 'Web Development Fundamentals',
        description: 'Learn the fundamentals of web development',
        isPublished: true,
        order: 1,
        difficulty: 'Beginner',
        estimatedHours: 10,
      }
    });
    
    console.log('Course created successfully!');
    
    // Create a sample module
    const [module] = await Module.findOrCreate({
      where: { slug: 'html-basics' },
      defaults: {
        title: 'HTML Basics',
        description: 'Introduction to HTML',
        order: 1,
        isPublished: true,
        course_id: course.id
      }
    });
    
    console.log('Module created successfully!');
    
    // Create a sample lesson
    await Lesson.findOrCreate({
      where: { slug: 'html-structure', module_id: module.id },
      defaults: {
        title: 'HTML Structure',
        order: 1,
        content: {
          type: 'html',
          content: '<p>HTML stands for HyperText Markup Language</p>'
        },
        isPublished: true,
        difficulty: 'Beginner',
        estimatedMinutes: 30,
        module_id: module.id
      }
    });
    
    console.log('Lesson created successfully!');
    
    // Create a sample user
    const [adminUser] = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: 'password123',
        role: 'admin'
      }
    });
    
    console.log('User created successfully with ID:', adminUser.id);
    
<<<<<<< Local
    // Assign admin role to admin user
    const UserRole = require('../src/models/userRoleModel');
    try {
      // Try to find if the association already exists
      const existingAssoc = await UserRole.findOne({
        where: { 
          userId: adminUser.id,
          roleId: adminRole.id
        }
      });
      
      if (!existingAssoc) {
        // Create the association manually
        await UserRole.create({
          userId: adminUser.id,
          roleId: adminRole.id,
          assignedAt: new Date()
        });
        console.log('Admin role assigned to admin user successfully!');
      } else {
        console.log('Admin user already has admin role assigned.');
      }
    } catch (error) {
      console.error('Error assigning admin role:', error.message);
    }
    
    // Create default forum categories
    const ForumCategory = require('../src/models/forumCategoryModel');
    
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
    
=======
    // Assign admin role to admin user
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (adminRole) {
      console.log('Admin role found with ID:', adminRole.id);
      const UserRole = require('../src/models/userRoleModel');
      try {
        // Try to find if the association already exists
        const existingUserRole = await UserRole.findOne({
          where: { 
            userId: adminUser.id,
            roleId: adminRole.id
          }
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
    
>>>>>>> Remote
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