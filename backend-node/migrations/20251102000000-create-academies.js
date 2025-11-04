'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    await queryInterface.createTable('academies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.STRING(1000),
        allowNull: true
      },
      is_published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      version: {
        type: Sequelize.STRING(20),
        defaultValue: '1.0.0',
        allowNull: false
      },
      theme: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('academies', ['slug'], {
      name: 'academies_slug_idx',
      unique: true
    });

    await queryInterface.addIndex('academies', ['is_published'], {
      name: 'academies_is_published_idx'
    });

    // Create default academy
    await queryInterface.sequelize.query(`
      INSERT INTO academies (name, slug, description, is_published, version, created_at, updated_at)
      VALUES ('GlassCode Academy', 'glasscode-academy', 'Default GlassCode Academy', true, '1.0.0', NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING;
    `);
  },

  async down({ queryInterface, Sequelize }) {
    await queryInterface.dropTable('academies');
  }
};