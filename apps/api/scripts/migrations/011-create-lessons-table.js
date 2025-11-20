const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('lessons', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      module_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'modules',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      content: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      difficulty: {
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        allowNull: true
      },
      estimated_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      version: {
        type: DataTypes.STRING(20),
        defaultValue: '1.0.0'
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      academy_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      workflow_state: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      current_version_id: {
        type: DataTypes.UUID,
        allowNull: true
      },
      quality_score: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      last_validated_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });
    
    // Add indexes for better query performance
    await queryInterface.addIndex('lessons', ['module_id']);
    await queryInterface.addIndex('lessons', ['slug']);
    await queryInterface.addIndex('lessons', ['is_published']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('lessons');
  }
};