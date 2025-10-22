using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace backend.Services
{
    public class DatabaseContentService
    {
        private readonly GlassCodeDbContext _context;

        public DatabaseContentService(GlassCodeDbContext context)
        {
            _context = context;
        }

        // Get lessons by course slug
        public async Task<IEnumerable<BaseLesson>> GetLessonsByCourseSlugAsync(string courseSlug)
        {
            var lessons = await _context.Lessons
                .Include(l => l.Module)
                .Where(l => l.Module.Slug == courseSlug)
                .OrderBy(l => l.Order)
                .ToListAsync();

            return lessons.Select(l => MapLessonToBaseLesson(l)).ToList();
        }

        // Get interview questions by course slug
        public async Task<IEnumerable<BaseInterviewQuestion>> GetInterviewQuestionsByCourseSlugAsync(string courseSlug)
        {
            var questions = await _context.LessonQuizzes
                .Include(q => q.Lesson)
                .ThenInclude(l => l.Module)
                .Where(q => q.Lesson.Module.Slug == courseSlug)
                .OrderBy(q => q.SortOrder)
                .ToListAsync();

            return questions.Select(q => MapQuizToBaseInterviewQuestion(q)).ToList();
        }

        // Get all courses
        public async Task<IEnumerable<Course>> GetCoursesAsync()
        {
            return await _context.Courses
                .Include(c => c.Modules)
                .ToListAsync();
        }

        // Get lessons by module slug with pagination
        public async Task<IEnumerable<BaseLesson>> GetLessonsByModuleSlugAsync(
            string moduleSlug, 
            string? topic = null, 
            string? sortBy = null, 
            string? sortOrder = null, 
            int? limit = null, 
            int? offset = null)
        {
            var query = _context.Lessons
                .Include(l => l.Module)
                .Where(l => l.Module.Slug == moduleSlug)
                .AsQueryable();

            // Apply topic filter if provided
            if (!string.IsNullOrEmpty(topic))
            {
                // For now, we'll filter by tags in the metadata
                query = query.Where(l => l.Metadata != null && l.Metadata.Contains(topic));
            }

            // Apply sorting
            query = ApplySorting(query, sortBy, sortOrder);

            // Apply pagination
            if (offset.HasValue)
            {
                query = query.Skip(offset.Value);
            }

            if (limit.HasValue)
            {
                query = query.Take(limit.Value);
            }

            var lessons = await query.ToListAsync();
            return lessons.Select(l => MapLessonToBaseLesson(l)).ToList();
        }

        // Get interview questions by module slug with pagination
        public async Task<IEnumerable<BaseInterviewQuestion>> GetInterviewQuestionsByModuleSlugAsync(
            string moduleSlug,
            string? topic = null,
            string? sortBy = null,
            string? sortOrder = null,
            int? limit = null,
            int? offset = null)
        {
            var query = _context.LessonQuizzes
                .Include(q => q.Lesson)
                .ThenInclude(l => l.Module)
                .Where(q => q.Lesson.Module.Slug == moduleSlug)
                .AsQueryable();

            // Apply topic filter if provided
            if (!string.IsNullOrEmpty(topic))
            {
                query = query.Where(q => q.Topic == topic);
            }

            // Apply sorting
            query = ApplyQuizSorting(query, sortBy, sortOrder);

            // Apply pagination
            if (offset.HasValue)
            {
                query = query.Skip(offset.Value);
            }

            if (limit.HasValue)
            {
                query = query.Take(limit.Value);
            }

            var questions = await query.ToListAsync();
            return questions.Select(q => MapQuizToBaseInterviewQuestion(q)).ToList();
        }

        // Helper method to apply sorting to lessons
        private IQueryable<Lesson> ApplySorting(IQueryable<Lesson> query, string? sortBy, string? sortOrder)
        {
            var isDescending = string.Equals(sortOrder, "desc", StringComparison.OrdinalIgnoreCase);

            return sortBy?.ToLower() switch
            {
                "title" => isDescending ? query.OrderByDescending(l => l.Title) : query.OrderBy(l => l.Title),
                "order" => isDescending ? query.OrderByDescending(l => l.Order) : query.OrderBy(l => l.Order),
                "difficulty" => isDescending ? query.OrderByDescending(l => l.Difficulty) : query.OrderBy(l => l.Difficulty),
                _ => query.OrderBy(l => l.Order)
            };
        }

        // Helper method to apply sorting to quizzes
        private IQueryable<LessonQuiz> ApplyQuizSorting(IQueryable<LessonQuiz> query, string? sortBy, string? sortOrder)
        {
            var isDescending = string.Equals(sortOrder, "desc", StringComparison.OrdinalIgnoreCase);

            return sortBy?.ToLower() switch
            {
                "question" => isDescending ? query.OrderByDescending(q => q.Question) : query.OrderBy(q => q.Question),
                "topic" => isDescending ? query.OrderByDescending(q => q.Topic) : query.OrderBy(q => q.Topic),
                "difficulty" => isDescending ? query.OrderByDescending(q => q.Difficulty) : query.OrderBy(q => q.Difficulty),
                "sortorder" => isDescending ? query.OrderByDescending(q => q.SortOrder) : query.OrderBy(q => q.SortOrder),
                _ => query.OrderBy(q => q.SortOrder)
            };
        }

        // Map Lesson entity to BaseLesson model
        private BaseLesson MapLessonToBaseLesson(Lesson lesson)
        {
            var baseLesson = new BaseLesson
            {
                Id = lesson.Id,
                ModuleSlug = lesson.Module?.Slug ?? string.Empty,
                Title = lesson.Title,
                Order = lesson.Order,
                EstimatedMinutes = lesson.EstimatedMinutes,
                Difficulty = lesson.Difficulty
                // Note: BaseLesson doesn't have CreatedAt/UpdatedAt properties
            };

            // Try to parse content and metadata JSON
            try
            {
                if (!string.IsNullOrEmpty(lesson.Content))
                {
                    var contentDoc = JsonDocument.Parse(lesson.Content);
                    var root = contentDoc.RootElement;

                    if (root.TryGetProperty("intro", out var introElement))
                        baseLesson.Intro = introElement.GetString() ?? string.Empty;

                    if (root.TryGetProperty("objectives", out var objectivesElement) && objectivesElement.ValueKind == JsonValueKind.Array)
                    {
                        baseLesson.Objectives = objectivesElement.EnumerateArray()
                            .Where(x => x.ValueKind == JsonValueKind.String)
                            .Select(x => x.GetString())
                            .Where(x => x != null)
                            .Select(x => x!)
                            .ToList();
                    }

                    if (root.TryGetProperty("code", out var codeElement))
                    {
                        // Parse the code example object
                        if (codeElement.ValueKind == JsonValueKind.Object)
                        {
                            var codeExample = new CodeExample();
                            if (codeElement.TryGetProperty("example", out var exampleElement))
                                codeExample.Example = exampleElement.GetString() ?? string.Empty;
                            if (codeElement.TryGetProperty("explanation", out var explanationElement))
                                codeExample.Explanation = explanationElement.GetString() ?? string.Empty;
                            if (codeElement.TryGetProperty("language", out var languageElement))
                                codeExample.Language = languageElement.GetString() ?? string.Empty;
                            baseLesson.Code = codeExample;
                        }
                        else if (codeElement.ValueKind == JsonValueKind.String)
                        {
                            baseLesson.Code.Example = codeElement.GetString() ?? string.Empty;
                        }
                    }

                    if (root.TryGetProperty("pitfalls", out var pitfallsElement) && pitfallsElement.ValueKind == JsonValueKind.Array)
                    {
                        var pitfalls = new List<Pitfall>();
                        foreach (var pitfallElement in pitfallsElement.EnumerateArray())
                        {
                            if (pitfallElement.ValueKind == JsonValueKind.Object)
                            {
                                var pitfall = new Pitfall();
                                if (pitfallElement.TryGetProperty("mistake", out var mistakeElement))
                                    pitfall.Mistake = mistakeElement.GetString() ?? string.Empty;
                                if (pitfallElement.TryGetProperty("solution", out var solutionElement))
                                    pitfall.Solution = solutionElement.GetString() ?? string.Empty;
                                if (pitfallElement.TryGetProperty("severity", out var severityElement))
                                    pitfall.Severity = severityElement.GetString() ?? string.Empty;
                                pitfalls.Add(pitfall);
                            }
                        }
                        baseLesson.Pitfalls = pitfalls;
                    }

                    if (root.TryGetProperty("exercises", out var exercisesElement) && exercisesElement.ValueKind == JsonValueKind.Array)
                    {
                        var exercises = new List<Exercise>();
                        foreach (var exerciseElement in exercisesElement.EnumerateArray())
                        {
                            if (exerciseElement.ValueKind == JsonValueKind.Object)
                            {
                                var exercise = new Exercise();
                                if (exerciseElement.TryGetProperty("title", out var titleElement))
                                    exercise.Title = titleElement.GetString() ?? string.Empty;
                                if (exerciseElement.TryGetProperty("description", out var descriptionElement))
                                    exercise.Description = descriptionElement.GetString() ?? string.Empty;
                                if (exerciseElement.TryGetProperty("checkpoints", out var checkpointsElement) && checkpointsElement.ValueKind == JsonValueKind.Array)
                                {
                                    exercise.Checkpoints = checkpointsElement.EnumerateArray()
                                        .Where(x => x.ValueKind == JsonValueKind.String)
                                        .Select(x => x.GetString())
                                        .Where(x => x != null)
                                        .Select(x => x!)
                                        .ToList();
                                }
                                exercises.Add(exercise);
                            }
                        }
                        baseLesson.Exercises = exercises;
                    }

                    if (root.TryGetProperty("next", out var nextElement))
                    {
                        if (nextElement.ValueKind == JsonValueKind.Array)
                        {
                            baseLesson.Next = nextElement.EnumerateArray()
                                .Where(x => x.ValueKind == JsonValueKind.String)
                                .Select(x => x.GetString())
                                .Where(x => x != null)
                                .Select(x => x!)
                                .ToList();
                        }
                        else if (nextElement.ValueKind == JsonValueKind.String)
                        {
                            baseLesson.Next = new List<string> { nextElement.GetString() ?? string.Empty };
                        }
                    }
                }

                if (!string.IsNullOrEmpty(lesson.Metadata))
                {
                    var metadataDoc = JsonDocument.Parse(lesson.Metadata);
                    var root = metadataDoc.RootElement;

                    if (root.TryGetProperty("tags", out var tagsElement) && tagsElement.ValueKind == JsonValueKind.Array)
                    {
                        baseLesson.Tags = tagsElement.EnumerateArray()
                            .Where(x => x.ValueKind == JsonValueKind.String)
                            .Select(x => x.GetString())
                            .Where(x => x != null)
                            .Select(x => x!)
                            .ToList();
                    }

                    if (root.TryGetProperty("version", out var versionElement))
                        baseLesson.Version = versionElement.GetString();

                    if (root.TryGetProperty("lastUpdated", out var lastUpdatedElement))
                        baseLesson.LastUpdated = lastUpdatedElement.GetString();
                }
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the entire operation
                Console.WriteLine($"Error parsing lesson content/metadata for lesson {lesson.Id}: {ex.Message}");
            }

            return baseLesson;
        }

        // Map LessonQuiz entity to BaseInterviewQuestion model
        private BaseInterviewQuestion MapQuizToBaseInterviewQuestion(LessonQuiz quiz)
        {
            var baseQuestion = new BaseInterviewQuestion
            {
                Id = quiz.Id,
                Topic = quiz.Topic ?? string.Empty,
                Type = quiz.QuestionType,
                Question = quiz.Question,
                CorrectAnswer = quiz.CorrectAnswer,
                Explanation = quiz.Explanation,
                EstimatedTime = quiz.EstimatedTime
                // Note: BaseInterviewQuestion doesn't have CreatedAt/UpdatedAt properties
            };

            // Parse choices from JSON if available
            if (!string.IsNullOrEmpty(quiz.Choices))
            {
                try
                {
                    var choicesDoc = JsonDocument.Parse(quiz.Choices);
                    if (choicesDoc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        var choices = choicesDoc.RootElement.EnumerateArray()
                            .Where(x => x.ValueKind == JsonValueKind.String)
                            .Select(x => x.GetString())
                            .Where(x => x != null)
                            .Select(x => x!)
                            .ToArray();
                        baseQuestion.Choices = choices;
                    }
                }
                catch (Exception ex)
                {
                    // Log the error but don't fail the entire operation
                    Console.WriteLine($"Error parsing quiz choices for quiz {quiz.Id}: {ex.Message}");
                }
            }

            return baseQuestion;
        }
    }
}