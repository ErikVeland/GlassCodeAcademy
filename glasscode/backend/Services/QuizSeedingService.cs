using System.Text.Json;
using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace backend.Services
{
    public class QuizSeedingService
    {
        private readonly GlassCodeDbContext _context;
        private readonly ILogger<QuizSeedingService> _logger;

        public QuizSeedingService(GlassCodeDbContext context, ILogger<QuizSeedingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SeedQuizzesToDatabase()
        {
            try
            {
                _logger.LogInformation("Starting quiz seeding process...");

                // Check if quizzes already exist
                var existingQuizCount = await _context.LessonQuizzes.CountAsync();
                if (existingQuizCount > 0)
                {
                    _logger.LogInformation($"Quiz seeding skipped - {existingQuizCount} quizzes already exist in database");
                    return;
                }

                var quizDirectory = System.IO.Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "content", "quizzes");
                if (!Directory.Exists(quizDirectory))
                {
                    _logger.LogWarning($"Quiz directory not found: {quizDirectory}");
                    return;
                }

                var quizFiles = Directory.GetFiles(quizDirectory, "*.json");
                _logger.LogInformation($"Found {quizFiles.Length} quiz files to process");

                var totalQuizzesAdded = 0;

                using var transaction = await _context.Database.BeginTransactionAsync();

                foreach (var quizFile in quizFiles)
                {
                    try
                    {
                        var fileName = System.IO.Path.GetFileNameWithoutExtension(quizFile);
                        _logger.LogInformation($"Processing quiz file: {fileName}");

                        var jsonContent = await File.ReadAllTextAsync(quizFile);
                        var quizData = JsonSerializer.Deserialize<QuizFileData>(jsonContent, new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        });

                        if (quizData?.Questions == null || !quizData.Questions.Any())
                        {
                            _logger.LogWarning($"No questions found in {fileName}");
                            continue;
                        }

                        // Find lessons that match this quiz file (by topic/module)
                        var matchingLessons = await FindMatchingLessons(fileName);

                        if (!matchingLessons.Any())
                        {
                            _logger.LogWarning($"No matching lessons found for quiz file: {fileName}");
                            continue;
                        }

                        // Distribute questions among matching lessons
                        var questionsPerLesson = Math.Max(1, quizData.Questions.Count / matchingLessons.Count());
                        var questionIndex = 0;

                        foreach (var lesson in matchingLessons)
                        {
                            var questionsForThisLesson = quizData.Questions
                                .Skip(questionIndex)
                                .Take(questionsPerLesson)
                                .ToList();

                            foreach (var question in questionsForThisLesson)
                            {
                                var lessonQuiz = new LessonQuiz
                                {
                                    Question = question.Question,
                                    Topic = question.Topic,
                                    Difficulty = question.Difficulty ?? "Beginner",
                                    Choices = question.Choices != null ? JsonSerializer.Serialize(question.Choices) : null,
                                    FixedChoiceOrder = question.FixedChoiceOrder ?? false,
                                    ChoiceLabels = question.ChoiceLabels != null ? JsonSerializer.Serialize(question.ChoiceLabels) : null,
                                    AcceptedAnswers = question.AcceptedAnswers != null ? JsonSerializer.Serialize(question.AcceptedAnswers) : null,
                                    Explanation = question.Explanation,
                                    IndustryContext = question.IndustryContext,
                                    Tags = question.Tags != null ? JsonSerializer.Serialize(question.Tags) : null,
                                    QuestionType = question.QuestionType ?? question.Type ?? "multiple-choice",
                                    EstimatedTime = question.EstimatedTime ?? 60, // Default 60 seconds
                                    CorrectAnswer = question.CorrectAnswer,
                                    QuizType = question.Type ?? "multiple-choice",
                                    Sources = question.Sources != null ? JsonSerializer.Serialize(question.Sources) : null,
                                    SortOrder = question.Id ?? 0,
                                    IsPublished = true,
                                    LessonId = lesson.Id,
                                    CreatedAt = DateTime.UtcNow,
                                    UpdatedAt = DateTime.UtcNow
                                };

                                _context.LessonQuizzes.Add(lessonQuiz);
                                totalQuizzesAdded++;
                            }

                            questionIndex += questionsPerLesson;
                            if (questionIndex >= quizData.Questions.Count) break;
                        }

                        _logger.LogInformation($"Added {quizData.Questions.Count} questions from {fileName}");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Error processing quiz file {quizFile}: {ex.Message}");
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation($"Quiz seeding completed successfully. Added {totalQuizzesAdded} quiz questions to database");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Quiz seeding failed: {ex.Message}");
                throw;
            }
        }

        private async Task<List<Lesson>> FindMatchingLessons(string quizFileName)
        {
            // Try to match quiz file name with lesson topics or module slugs using database-side filters
            // First try exact module slug match (case-insensitive)
            var exactMatch = await _context.Lessons
                .Include(l => l.Module)
                .Where(l => EF.Functions.ILike(l.Module.Slug, quizFileName))
                .ToListAsync();

            if (exactMatch.Any())
                return exactMatch;

            // Try partial matches based on keywords using ILIKE and slug normalization
            var normalizedQuiz = quizFileName.Replace("-", "").ToLowerInvariant();
            var keywordMatches = await _context.Lessons
                .Include(l => l.Module)
                .Where(l =>
                    EF.Functions.ILike(l.Module.Slug, $"%{normalizedQuiz}%") ||
                    EF.Functions.ILike(l.Module.Slug.Replace("-", ""), $"%{normalizedQuiz}%"))
                .ToListAsync();

            if (keywordMatches.Any())
                return keywordMatches;

            // Fallback: return first lesson from first module
            return await _context.Lessons
                .Include(l => l.Module)
                .OrderBy(l => l.Id)
                .Take(1)
                .ToListAsync();
        }
    }

    // Data models for deserializing quiz JSON files
    public class QuizFileData
    {
        public List<QuizQuestion> Questions { get; set; } = new();
    }

    public class QuizQuestion
    {
        public int? Id { get; set; }
        public string Topic { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Question { get; set; } = string.Empty;
        public List<string>? Choices { get; set; }
        public int? CorrectAnswer { get; set; }
        public string? Explanation { get; set; }
        public string? Difficulty { get; set; }
        public string? QuestionType { get; set; }
        public List<string>? Sources { get; set; }
        public string? IndustryContext { get; set; }
        public List<string>? Tags { get; set; }
        public int? EstimatedTime { get; set; }
        public bool? FixedChoiceOrder { get; set; }
        public List<string>? ChoiceLabels { get; set; }
        public List<string>? AcceptedAnswers { get; set; }
    }
}