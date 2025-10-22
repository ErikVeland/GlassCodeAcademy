import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PGURL = process.env.DATABASE_URL || 'postgres://glasscode:glasscode@localhost:5432/glasscode';
const CONTENT_ROOT = process.env.CONTENT_ROOT || path.join(__dirname, '../../content');

async function verifyMigration() {
    const client = new Client({ connectionString: PGURL });
    await client.connect();

    try {
        console.log('🔍 Starting migration verification...');

        // 1. Check row counts
        const counts = await client.query(`
            SELECT
              (SELECT COUNT(*) FROM academies) AS academies,
              (SELECT COUNT(*) FROM courses)   AS courses,
              (SELECT COUNT(*) FROM lessons)   AS lessons,
              (SELECT COUNT(*) FROM quizzes)   AS quizzes,
              (SELECT COUNT(*) FROM questions) AS questions
        `);

        const countData = counts.rows[0];
        console.log('📊 Row counts:');
        console.log(`   Academies: ${countData.academies}`);
        console.log(`   Courses: ${countData.courses}`);
        console.log(`   Lessons: ${countData.lessons}`);
        console.log(`   Quizzes: ${countData.quizzes}`);
        console.log(`   Questions: ${countData.questions}`);

        // 2. Check for orphaned records
        console.log('\n🔍 Checking for orphaned records...');

        const orphanedCourses = await client.query(`
            SELECT c.id, c.slug FROM courses c 
            LEFT JOIN academies a ON a.id = c.academy_id 
            WHERE a.id IS NULL LIMIT 10
        `);

        if (orphanedCourses.rows.length > 0) {
            console.log(`   ⚠️  Found ${orphanedCourses.rows.length} orphaned courses:`);
            orphanedCourses.rows.forEach(row => {
                console.log(`      - Course ID: ${row.id}, Slug: ${row.slug}`);
            });
        } else {
            console.log('   ✅ No orphaned courses found');
        }

        const orphanedLessons = await client.query(`
            SELECT l.id, l.slug FROM lessons l 
            LEFT JOIN courses c ON c.id = l.course_id 
            WHERE c.id IS NULL LIMIT 10
        `);

        if (orphanedLessons.rows.length > 0) {
            console.log(`   ⚠️  Found ${orphanedLessons.rows.length} orphaned lessons:`);
            orphanedLessons.rows.forEach(row => {
                console.log(`      - Lesson ID: ${row.id}, Slug: ${row.slug}`);
            });
        } else {
            console.log('   ✅ No orphaned lessons found');
        }

        const orphanedQuizzes = await client.query(`
            SELECT q.id, q.slug FROM quizzes q 
            LEFT JOIN courses c ON c.id = q.course_id 
            WHERE c.id IS NULL LIMIT 10
        `);

        if (orphanedQuizzes.rows.length > 0) {
            console.log(`   ⚠️  Found ${orphanedQuizzes.rows.length} orphaned quizzes:`);
            orphanedQuizzes.rows.forEach(row => {
                console.log(`      - Quiz ID: ${row.id}, Slug: ${row.slug}`);
            });
        } else {
            console.log('   ✅ No orphaned quizzes found');
        }

        const orphanedQuestions = await client.query(`
            SELECT qs.id FROM questions qs 
            LEFT JOIN quizzes q ON q.id = qs.quiz_id 
            WHERE q.id IS NULL LIMIT 10
        `);

        if (orphanedQuestions.rows.length > 0) {
            console.log(`   ⚠️  Found ${orphanedQuestions.rows.length} orphaned questions:`);
            orphanedQuestions.rows.forEach(row => {
                console.log(`      - Question ID: ${row.id}`);
            });
        } else {
            console.log('   ✅ No orphaned questions found');
        }

        // 3. Check for duplicate slugs
        console.log('\n🔍 Checking for duplicate slugs...');

        const duplicateCourses = await client.query(`
            SELECT slug, COUNT(*) FROM courses 
            GROUP BY slug HAVING COUNT(*) > 1
        `);

        if (duplicateCourses.rows.length > 0) {
            console.log(`   ⚠️  Found ${duplicateCourses.rows.length} duplicate course slugs:`);
            duplicateCourses.rows.forEach(row => {
                console.log(`      - Slug: ${row.slug}, Count: ${row.count}`);
            });
        } else {
            console.log('   ✅ No duplicate course slugs found');
        }

        const duplicateLessons = await client.query(`
            SELECT slug, COUNT(*) FROM lessons 
            GROUP BY slug HAVING COUNT(*) > 1
        `);

        if (duplicateLessons.rows.length > 0) {
            console.log(`   ⚠️  Found ${duplicateLessons.rows.length} duplicate lesson slugs:`);
            duplicateLessons.rows.forEach(row => {
                console.log(`      - Slug: ${row.slug}, Count: ${row.count}`);
            });
        } else {
            console.log('   ✅ No duplicate lesson slugs found');
        }

        const duplicateQuizzes = await client.query(`
            SELECT slug, COUNT(*) FROM quizzes 
            GROUP BY slug HAVING COUNT(*) > 1
        `);

        if (duplicateQuizzes.rows.length > 0) {
            console.log(`   ⚠️  Found ${duplicateQuizzes.rows.length} duplicate quiz slugs:`);
            duplicateQuizzes.rows.forEach(row => {
                console.log(`      - Slug: ${row.slug}, Count: ${row.count}`);
            });
        } else {
            console.log('   ✅ No duplicate quiz slugs found');
        }

        // 4. Check search vectors
        console.log('\n🔍 Checking search vectors...');

        const lessonsWithoutSearch = await client.query(`
            SELECT COUNT(*) AS count FROM lessons WHERE search_tsv IS NULL
        `);

        if (lessonsWithoutSearch.rows[0].count > 0) {
            console.log(`   ⚠️  Found ${lessonsWithoutSearch.rows[0].count} lessons without search vectors`);
        } else {
            console.log('   ✅ All lessons have search vectors');
        }

        // 5. Check audit record
        console.log('\n🔍 Checking audit record...');

        const auditRecords = await client.query(`
            SELECT * FROM migration_audit 
            ORDER BY started_at DESC LIMIT 1
        `);

        if (auditRecords.rows.length > 0) {
            const audit = auditRecords.rows[0];
            console.log('   📋 Latest migration audit:');
            console.log(`      Started: ${audit.started_at}`);
            console.log(`      Finished: ${audit.finished_at}`);
            console.log(`      Source snapshot: ${audit.source_snapshot}`);
            console.log(`      Checksum: ${audit.checksum_manifest.substring(0, 16)}...`);
            console.log(`      Imported - Academies: ${audit.imported_academies}, Courses: ${audit.imported_courses}`);
            console.log(`      Lessons: ${audit.imported_lessons}, Quizzes: ${audit.imported_quizzes}, Questions: ${audit.imported_questions}`);
        } else {
            console.log('   ⚠️  No migration audit records found');
        }

        console.log('\n✅ Verification completed!');
    } catch (err) {
        console.error('❌ Verification failed:', err);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

verifyMigration().catch(err => {
    console.error(err);
    process.exit(1);
});