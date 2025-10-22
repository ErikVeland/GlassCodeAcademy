const sequelize = require('../src/config/database');
const { 
  Course, 
  Module, 
  Lesson, 
  User,
  Role,
  initializeAssociations 
} = require('../src/models');

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
        "type": "html",
        "content": "<p>HTML stands for HyperText Markup Language</p>"
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
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();