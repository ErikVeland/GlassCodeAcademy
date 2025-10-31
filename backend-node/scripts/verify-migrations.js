#!/usr/bin/env node

// Script to verify that migrations have been applied correctly
const sequelize = require('../src/config/database');

async function verifyMigrations() {
    try {
        // Authenticate database connection
        await sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Check if SequelizeMeta table exists and has entries
        const [results] = await sequelize.query(
            "SELECT COUNT(*) as count FROM \"SequelizeMeta\""
        );
        
        if (results.count > 0) {
            console.log(`✅ ${results.count} migrations have been applied`);
        } else {
            console.log('⚠️  No migrations found in SequelizeMeta table');
        }
        
        // Check for existence of key tables
        const tablesToCheck = [
            'api_keys', 'notifications', 'notification_preferences',
            'forum_categories', 'forum_threads', 'forum_posts',
            'forum_votes', 'announcements', 'faqs',
            'moderation_actions', 'reports'
        ];
        
        for (const table of tablesToCheck) {
            try {
                await sequelize.query(`SELECT 1 FROM "${table}" LIMIT 1`);
                console.log(`✅ Table ${table} exists`);
            } catch (error) {
                console.log(`❌ Table ${table} does not exist or is not accessible`);
            }
        }
        
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration verification failed:', error.message);
        process.exit(1);
    }
}

verifyMigrations();