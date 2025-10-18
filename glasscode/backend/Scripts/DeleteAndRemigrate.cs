using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Scripts
{
    public class DeleteAndRemigrate
    {
        private readonly GlassCodeDbContext _context;
        private readonly string _contentPath;

        public DeleteAndRemigrate(GlassCodeDbContext context, string contentPath = "/Users/veland/GlassCodeAcademy/content")
        {
            _context = context;
            _contentPath = contentPath;
        }

        public async Task DeleteSpecificModulesAndRemigrate()
        {
            Console.WriteLine("Starting deletion and re-migration process...");

            // Step 1: Delete specific modules and their related data
            await DeleteModulesBySlugAsync("programming-fundamentals");
            await DeleteModulesBySlugAsync("web-fundamentals");

            // Step 2: Re-migrate all content from JSON files
            await RemigrateLessonsAsync();
            await RemigrateQuizzesAsync();

            Console.WriteLine("Deletion and re-migration completed successfully!");
        }

        private async Task DeleteModulesBySlugAsync(string moduleSlug)
        {
            Console.WriteLine($"Deleting module: {moduleSlug}");

            // Find the module by slug
            var module = await _context.Set<Module>()
                .Include(m => m.Lessons)
                    .ThenInclude(l => l.LessonQuizzes)
                .FirstOrDefaultAsync(m => m.Slug == moduleSlug);

            if (module == null)
            {
                Console.WriteLine($"Module '{moduleSlug}' not found in database");
                return;
            }

            // Delete all lesson quizzes for this module
            foreach (var lesson in module.Lessons)
            {
                var quizzes = await _context.Set<LessonQuiz>()
                    .Where(q => q.LessonId == lesson.Id)
                    .ToListAsync();

                if (quizzes.Any())
                {
                    _context.Set<LessonQuiz>().RemoveRange(quizzes);
                    Console.WriteLine($"Deleted {quizzes.Count} quizzes for lesson: {lesson.Title}");
                }
            }

            // Delete all lessons for this module
            var lessons = await _context.Set<Lesson>()
                .Where(l => l.ModuleId == module.Id)
                .ToListAsync();

            if (lessons.Any())
            {
                _context.Set<Lesson>().RemoveRange(lessons);
                Console.WriteLine($"Deleted {lessons.Count} lessons for module: {module.Title}");
            }

            // Delete the module itself
            _context.Set<Module>().Remove(module);
            Console.WriteLine($"Deleted module: {module.Title}");

            await _context.SaveChangesAsync();
        }

        private async Task RemigrateLessonsAsync()
        {
            Console.WriteLine("Re-migrating lessons from JSON files...");

            var lessonsPath = System.IO.Path.Combine(_contentPath, "lessons");
            
            if (!Directory.Exists(lessonsPath))
            {
                Console.WriteLine($"Lessons directory not found: {lessonsPath}");
                return;
            }

            var jsonFiles = Directory.GetFiles(lessonsPath, "*.json", SearchOption.AllDirectories);
            Console.WriteLine($"Found {jsonFiles.Length} lesson files to process");

            foreach (var file in jsonFiles)
            {
                await ProcessLessonFileAsync(file);
            }

            await _context.SaveChangesAsync();
            Console.WriteLine("Lesson re-migration completed!");
        }

        private async Task ProcessLessonFileAsync(string filePath)
        {
            try
            {
                var fileName = System.IO.Path.GetFileNameWithoutExtension(filePath);
                Console.WriteLine($"Processing lesson file: {fileName}");

                var jsonContent = await File.ReadAllTextAsync(filePath);
                var lessonData = JsonSerializer.Deserialize<LessonFileData>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (lessonData == null)
                {
                    Console.WriteLine($"Failed to deserialize lesson data from {fileName}");
                    return;
                }

                // Check if lesson already exists
                var existingLesson = await _context.Set<Lesson>()
                    .FirstOrDefaultAsync(l => l.Slug == lessonData.Slug);

                if (existingLesson != null)
                {
                    Console.WriteLine($"Lesson already exists: {lessonData.Title}");
                    return;
                }

                // Find or create module
                var module = await FindOrCreateModuleAsync(lessonData.ModuleSlug);

                var lesson = new Lesson
                {
                    Title = lessonData.Title,
                    Slug = lessonData.Slug,
                    Content = JsonSerializer.Serialize(lessonData.Content),
                    Difficulty = lessonData.Difficulty ?? "Beginner",
                    EstimatedMinutes = lessonData.EstimatedMinutes ?? 30,
                    Order = lessonData.Order ?? 1,
                    ModuleId = module.Id,
                    IsPublished = lessonData.IsPublished ?? true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Set<Lesson>().Add(lesson);
                Console.WriteLine($"Added lesson: {lessonData.Title}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing lesson file {filePath}: {ex.Message}");
            }
        }

        private async Task<Module> FindOrCreateModuleAsync(string moduleSlug)
        {
            var module = await _context.Set<Module>()
                .FirstOrDefaultAsync(m => m.Slug == moduleSlug);

            if (module != null)
            {
                return module;
            }

            // Create a basic module if it doesn't exist
            var newModule = new Module
            {
                Title = moduleSlug.Replace("-", " ").ToTitleCase(),
                Slug = moduleSlug,
                Description = $"Module for {moduleSlug}",
                Order = 1,
                CourseId = 1, // Default course ID
                IsPublished = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Set<Module>().Add(newModule);
            await _context.SaveChangesAsync();
            
            Console.WriteLine($"Created new module: {newModule.Title}");
            return newModule;
        }

        private async Task RemigrateQuizzesAsync()
        {
            Console.WriteLine("Re-migrating quizzes from JSON files...");

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
            Console.WriteLine("Quiz re-migration completed!");
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

                // Try to find a matching lesson by filename
                var lesson = await FindMatchingLessonAsync(fileName);
                if (lesson == null)
                {
                    Console.WriteLine($"Warning: No matching lesson found for {fileName}. Skipping quiz migration.");
                    return;
                }

                foreach (var question in quizData.Questions)
                {
                    // Check if quiz already exists
                    var existingQuiz = await _context.Set<LessonQuiz>()
                        .FirstOrDefaultAsync(q => q.Question == question.Question && q.LessonId == lesson.Id);

                    if (existingQuiz != null)
                    {
                        Console.WriteLine($"Quiz already exists: {question.Question.Substring(0, Math.Min(50, question.Question.Length))}...");
                        continue;
                    }

                    var lessonQuiz = new LessonQuiz
                    {
                        LessonId = lesson.Id,
                        Question = question.Question,
                        Topic = question.Topic,
                        Difficulty = question.Difficulty,
                        Choices = JsonSerializer.Serialize(question.Choices),
                        CorrectAnswer = question.CorrectAnswer,
                        Explanation = question.Explanation,
                        QuizType = question.Type ?? "multiple-choice",
                        QuestionType = question.QuestionType ?? "multiple-choice",
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
                Console.WriteLine($"Error processing quiz file {filePath}: {ex.Message}");
            }
        }

        private async Task<Lesson?> FindMatchingLessonAsync(string fileName)
        {
            // Try exact slug match first
            var lesson = await _context.Set<Lesson>()
                .FirstOrDefaultAsync(l => l.Slug == fileName);
            
            if (lesson != null)
            {
                return lesson;
            }

            // Try to find lesson by matching filename patterns
            var searchTerms = fileName.Replace("-", " ").Split(' ');
            
            foreach (var term in searchTerms)
            {
                lesson = await _context.Set<Lesson>()
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
    public class LessonFileData
    {
        public string Title { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string ModuleSlug { get; set; } = string.Empty;
        public object Content { get; set; } = new();
        public string? Difficulty { get; set; }
        public int? EstimatedMinutes { get; set; }
        public int? Order { get; set; }
        public bool? IsPublished { get; set; }
    }
}

// Extension method for string formatting
public static class StringExtensions
{
    public static string ToTitleCase(this string input)
    {
        if (string.IsNullOrEmpty(input))
            return input;

        var words = input.Split(' ');
        for (int i = 0; i < words.Length; i++)
        {
            if (words[i].Length > 0)
            {
                words[i] = char.ToUpper(words[i][0]) + words[i].Substring(1).ToLower();
            }
        }
        return string.Join(" ", words);
    }
}