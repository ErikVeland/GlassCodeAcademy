"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var pg_1 = require("pg");
var fs = require("fs");
var path = require("path");
var crypto = require("crypto");
var zod_1 = require("zod");
// Configuration
var PGURL = process.env.DATABASE_URL || 'postgres://glasscode:glasscode@localhost:5432/glasscode';
var CONTENT_ROOT = process.env.CONTENT_ROOT || path.join(__dirname, '../../content');
var SOURCE_SNAPSHOT = process.env.SOURCE_SNAPSHOT || 'local';
// Academy schema
var academySchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    description_md: zod_1.z.string().optional(),
    visibility: zod_1.z.enum(['private', 'public', 'unlisted']).optional().default('private'),
    version: zod_1.z.number().int().positive().optional().default(1),
    status: zod_1.z.enum(['draft', 'in_review', 'published']).optional().default('draft'),
    organisation_slug: zod_1.z.string().optional()
});
// Course schema
var courseSchema = zod_1.z.object({
    academy_slug: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    summary_md: zod_1.z.string().optional(),
    language: zod_1.z.string().optional().default('en-AU'),
    difficulty: zod_1.z.string().optional(),
    position: zod_1.z.number().int().nonnegative().optional().default(0),
    version: zod_1.z.number().int().positive().optional().default(1),
    status: zod_1.z.enum(['draft', 'in_review', 'published']).optional().default('draft')
});
// Lesson schema
var lessonSchema = zod_1.z.object({
    course_slug: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    body_md: zod_1.z.string().min(1),
    duration_min: zod_1.z.number().int().positive().optional(),
    position: zod_1.z.number().int().nonnegative().optional().default(0),
    version: zod_1.z.number().int().positive().optional().default(1),
    status: zod_1.z.enum(['draft', 'in_review', 'published']).optional().default('draft')
});
// Quiz schema
var quizSchema = zod_1.z.object({
    course_slug: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1),
    version: zod_1.z.number().int().positive().optional().default(1),
    status: zod_1.z.enum(['draft', 'in_review', 'published']).optional().default('draft')
});
// Question schema
var questionSchema = zod_1.z.object({
    quiz_slug: zod_1.z.string().min(1),
    question_md: zod_1.z.string().min(1),
    answers: zod_1.z.array(zod_1.z.object({
        text: zod_1.z.string().min(1),
        correct: zod_1.z.boolean()
    })).min(1),
    position: zod_1.z.number().int().nonnegative().optional().default(0),
    version: zod_1.z.number().int().positive().optional().default(1)
});
// Helper function to read JSON files
function readJsonArray(filePath) {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    var content = fs.readFileSync(filePath, 'utf-8');
    try {
        var data = JSON.parse(content);
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
    }
    catch (error) {
        console.error("Error parsing JSON file ".concat(filePath, ":"), error);
        return [];
    }
}
// Helper function to calculate checksum of directory
function checksumDir(dirPath) {
    var files = fs.readdirSync(dirPath);
    files.sort();
    var hash = crypto.createHash('sha256');
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var filePath = path.join(dirPath, file);
        var stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            hash.update(checksumDir(filePath));
        }
        else {
            var content = fs.readFileSync(filePath);
            hash.update(content);
        }
    }
    return hash.digest('hex');
}
function upsertData() {
    return __awaiter(this, void 0, void 0, function () {
        var client, manifestHash, registryPath, registryData, orgRows, defaultOrgId, academyRows, defaultAcademyId, coursesMap, _i, _a, module_1, courseData, validatedCourse, rows, error_1, lessonsDir, lessonFiles, lessonsMap, _b, lessonFiles_1, file, moduleSlug, courseId, filePath, lessonsData, i, lesson, lessonData, validatedLesson, rows, error_2, quizzesDir, quizFiles, quizzesMap, questionsCount, _c, quizFiles_1, file, moduleSlug, courseId, filePath, quizData, quizTitle, quizSlug, quizDataObj, validatedQuiz, quizRows, quizId, i, question, answers, j, questionData, validatedQuestion, error_3, error_4, auditId, err_1;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    client = new pg_1.Client({ connectionString: PGURL });
                    return [4 /*yield*/, client.connect()];
                case 1:
                    _d.sent();
                    manifestHash = checksumDir(CONTENT_ROOT);
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 33, 34, 36]);
                    // Parse and validate JSON content
                    // For this implementation, we'll need to transform the existing JSON structure
                    // to match our new schema. We'll create a mapping from the old structure to the new one.
                    console.log('Reading content files...');
                    registryPath = path.join(CONTENT_ROOT, 'registry.json');
                    registryData = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
                    return [4 /*yield*/, client.query("INSERT INTO organisations (name, slug)\n               VALUES ($1, $2)\n             ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name\n             RETURNING id", ['Default Org', 'default'])];
                case 3:
                    orgRows = (_d.sent()).rows;
                    defaultOrgId = orgRows[0].id;
                    console.log("Upserted default organisation with ID: ".concat(defaultOrgId));
                    return [4 /*yield*/, client.query("INSERT INTO academies (organisation_id, title, slug, description_md, visibility, version, status)\n             VALUES ($1, $2, $3, $4, $5, $6, $7)\n             ON CONFLICT (slug) DO UPDATE\n             SET title = EXCLUDED.title,\n                 description_md = EXCLUDED.description_md,\n                 visibility = EXCLUDED.visibility,\n                 version = EXCLUDED.version,\n                 status = EXCLUDED.status\n             RETURNING id", [defaultOrgId, 'GlassCode Academy', 'glasscode-academy', 'Comprehensive programming courses', 'public', 1, 'published'])];
                case 4:
                    academyRows = (_d.sent()).rows;
                    defaultAcademyId = academyRows[0].id;
                    console.log("Upserted default academy with ID: ".concat(defaultAcademyId));
                    coursesMap = new Map();
                    _i = 0, _a = registryData.modules;
                    _d.label = 5;
                case 5:
                    if (!(_i < _a.length)) return [3 /*break*/, 10];
                    module_1 = _a[_i];
                    courseData = {
                        academy_slug: 'glasscode-academy',
                        title: module_1.title,
                        slug: module_1.slug,
                        summary_md: module_1.description,
                        language: 'en-AU',
                        difficulty: module_1.difficulty || 'Beginner',
                        position: module_1.order || 0,
                        version: 1,
                        status: 'published'
                    };
                    _d.label = 6;
                case 6:
                    _d.trys.push([6, 8, , 9]);
                    validatedCourse = courseSchema.parse(courseData);
                    return [4 /*yield*/, client.query("INSERT INTO courses (academy_id, title, slug, summary_md, language, difficulty, position, version, status, raw_json)\n                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)\n                     ON CONFLICT (slug) DO UPDATE\n                     SET title = EXCLUDED.title,\n                         summary_md = EXCLUDED.summary_md,\n                         language = EXCLUDED.language,\n                         difficulty = EXCLUDED.difficulty,\n                         position = EXCLUDED.position,\n                         version = EXCLUDED.version,\n                         status = EXCLUDED.status,\n                         raw_json = EXCLUDED.raw_json\n                     RETURNING id", [defaultAcademyId, validatedCourse.title, validatedCourse.slug, validatedCourse.summary_md || null,
                            validatedCourse.language, validatedCourse.difficulty || null, validatedCourse.position,
                            validatedCourse.version, validatedCourse.status, JSON.stringify(module_1)])];
                case 7:
                    rows = (_d.sent()).rows;
                    coursesMap.set(validatedCourse.slug, rows[0].id);
                    console.log("Upserted course: ".concat(validatedCourse.title));
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _d.sent();
                    console.error("Error processing course ".concat(module_1.slug, ":"), error_1);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 5];
                case 10:
                    lessonsDir = path.join(CONTENT_ROOT, 'lessons');
                    lessonFiles = fs.readdirSync(lessonsDir).filter(function (f) { return f.endsWith('.json'); });
                    lessonsMap = new Map();
                    _b = 0, lessonFiles_1 = lessonFiles;
                    _d.label = 11;
                case 11:
                    if (!(_b < lessonFiles_1.length)) return [3 /*break*/, 18];
                    file = lessonFiles_1[_b];
                    moduleSlug = path.basename(file, '.json');
                    if (!coursesMap.has(moduleSlug)) {
                        console.warn("Skipping lessons for ".concat(moduleSlug, " - no corresponding course found"));
                        return [3 /*break*/, 17];
                    }
                    courseId = coursesMap.get(moduleSlug);
                    filePath = path.join(lessonsDir, file);
                    lessonsData = readJsonArray(filePath);
                    console.log("Processing ".concat(lessonsData.length, " lessons for module: ").concat(moduleSlug));
                    i = 0;
                    _d.label = 12;
                case 12:
                    if (!(i < lessonsData.length)) return [3 /*break*/, 17];
                    lesson = lessonsData[i];
                    _d.label = 13;
                case 13:
                    _d.trys.push([13, 15, , 16]);
                    lessonData = {
                        course_slug: moduleSlug,
                        title: lesson.title || "Lesson ".concat(i + 1),
                        slug: lesson.slug || "".concat(moduleSlug, "-lesson-").concat(i + 1),
                        body_md: lesson.intro || '',
                        duration_min: lesson.estimatedMinutes || 30,
                        position: lesson.order || i + 1,
                        version: 1,
                        status: 'published'
                    };
                    validatedLesson = lessonSchema.parse(lessonData);
                    return [4 /*yield*/, client.query("INSERT INTO lessons (course_id, title, slug, body_md, duration_min, position, version, status, raw_json)\n                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)\n                         ON CONFLICT (slug) DO UPDATE\n                         SET title = EXCLUDED.title,\n                             body_md = EXCLUDED.body_md,\n                             duration_min = EXCLUDED.duration_min,\n                             position = EXCLUDED.position,\n                             version = EXCLUDED.version,\n                             status = EXCLUDED.status,\n                             raw_json = EXCLUDED.raw_json\n                         RETURNING id", [courseId, validatedLesson.title, validatedLesson.slug, validatedLesson.body_md,
                            validatedLesson.duration_min || null, validatedLesson.position,
                            validatedLesson.version, validatedLesson.status, JSON.stringify(lesson)])];
                case 14:
                    rows = (_d.sent()).rows;
                    lessonsMap.set(validatedLesson.slug, rows[0].id);
                    console.log("Upserted lesson: ".concat(validatedLesson.title));
                    return [3 /*break*/, 16];
                case 15:
                    error_2 = _d.sent();
                    console.error("Error processing lesson in ".concat(file, ":"), error_2);
                    return [3 /*break*/, 16];
                case 16:
                    i++;
                    return [3 /*break*/, 12];
                case 17:
                    _b++;
                    return [3 /*break*/, 11];
                case 18:
                    quizzesDir = path.join(CONTENT_ROOT, 'quizzes');
                    quizFiles = fs.readdirSync(quizzesDir).filter(function (f) { return f.endsWith('.json'); });
                    quizzesMap = new Map();
                    questionsCount = { count: 0 };
                    _c = 0, quizFiles_1 = quizFiles;
                    _d.label = 19;
                case 19:
                    if (!(_c < quizFiles_1.length)) return [3 /*break*/, 30];
                    file = quizFiles_1[_c];
                    moduleSlug = path.basename(file, '.json');
                    if (!coursesMap.has(moduleSlug)) {
                        console.warn("Skipping quizzes for ".concat(moduleSlug, " - no corresponding course found"));
                        return [3 /*break*/, 29];
                    }
                    courseId = coursesMap.get(moduleSlug);
                    filePath = path.join(quizzesDir, file);
                    quizData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                    if (!quizData.questions || !Array.isArray(quizData.questions)) {
                        console.warn("No questions found in quiz file: ".concat(file));
                        return [3 /*break*/, 29];
                    }
                    console.log("Processing ".concat(quizData.questions.length, " questions for module: ").concat(moduleSlug));
                    quizTitle = "".concat(moduleSlug.replace('-', ' '), " Quiz");
                    quizSlug = "".concat(moduleSlug, "-quiz");
                    _d.label = 20;
                case 20:
                    _d.trys.push([20, 28, , 29]);
                    quizDataObj = {
                        course_slug: moduleSlug,
                        title: quizTitle,
                        slug: quizSlug,
                        version: 1,
                        status: 'published'
                    };
                    validatedQuiz = quizSchema.parse(quizDataObj);
                    return [4 /*yield*/, client.query("INSERT INTO quizzes (course_id, title, slug, version, status, raw_json)\n                     VALUES ($1, $2, $3, $4, $5, $6)\n                     ON CONFLICT (slug) DO UPDATE\n                     SET title = EXCLUDED.title,\n                         version = EXCLUDED.version,\n                         status = EXCLUDED.status,\n                         raw_json = EXCLUDED.raw_json\n                     RETURNING id", [courseId, validatedQuiz.title, validatedQuiz.slug,
                            validatedQuiz.version, validatedQuiz.status, JSON.stringify(quizData)])];
                case 21:
                    quizRows = (_d.sent()).rows;
                    quizId = quizRows[0].id;
                    quizzesMap.set(validatedQuiz.slug, quizId);
                    console.log("Upserted quiz: ".concat(validatedQuiz.title));
                    i = 0;
                    _d.label = 22;
                case 22:
                    if (!(i < quizData.questions.length)) return [3 /*break*/, 27];
                    question = quizData.questions[i];
                    _d.label = 23;
                case 23:
                    _d.trys.push([23, 25, , 26]);
                    answers = [];
                    if (question.choices && Array.isArray(question.choices)) {
                        for (j = 0; j < question.choices.length; j++) {
                            answers.push({
                                text: question.choices[j],
                                correct: question.correctAnswer === j
                            });
                        }
                    }
                    questionData = {
                        quiz_slug: quizSlug,
                        question_md: question.question || '',
                        answers: answers,
                        position: question.id || i + 1,
                        version: 1
                    };
                    validatedQuestion = questionSchema.parse(questionData);
                    return [4 /*yield*/, client.query("INSERT INTO questions (quiz_id, question_md, answers_json, position, version, raw_json)\n                             VALUES ($1, $2, $3, $4, $5, $6)\n                             ON CONFLICT DO NOTHING", [quizId, validatedQuestion.question_md, JSON.stringify(validatedQuestion.answers),
                            validatedQuestion.position, validatedQuestion.version, JSON.stringify(question)])];
                case 24:
                    _d.sent();
                    questionsCount.count++;
                    console.log("Upserted question: ".concat(validatedQuestion.question_md.substring(0, 50), "..."));
                    return [3 /*break*/, 26];
                case 25:
                    error_3 = _d.sent();
                    console.error("Error processing question ".concat(i, " in ").concat(file, ":"), error_3);
                    return [3 /*break*/, 26];
                case 26:
                    i++;
                    return [3 /*break*/, 22];
                case 27: return [3 /*break*/, 29];
                case 28:
                    error_4 = _d.sent();
                    console.error("Error processing quiz for ".concat(moduleSlug, ":"), error_4);
                    return [3 /*break*/, 29];
                case 29:
                    _c++;
                    return [3 /*break*/, 19];
                case 30: 
                // Materialise TSV
                return [4 /*yield*/, client.query("SELECT update_search_tsv_for_content()")];
                case 31:
                    // Materialise TSV
                    _d.sent();
                    console.log('Updated search vectors');
                    auditId = crypto.randomUUID();
                    return [4 /*yield*/, client.query("INSERT INTO migration_audit (id, source_snapshot, imported_academies, imported_courses, imported_lessons, imported_quizzes, imported_questions, checksum_manifest, finished_at)\n             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())", [
                            auditId, SOURCE_SNAPSHOT,
                            1, // academies
                            registryData.modules.length, // courses
                            Array.from(lessonsMap.values()).length, // lessons
                            Array.from(quizzesMap.values()).length, // quizzes
                            questionsCount.count, // questions
                            manifestHash
                        ])];
                case 32:
                    _d.sent();
                    console.log('Created migration audit record');
                    console.log('✅ Import succeeded.');
                    console.log("Snapshot: ".concat(SOURCE_SNAPSHOT));
                    console.log("Manifest checksum: ".concat(manifestHash));
                    console.log("Counts -> academies:1 courses:".concat(registryData.modules.length, " lessons:").concat(Array.from(lessonsMap.values()).length, " quizzes:").concat(Array.from(quizzesMap.values()).length, " questions:").concat(questionsCount.count));
                    return [3 /*break*/, 36];
                case 33:
                    err_1 = _d.sent();
                    console.error('❌ Import failed:', err_1);
                    process.exitCode = 1;
                    return [3 /*break*/, 36];
                case 34: return [4 /*yield*/, client.end()];
                case 35:
                    _d.sent();
                    return [7 /*endfinally*/];
                case 36: return [2 /*return*/];
            }
        });
    });
}
upsertData().catch(function (err) {
    console.error(err);
    process.exit(1);
});
