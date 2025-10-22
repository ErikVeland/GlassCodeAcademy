import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { z } from 'zod';

// Configuration
const PGURL = process.env.DATABASE_URL || 'postgres://glasscode:glasscode@localhost:5432/glasscode';
const CONTENT_ROOT = process.env.CONTENT_ROOT || path.join(__dirname, '../../content');
const SOURCE_SNAPSHOT = process.env.SOURCE_SNAPSHOT || 'local';

// Academy schema
const academySchema = z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    description_md: z.string().optional(),
    visibility: z.enum(['private', 'public', 'unlisted']).optional().default('private'),
    version: z.number().int().positive().optional().default(1),
    status: z.enum(['draft', 'in_review', 'published']).optional().default('draft'),
    organisation_slug: z.string().optional()
});

// Course schema
const courseSchema = z.object({
    academy_slug: z.string().min(1),
    title: z.string().min(1),
    slug: z.string().min(1),
    summary_md: z.string().optional(),
    language: z.string().optional().default('en-AU'),
    difficulty: z.string().optional(),
    position: z.number().int().nonnegative().optional().default(0),
    version: z.number().int().positive().optional().default(1),
    status: z.enum(['draft','in_review','published']).optional().default('draft')
});

// Lesson schema
const lessonSchema = z.object({
    course_slug: z.string().min(1),
    title: z.string().min(1),
    slug: z.string().min(1),
    body_md: z.string().min(1),
    duration_min: z.number().int().positive().optional(),
    position: z.number().int().nonnegative().optional().default(0),
    version: z.number().int().positive().optional().default(1),
    status: z.enum(['draft','in_review','published']).optional().default('draft')
});

// Quiz schema
const quizSchema = z.object({
    course_slug: z.string().min(1),
    title: z.string().min(1),
    slug: z.string().min(1),
    version: z.number().int().positive().optional().default(1),
    status: z.enum(['draft','in_review','published']).optional().default('draft')
});

// Question schema
const questionSchema = z.object({
    quiz_slug: z.string().min(1),
    question_md: z.string().min(1),
    answers: z.array(z.object({
        text: z.string().min(1),
        correct: z.boolean()
    })).min(1),
    position: z.number().int().nonnegative().optional().default(0),
    version: z.number().int().positive().optional().default(1)
});

// Helper function to read JSON files
function readJsonArray<T>(filePath: string): T[] {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    try {
        const data = JSON.parse(content);
        // If it's an object with a "questions" array, return that
        if (data.questions && Array.isArray(data.questions)) {
            return data.questions;
        }
        // If it's already an array, return it
        if (Array.isArray(data)) {
            return data;
        }
        // Otherwise return as a single item array
        return [data];
    } catch (error) {
        console.error(`Error parsing JSON file ${filePath}:`, error);
        return [];
    }
}

// Helper function to calculate checksum of directory
function checksumDir(dirPath: string): string {
    const files = fs.readdirSync(dirPath);
    files.sort();
    
    const hash = crypto.createHash('sha256');
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            hash.update(checksumDir(filePath));
        } else {
            const content = fs.readFileSync(filePath);
            hash.update(content);
        }
    }
    
    return hash.digest('hex');
}

