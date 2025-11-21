const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('modules', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_published: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      difficulty: {
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        allowNull: true,
      },
      estimated_hours: {
        type: DataTypes.DECIMAL(4, 1),
        allowNull: true,
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      technologies: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      prerequisites: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      version: {
        type: DataTypes.STRING(20),
        defaultValue: '1.0.0',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('modules', ['course_id']);
    await queryInterface.addIndex('modules', ['slug']);
    await queryInterface.addIndex('modules', ['is_published']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('modules');
  },
};
