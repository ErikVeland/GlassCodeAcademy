'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up({ queryInterface, Sequelize }) {
    // Create table if it doesn't exist
    try {
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
    } catch (err) {
      const code = (err.parent && err.parent.code) || err.code;
      const msg = (err.parent && err.parent.message || err.message || '').toLowerCase();
      // Skip if table already exists
      if (!(code === '42P07' || /already exists/.test(msg))) {
        throw err;
      }
    }

    // Ensure required columns exist
    let columns = {};
    try {
      columns = await queryInterface.describeTable('academies');
    } catch (err) {
      // If describe fails because table doesn't exist, rethrow
      const code = (err.parent && err.parent.code) || err.code;
      if (code === '42P01') throw err;
    }

    if (!columns.is_published) {
      await queryInterface.addColumn('academies', 'is_published', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    }

    if (!columns.created_at) {
      await queryInterface.addColumn('academies', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      });
    }

    if (!columns.updated_at) {
      await queryInterface.addColumn('academies', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      });
    }

    // Backfill missing JSON fields used by API
    if (!columns.theme) {
      await queryInterface.addColumn('academies', 'theme', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }

    if (!columns.metadata) {
      await queryInterface.addColumn('academies', 'metadata', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }

    // Add indexes
    try {
      await queryInterface.addIndex('academies', ['slug'], {
        name: 'academies_slug_idx',
        unique: true
      });
    } catch (err) {
      // ignore duplicate index
    }

    try {
      await queryInterface.addIndex('academies', ['is_published'], {
        name: 'academies_is_published_idx'
      });
    } catch (err) {
      // ignore duplicate index
    }

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