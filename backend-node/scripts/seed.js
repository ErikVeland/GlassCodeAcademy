const sequelize = require('../src/config/database');
const { Course, Module, Lesson, User, Role, Tier, initializeAssociations } = require('../src/models');

console.log('Seeding using DATABASE_URL:', process.env.DATABASE_URL || '(not set)');
console.log('Seeding using DB_DIALECT:', process.env.DB_DIALECT || '(not set)');

async function seedDatabase() {
  try {
    // Initialize model associations
    initializeAssociations();
    
    // Sync all models
    await sequelize.sync({ force: true });
    
    console.log('Database synced successfully!');
    
    // Create roles
    const adminRole = await Role.create({
      name: 'admin',
      description: 'Administrator role'
    });
    
    const userRole = await Role.create({
      name: 'user',
      description: 'Regular user role'
    });
    
    console.log('Roles created successfully!');
    
    // Create tiers aligned with content registry
    await Tier.bulkCreate([
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
    ]);

    console.log('Tiers created successfully!');
    
    // Create a sample course
    const course = await Course.create({
      title: 'Web Development Fundamentals',
      description: 'Learn the fundamentals of web development',
      slug: 'web-fundamentals',
      isPublished: true,
      order: 1,
      difficulty: 'Beginner',
      estimatedHours: 10
    });
    
    console.log('Course created successfully!');
    
    // Create a sample module
    const module = await Module.create({
      title: 'HTML Basics',
      description: 'Introduction to HTML',
      slug: 'html-basics',
      order: 1,
      isPublished: true,
      course_id: course.id
    });
    
    console.log('Module created successfully!');
    
    // Create a sample lesson
    const lesson = await Lesson.create({
      title: 'HTML Structure',
      slug: 'html-structure',
      order: 1,
      content: {
        type: 'html',
        content: '<p>HTML stands for HyperText Markup Language</p>'
      },
      isPublished: true,
      difficulty: 'Beginner',
      estimatedMinutes: 30,
      module_id: module.id
    });
    
    console.log('Lesson created successfully!');
    
    // Create a sample user
    const user = await User.create({
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      passwordHash: 'password123'
    });
    
    console.log('User created successfully!');
    
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