async function upsertData() {
    const client = new Client({ connectionString: PGURL });
    await client.connect();
    const manifestHash = checksumDir(CONTENT_ROOT);

    try {
        // Parse and validate JSON content
        // For this implementation, we'll need to transform the existing JSON structure
        // to match our new schema. We'll create a mapping from the old structure to the new one.
        
        console.log('Reading content files...');
        
        // Read registry for modules
        const registryPath = path.join(CONTENT_ROOT, 'registry.json');
        const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
        
        // Create a default organisation
        const { rows: orgRows } = await client.query(
            `INSERT INTO organisations (name, slug)
               VALUES ($1, $2)
             ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            ['Default Org', 'default']
        );
        const defaultOrgId = orgRows[0].id;
        console.log(`Upserted default organisation with ID: ${defaultOrgId}`);
        
        // Create a default academy
        const { rows: academyRows } = await client.query(
            `INSERT INTO academies (organisation_id, title, slug, description_md, visibility, version, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (slug) DO UPDATE
             SET title = EXCLUDED.title,
                 description_md = EXCLUDED.description_md,
                 visibility = EXCLUDED.visibility,
                 version = EXCLUDED.version,
                 status = EXCLUDED.status
             RETURNING id`,
            [defaultOrgId, 'GlassCode Academy', 'glasscode-academy', 'Comprehensive programming courses', 'public', 1, 'published']
        );
        const defaultAcademyId = academyRows[0].id;
        console.log(`Upserted default academy with ID: ${defaultAcademyId}`);
        
        // Process courses (modules from registry)
        const coursesMap = new Map<string, string>(); // slug -> id
        for (const module of registryData.modules) {
            const courseData = {
                academy_slug: 'glasscode-academy',
                title: module.title,
                slug: module.slug,
                summary_md: module.description,
                language: 'en-AU',
                difficulty: module.difficulty || 'Beginner',
                position: module.order || 0,
                version: 1,
                status: 'published'
            };
            
            try {
                const validatedCourse = courseSchema.parse(courseData);
                const { rows } = await client.query(
                    `INSERT INTO courses (academy_id, title, slug, summary_md, language, difficulty, position, version, status, raw_json)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                     ON CONFLICT (slug) DO UPDATE
                     SET title = EXCLUDED.title,
                         summary_md = EXCLUDED.summary_md,
                         language = EXCLUDED.language,
                         difficulty = EXCLUDED.difficulty,
                         position = EXCLUDED.position,
                         version = EXCLUDED.version,
                         status = EXCLUDED.status,
                         raw_json = EXCLUDED.raw_json
                     RETURNING id`,
                    [defaultAcademyId, validatedCourse.title, validatedCourse.slug, validatedCourse.summary_md || null, 
                     validatedCourse.language, validatedCourse.difficulty || null, validatedCourse.position, 
                     validatedCourse.version, validatedCourse.status, JSON.stringify(module)]
                );
                coursesMap.set(validatedCourse.slug, rows[0].id);
                console.log(`Upserted course: ${validatedCourse.title}`);
            } catch (error) {
                console.error(`Error processing course ${module.slug}:`, error);
            }
        }
        
        // Process lessons from JSON files
        const lessonsDir = path.join(CONTENT_ROOT, 'lessons');
        const lessonFiles = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));
        
        const lessonsMap = new Map<string, string>(); // slug -> id
        
        for (const file of lessonFiles) {
            const moduleSlug = path.basename(file, '.json');
            if (!coursesMap.has(moduleSlug)) {
                console.warn(`Skipping lessons for ${moduleSlug} - no corresponding course found`);
                continue;
            }
            
            const courseId = coursesMap.get(moduleSlug)!;
            const filePath = path.join(lessonsDir, file);
            const lessonsData = readJsonArray<any>(filePath);
            
            console.log(`Processing ${lessonsData.length} lessons for module: ${moduleSlug}`);
            
            for (let i = 0; i < lessonsData.length; i++) {
                const lesson = lessonsData[i];
                try {
                    // Transform lesson data to match new schema
                    const lessonData = {
                        course_slug: moduleSlug,
                        title: lesson.title || `Lesson ${i + 1}`,
                        slug: lesson.slug || `${moduleSlug}-lesson-${i + 1}`,
                        body_md: lesson.intro || '',
                        duration_min: lesson.estimatedMinutes || 30,
                        position: lesson.order || i + 1,
                        version: 1,
                        status: 'published'
                    };
                    
                    const validatedLesson = lessonSchema.parse(lessonData);
                    
                    // Include the full lesson data in raw_json
                    const { rows } = await client.query(
                        `INSERT INTO lessons (course_id, title, slug, body_md, duration_min, position, version, status, raw_json)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                         ON CONFLICT (slug) DO UPDATE
                         SET title = EXCLUDED.title,
                             body_md = EXCLUDED.body_md,
                             duration_min = EXCLUDED.duration_min,
                             position = EXCLUDED.position,
                             version = EXCLUDED.version,
                             status = EXCLUDED.status,
                             raw_json = EXCLUDED.raw_json
                         RETURNING id`,
                        [courseId, validatedLesson.title, validatedLesson.slug, validatedLesson.body_md, 
                         validatedLesson.duration_min || null, validatedLesson.position, 
                         validatedLesson.version, validatedLesson.status, JSON.stringify(lesson)]
                    );
                    lessonsMap.set(validatedLesson.slug, rows[0].id);
                    console.log(`Upserted lesson: ${validatedLesson.title}`);
                } catch (error) {
                    console.error(`Error processing lesson in ${file}:`, error);
                }
            }
        }
        
        // Process quizzes from JSON files
        const quizzesDir = path.join(CONTENT_ROOT, 'quizzes');
        const quizFiles = fs.readdirSync(quizzesDir).filter(f => f.endsWith('.json'));
        
        const quizzesMap = new Map<string, string>(); // slug -> id
        const questionsCount = { count: 0 };
        
        for (const file of quizFiles) {
            const moduleSlug = path.basename(file, '.json');
            if (!coursesMap.has(moduleSlug)) {
                console.warn(`Skipping quizzes for ${moduleSlug} - no corresponding course found`);
                continue;
            }
            
            const courseId = coursesMap.get(moduleSlug)!;
            const filePath = path.join(quizzesDir, file);
            const quizData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            
            if (!quizData.questions || !Array.isArray(quizData.questions)) {
                console.warn(`No questions found in quiz file: ${file}`);
                continue;
            }
            
            console.log(`Processing ${quizData.questions.length} questions for module: ${moduleSlug}`);
            
            // Create one quiz per module
            const quizTitle = `${moduleSlug.replace('-', ' ')} Quiz`;
            const quizSlug = `${moduleSlug}-quiz`;
            
            try {
                const quizDataObj = {
                    course_slug: moduleSlug,
                    title: quizTitle,
                    slug: quizSlug,
                    version: 1,
                    status: 'published'
                };
                
                const validatedQuiz = quizSchema.parse(quizDataObj);
                
                const { rows: quizRows } = await client.query(
                    `INSERT INTO quizzes (course_id, title, slug, version, status, raw_json)
                     VALUES ($1, $2, $3, $4, $5, $6)
                     ON CONFLICT (slug) DO UPDATE
                     SET title = EXCLUDED.title,
                         version = EXCLUDED.version,
                         status = EXCLUDED.status,
                         raw_json = EXCLUDED.raw_json
                     RETURNING id`,
                    [courseId, validatedQuiz.title, validatedQuiz.slug, 
                     validatedQuiz.version, validatedQuiz.status, JSON.stringify(quizData)]
                );
                const quizId = quizRows[0].id;
                quizzesMap.set(validatedQuiz.slug, quizId);
                console.log(`Upserted quiz: ${validatedQuiz.title}`);
                
                // Process questions
                for (let i = 0; i < quizData.questions.length; i++) {
                    const question = quizData.questions[i];
                    try {
                        // Transform question data
                        const answers = [];
                        if (question.choices && Array.isArray(question.choices)) {
                            for (let j = 0; j < question.choices.length; j++) {
                                answers.push({
                                    text: question.choices[j],
                                    correct: question.correctAnswer === j
                                });
                            }
                        }
                        
                        const questionData = {
                            quiz_slug: quizSlug,
                            question_md: question.question || '',
                            answers: answers,
                            position: question.id || i + 1,
                            version: 1
                        };
                        
                        const validatedQuestion = questionSchema.parse(questionData);
                        
                        await client.query(
                            `INSERT INTO questions (quiz_id, question_md, answers_json, position, version, raw_json)
                             VALUES ($1, $2, $3, $4, $5, $6)
                             ON CONFLICT DO NOTHING`,
                            [quizId, validatedQuestion.question_md, JSON.stringify(validatedQuestion.answers), 
                             validatedQuestion.position, validatedQuestion.version, JSON.stringify(question)]
                        );
                        questionsCount.count++;
                        console.log(`Upserted question: ${validatedQuestion.question_md.substring(0, 50)}...`);
                    } catch (error) {
                        console.error(`Error processing question ${i} in ${file}:`, error);
                    }
                }
            } catch (error) {
                console.error(`Error processing quiz for ${moduleSlug}:`, error);
            }
        }
        
        // Materialise TSV
        await client.query(`SELECT update_search_tsv_for_content()`);
        console.log('Updated search vectors');
        
        // Audit
        const auditId = crypto.randomUUID();
        await client.query(
            `INSERT INTO migration_audit (id, source_snapshot, imported_academies, imported_courses, imported_lessons, imported_quizzes, imported_questions, checksum_manifest, finished_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
            [
                auditId, SOURCE_SNAPSHOT,
                1, // academies
                registryData.modules.length, // courses
                Array.from(lessonsMap.values()).length, // lessons
                Array.from(quizzesMap.values()).length, // quizzes
                questionsCount.count, // questions
                manifestHash
            ]
        );
        console.log('Created migration audit record');
        
        console.log('✅ Import succeeded.');
        console.log(`Snapshot: ${SOURCE_SNAPSHOT}`);
        console.log(`Manifest checksum: ${manifestHash}`);
        console.log(`Counts -> academies:1 courses:${registryData.modules.length} lessons:${Array.from(lessonsMap.values()).length} quizzes:${Array.from(quizzesMap.values()).length} questions:${questionsCount.count}`);
    } catch (err) {
        console.error('❌ Import failed:', err);
        process.exitCode = 1;
    } finally {
        await client.end();
    }
}

upsertData().catch(err => {
    console.error(err);
    process.exit(1);
});