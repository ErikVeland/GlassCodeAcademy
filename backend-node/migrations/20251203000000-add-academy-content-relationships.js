'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async ({ queryInterface, Sequelize }) => {
    const sequelize = queryInterface.sequelize || Sequelize;
    const transaction = await sequelize.transaction();
    
    try {
      // Add academy_id to courses
      await queryInterface.addColumn('courses', 'academy_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'academies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });
      
      // Add academy_id to modules
      await queryInterface.addColumn('modules', 'academy_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'academies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });
      
      // Add academy_id to lessons
      await queryInterface.addColumn('lessons', 'academy_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'academies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });
      
      // Add academy_id to lesson_quizzes
      await queryInterface.addColumn('lesson_quizzes', 'academy_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'academies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }, { transaction });
      
      // Create default academy for existing content (or use existing one)
      let defaultAcademyId;
      const [existingAcademy] = await queryInterface.sequelize.query(
        `SELECT id FROM academies WHERE slug = 'glasscode-academy' LIMIT 1;`,
        { transaction }
      );
      
      if (existingAcademy && existingAcademy.length > 0) {
        defaultAcademyId = existingAcademy[0].id;
        console.log(`✓ Using existing academy with ID: ${defaultAcademyId}`);
      } else {
        const [defaultAcademyResult] = await queryInterface.sequelize.query(
          `INSERT INTO academies (name, slug, description, is_published, version, created_at, updated_at) 
           VALUES ('GlassCode Academy', 'glasscode-academy', 'The original GlassCode Academy content', true, '1.0.0', NOW(), NOW()) 
           RETURNING id;`,
          { transaction }
        );
        defaultAcademyId = defaultAcademyResult[0].id;
        console.log(`✓ Created new default academy with ID: ${defaultAcademyId}`);
      }
      
      // Assign existing content to default academy
      await queryInterface.sequelize.query(
        `UPDATE courses SET academy_id = ${defaultAcademyId} WHERE academy_id IS NULL;`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `UPDATE modules SET academy_id = ${defaultAcademyId} WHERE academy_id IS NULL;`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `UPDATE lessons SET academy_id = ${defaultAcademyId} WHERE academy_id IS NULL;`,
        { transaction }
      );
      await queryInterface.sequelize.query(
        `UPDATE lesson_quizzes SET academy_id = ${defaultAcademyId} WHERE academy_id IS NULL;`,
        { transaction }
      );
      
      // Make academy_id NOT NULL after data migration
      await queryInterface.changeColumn('courses', 'academy_id', {
        type: Sequelize.INTEGER,
        allowNull: false
      }, { transaction });
      
      await queryInterface.changeColumn('modules', 'academy_id', {
        type: Sequelize.INTEGER,
        allowNull: false
      }, { transaction });
      
      await queryInterface.changeColumn('lessons', 'academy_id', {
        type: Sequelize.INTEGER,
        allowNull: false
      }, { transaction });
      
      await queryInterface.changeColumn('lesson_quizzes', 'academy_id', {
        type: Sequelize.INTEGER,
        allowNull: false
      }, { transaction });
      
      // Add indexes for performance
      await queryInterface.addIndex('courses', ['academy_id'], {
        name: 'courses_academy_id_idx',
        transaction
      });
      
      await queryInterface.addIndex('modules', ['academy_id'], {
        name: 'modules_academy_id_idx',
        transaction
      });
      
      await queryInterface.addIndex('lessons', ['academy_id'], {
        name: 'lessons_academy_id_idx',
        transaction
      });
      
      await queryInterface.addIndex('lesson_quizzes', ['academy_id'], {
        name: 'lesson_quizzes_academy_id_idx',
        transaction
      });
      
      // Add composite index for academy + slug uniqueness
      await queryInterface.addIndex('courses', ['academy_id', 'slug'], {
        name: 'courses_academy_slug_unique',
        unique: true,
        transaction
      });
      
      await queryInterface.addIndex('modules', ['academy_id', 'slug'], {
        name: 'modules_academy_slug_unique',
        unique: true,
        transaction
      });
      
      await queryInterface.addIndex('lessons', ['academy_id', 'slug'], {
        name: 'lessons_academy_slug_unique',
        unique: true,
        transaction
      });
      
      await transaction.commit();
      console.log('✓ Successfully added academy_id to all content tables');
      console.log('✓ All existing content assigned to default academy');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  
  down: async ({ queryInterface, Sequelize }) => {
    const sequelize = queryInterface.sequelize || Sequelize;
    const transaction = await sequelize.transaction();
    
    try {
      // Remove indexes
      await queryInterface.removeIndex('courses', 'courses_academy_slug_unique', { transaction });
      await queryInterface.removeIndex('modules', 'modules_academy_slug_unique', { transaction });
      await queryInterface.removeIndex('lessons', 'lessons_academy_slug_unique', { transaction });
      await queryInterface.removeIndex('courses', 'courses_academy_id_idx', { transaction });
      await queryInterface.removeIndex('modules', 'modules_academy_id_idx', { transaction });
      await queryInterface.removeIndex('lessons', 'lessons_academy_id_idx', { transaction });
      await queryInterface.removeIndex('lesson_quizzes', 'lesson_quizzes_academy_id_idx', { transaction });
      
      // Remove columns
      await queryInterface.removeColumn('courses', 'academy_id', { transaction });
      await queryInterface.removeColumn('modules', 'academy_id', { transaction });
      await queryInterface.removeColumn('lessons', 'academy_id', { transaction });
      await queryInterface.removeColumn('lesson_quizzes', 'academy_id', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
