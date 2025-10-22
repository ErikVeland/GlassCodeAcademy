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
var path = require("path");
// Configuration
var PGURL = process.env.DATABASE_URL || 'postgres://glasscode:glasscode@localhost:5432/glasscode';
var CONTENT_ROOT = process.env.CONTENT_ROOT || path.join(__dirname, '../../content');
function verifyMigration() {
    return __awaiter(this, void 0, void 0, function () {
        var client, counts, countData, orphanedCourses, orphanedLessons, orphanedQuizzes, orphanedQuestions, duplicateCourses, duplicateLessons, duplicateQuizzes, lessonsWithoutSearch, auditRecords, audit, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client = new pg_1.Client({ connectionString: PGURL });
                    return [4 /*yield*/, client.connect()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 13, 14, 16]);
                    console.log('🔍 Starting migration verification...');
                    return [4 /*yield*/, client.query("\n            SELECT\n              (SELECT COUNT(*) FROM academies) AS academies,\n              (SELECT COUNT(*) FROM courses)   AS courses,\n              (SELECT COUNT(*) FROM lessons)   AS lessons,\n              (SELECT COUNT(*) FROM quizzes)   AS quizzes,\n              (SELECT COUNT(*) FROM questions) AS questions\n        ")];
                case 3:
                    counts = _a.sent();
                    countData = counts.rows[0];
                    console.log('📊 Row counts:');
                    console.log("   Academies: ".concat(countData.academies));
                    console.log("   Courses: ".concat(countData.courses));
                    console.log("   Lessons: ".concat(countData.lessons));
                    console.log("   Quizzes: ".concat(countData.quizzes));
                    console.log("   Questions: ".concat(countData.questions));
                    // 2. Check for orphaned records
                    console.log('\n🔍 Checking for orphaned records...');
                    return [4 /*yield*/, client.query("\n            SELECT c.id, c.slug FROM courses c \n            LEFT JOIN academies a ON a.id = c.academy_id \n            WHERE a.id IS NULL LIMIT 10\n        ")];
                case 4:
                    orphanedCourses = _a.sent();
                    if (orphanedCourses.rows.length > 0) {
                        console.log("   \u26A0\uFE0F  Found ".concat(orphanedCourses.rows.length, " orphaned courses:"));
                        orphanedCourses.rows.forEach(function (row) {
                            console.log("      - Course ID: ".concat(row.id, ", Slug: ").concat(row.slug));
                        });
                    }
                    else {
                        console.log('   ✅ No orphaned courses found');
                    }
                    return [4 /*yield*/, client.query("\n            SELECT l.id, l.slug FROM lessons l \n            LEFT JOIN courses c ON c.id = l.course_id \n            WHERE c.id IS NULL LIMIT 10\n        ")];
                case 5:
                    orphanedLessons = _a.sent();
                    if (orphanedLessons.rows.length > 0) {
                        console.log("   \u26A0\uFE0F  Found ".concat(orphanedLessons.rows.length, " orphaned lessons:"));
                        orphanedLessons.rows.forEach(function (row) {
                            console.log("      - Lesson ID: ".concat(row.id, ", Slug: ").concat(row.slug));
                        });
                    }
                    else {
                        console.log('   ✅ No orphaned lessons found');
                    }
                    return [4 /*yield*/, client.query("\n            SELECT q.id, q.slug FROM quizzes q \n            LEFT JOIN courses c ON c.id = q.course_id \n            WHERE c.id IS NULL LIMIT 10\n        ")];
                case 6:
                    orphanedQuizzes = _a.sent();
                    if (orphanedQuizzes.rows.length > 0) {
                        console.log("   \u26A0\uFE0F  Found ".concat(orphanedQuizzes.rows.length, " orphaned quizzes:"));
                        orphanedQuizzes.rows.forEach(function (row) {
                            console.log("      - Quiz ID: ".concat(row.id, ", Slug: ").concat(row.slug));
                        });
                    }
                    else {
                        console.log('   ✅ No orphaned quizzes found');
                    }
                    return [4 /*yield*/, client.query("\n            SELECT qs.id FROM questions qs \n            LEFT JOIN quizzes q ON q.id = qs.quiz_id \n            WHERE q.id IS NULL LIMIT 10\n        ")];
                case 7:
                    orphanedQuestions = _a.sent();
                    if (orphanedQuestions.rows.length > 0) {
                        console.log("   \u26A0\uFE0F  Found ".concat(orphanedQuestions.rows.length, " orphaned questions:"));
                        orphanedQuestions.rows.forEach(function (row) {
                            console.log("      - Question ID: ".concat(row.id));
                        });
                    }
                    else {
                        console.log('   ✅ No orphaned questions found');
                    }
                    // 3. Check for duplicate slugs
                    console.log('\n🔍 Checking for duplicate slugs...');
                    return [4 /*yield*/, client.query("\n            SELECT slug, COUNT(*) FROM courses \n            GROUP BY slug HAVING COUNT(*) > 1\n        ")];
                case 8:
                    duplicateCourses = _a.sent();
                    if (duplicateCourses.rows.length > 0) {
                        console.log("   \u26A0\uFE0F  Found ".concat(duplicateCourses.rows.length, " duplicate course slugs:"));
                        duplicateCourses.rows.forEach(function (row) {
                            console.log("      - Slug: ".concat(row.slug, ", Count: ").concat(row.count));
                        });
                    }
                    else {
                        console.log('   ✅ No duplicate course slugs found');
                    }
                    return [4 /*yield*/, client.query("\n            SELECT slug, COUNT(*) FROM lessons \n            GROUP BY slug HAVING COUNT(*) > 1\n        ")];
                case 9:
                    duplicateLessons = _a.sent();
                    if (duplicateLessons.rows.length > 0) {
                        console.log("   \u26A0\uFE0F  Found ".concat(duplicateLessons.rows.length, " duplicate lesson slugs:"));
                        duplicateLessons.rows.forEach(function (row) {
                            console.log("      - Slug: ".concat(row.slug, ", Count: ").concat(row.count));
                        });
                    }
                    else {
                        console.log('   ✅ No duplicate lesson slugs found');
                    }
                    return [4 /*yield*/, client.query("\n            SELECT slug, COUNT(*) FROM quizzes \n            GROUP BY slug HAVING COUNT(*) > 1\n        ")];
                case 10:
                    duplicateQuizzes = _a.sent();
                    if (duplicateQuizzes.rows.length > 0) {
                        console.log("   \u26A0\uFE0F  Found ".concat(duplicateQuizzes.rows.length, " duplicate quiz slugs:"));
                        duplicateQuizzes.rows.forEach(function (row) {
                            console.log("      - Slug: ".concat(row.slug, ", Count: ").concat(row.count));
                        });
                    }
                    else {
                        console.log('   ✅ No duplicate quiz slugs found');
                    }
                    // 4. Check search vectors
                    console.log('\n🔍 Checking search vectors...');
                    return [4 /*yield*/, client.query("\n            SELECT COUNT(*) AS count FROM lessons WHERE search_tsv IS NULL\n        ")];
                case 11:
                    lessonsWithoutSearch = _a.sent();
                    if (lessonsWithoutSearch.rows[0].count > 0) {
                        console.log("   \u26A0\uFE0F  Found ".concat(lessonsWithoutSearch.rows[0].count, " lessons without search vectors"));
                    }
                    else {
                        console.log('   ✅ All lessons have search vectors');
                    }
                    // 5. Check audit record
                    console.log('\n🔍 Checking audit record...');
                    return [4 /*yield*/, client.query("\n            SELECT * FROM migration_audit \n            ORDER BY started_at DESC LIMIT 1\n        ")];
                case 12:
                    auditRecords = _a.sent();
                    if (auditRecords.rows.length > 0) {
                        audit = auditRecords.rows[0];
                        console.log('   📋 Latest migration audit:');
                        console.log("      Started: ".concat(audit.started_at));
                        console.log("      Finished: ".concat(audit.finished_at));
                        console.log("      Source snapshot: ".concat(audit.source_snapshot));
                        console.log("      Checksum: ".concat(audit.checksum_manifest.substring(0, 16), "..."));
                        console.log("      Imported - Academies: ".concat(audit.imported_academies, ", Courses: ").concat(audit.imported_courses));
                        console.log("      Lessons: ".concat(audit.imported_lessons, ", Quizzes: ").concat(audit.imported_quizzes, ", Questions: ").concat(audit.imported_questions));
                    }
                    else {
                        console.log('   ⚠️  No migration audit records found');
                    }
                    console.log('\n✅ Verification completed!');
                    return [3 /*break*/, 16];
                case 13:
                    err_1 = _a.sent();
                    console.error('❌ Verification failed:', err_1);
                    process.exitCode = 1;
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, client.end()];
                case 15:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 16: return [2 /*return*/];
            }
        });
    });
}
verifyMigration().catch(function (err) {
    console.error(err);
    process.exit(1);
});
