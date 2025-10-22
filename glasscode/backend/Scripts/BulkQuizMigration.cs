using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Scripts
{
    public class BulkQuizMigration
    {
        private readonly GlassCodeDbContext _context;
        private readonly string _contentPath;

        public BulkQuizMigration(GlassCodeDbContext context, string contentPath = "/Users/veland/GlassCodeAcademy/content")
        {
            _context = context;
            _contentPath = contentPath;
        }

        public async Task MigrateQuizzesAsync()
        {
            var quizzesPath = System.IO.Path.Combine(_contentPath, "quizzes");
            
            if (!Directory.Exists(quizzesPath))
            {
                Console.WriteLine($"Quizzes directory not found: {quizzesPath}");
                return;
            }

            var jsonFiles = Directory.GetFiles(quizzesPath, "*.json");
            Console.WriteLine($"Found {jsonFiles.Length} quiz files to process");

            foreach (var file in jsonFiles)
            {
                await ProcessQuizFileAsync(file);
            }

            await _context.SaveChangesAsync();
            Console.WriteLine("Quiz migration completed successfully!");
        }

        private async Task ProcessQuizFileAsync(string filePath)
        {
            try
            {
                var fileName = System.IO.Path.GetFileNameWithoutExtension(filePath);
                Console.WriteLine($"Processing quiz file: {fileName}");

                var jsonContent = await File.ReadAllTextAsync(filePath);
                var quizData = JsonSerializer.Deserialize<QuizFileData>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (quizData?.Questions == null)
                {
                    Console.WriteLine($"No questions found in {fileName}");
                    return;
                }

                // Try to find a matching lesson by topic/filename
                var lesson = await FindMatchingLessonAsync(fileName);
                if (lesson == null)
                {
                    Console.WriteLine($"Warning: No matching lesson found for {fileName}. Creating quizzes without lesson association.");
                }

                foreach (var question in quizData.Questions)
                {
                    // Check if quiz already exists
                    var existingQuiz = await _context.Set<LessonQuiz>()
                        .FirstOrDefaultAsync(q => q.Question == question.Question);

                    if (existingQuiz != null)
                    {
                        Console.WriteLine($"Quiz already exists: {question.Question.Substring(0, Math.Min(50, question.Question.Length))}...");
                        continue;
                    }

                    var lessonQuiz = new LessonQuiz
                    {
                        LessonId = lesson?.Id ?? 1, // Default to lesson ID 1 if not found
                        Question = question.Question,
                        Topic = question.Topic,
                        Difficulty = question.Difficulty,
                        Choices = JsonSerializer.Serialize(question.Choices),
                        CorrectAnswer = question.CorrectAnswer,
                        Explanation = question.Explanation,
                        QuizType = question.Type ?? "multiple-choice",
                        SortOrder = question.Id,
                        EstimatedTime = question.EstimatedTime.HasValue ? question.EstimatedTime.Value : 60,
                        IsPublished = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Set<LessonQuiz>().Add(lessonQuiz);
                }

                Console.WriteLine($"Processed {quizData.Questions.Count} questions from {fileName}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing file {filePath}: {ex.Message}");
            }
        }

        private async Task<Lesson?> FindMatchingLessonAsync(string fileName)
        {
            // Try to find lesson by matching filename patterns
            var searchTerms = fileName.Replace("-", " ").Split(' ');
            
            foreach (var term in searchTerms)
            {
                var lesson = await _context.Set<Lesson>()
                    .FirstOrDefaultAsync(l => l.Title.ToLower().Contains(term.ToLower()));
                if (lesson != null)
                {
                    return lesson;
                }
            }

            return null;
        }
    }

    // Data models for JSON deserialization
    public class QuizFileData
    {
        public List<QuizQuestionData> Questions { get; set; } = new();
    }

    public class QuizQuestionData
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public string Topic { get; set; } = string.Empty;
        public string Difficulty { get; set; } = string.Empty;
        public List<string> Choices { get; set; } = new();
        public string Explanation { get; set; } = string.Empty;
        public string? IndustryContext { get; set; }
        public List<string> Tags { get; set; } = new();
        public string? QuestionType { get; set; }
        public int? EstimatedTime { get; set; }
        public int CorrectAnswer { get; set; }
        public string? Type { get; set; }
        public List<object> Sources { get; set; } = new();
        // New fields
        public bool? FixedChoiceOrder { get; set; }
        public List<string>? ChoiceLabels { get; set; }
        public List<string>? AcceptedAnswers { get; set; }
    }
}