using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using backend.Data;
using backend.Models;
using System.Text.Json;
using System.Linq;

// Use alias to avoid conflict with HotChocolate.Path
using IOPath = System.IO.Path;

namespace backend.Scripts
{
    public class FixContentSeeding
    {
        public static async Task Main(string[] args)
        {
            var builder = Host.CreateApplicationBuilder(args);
            
            // Configure database connection
            var connectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING") ?? 
                                 "Host=localhost;Database=glasscode_dev;Username=postgres;Password=postgres";
            builder.Services.AddDbContext<GlassCodeDbContext>(options =>
                options.UseNpgsql(connectionString));
            
            var host = builder.Build();
            
            using var scope = host.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GlassCodeDbContext>();
            
            await FixContent(context);
        }
        
        public static async Task FixContent(GlassCodeDbContext context)
        {
            Console.WriteLine("[START] Starting content fixing process...");
            
            // Load registry to get expected counts
            var assemblyLocation = System.Reflection.Assembly.GetExecutingAssembly().Location;
            if (string.IsNullOrEmpty(assemblyLocation))
            {
                Console.WriteLine("[ERROR] Unable to determine assembly location");
                return;
            }
            
            var registryPath = IOPath.Combine(IOPath.GetDirectoryName(assemblyLocation) ?? "", "..", "..", "content", "registry.json");
            if (!File.Exists(registryPath))
            {
                Console.WriteLine($"[ERROR] Registry file not found at: {registryPath}");
                return;
            }
            
            var registryJson = await File.ReadAllTextAsync(registryPath);
            var registry = JsonSerializer.Deserialize<ModuleRegistryData>(registryJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            
            if (registry?.Modules == null)
            {
                Console.WriteLine("[ERROR] Failed to parse registry.json");
                return;
            }
            
            Console.WriteLine($"[INFO] Expected modules from registry: {registry.Modules.Count}");
            
            // Ensure we have a default course
            var defaultCourse = await context.Courses.FirstOrDefaultAsync();
            if (defaultCourse == null)
            {
                defaultCourse = new Course
                {
                    Title = "Glass Code Academy",
                    Description = "Comprehensive programming course",
                    IsPublished = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                context.Courses.Add(defaultCourse);
                await context.SaveChangesAsync();
                Console.WriteLine("[SUCCESS] Created default course");
            }
            
            // Fix modules
            Console.WriteLine("\n[MODULE_FIX] Fixing modules...");
            var moduleOrder = 1;
            foreach (var expectedModule in registry.Modules)
            {
                var dbModule = await context.Modules
                    .FirstOrDefaultAsync(m => m.Slug == expectedModule.Slug);
                
                if (dbModule == null)
                {
                    dbModule = new Module
                    {
                        Title = expectedModule.Title,
                        Slug = expectedModule.Slug,
                        Description = expectedModule.Description,
                        Order = moduleOrder++,
                        CourseId = defaultCourse.Id,
                        IsPublished = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    context.Modules.Add(dbModule);
                    Console.WriteLine($"[ADD] Added missing module: {expectedModule.Title}");
                }
                else
                {
                    // Update existing module info
                    dbModule.Title = expectedModule.Title;
                    dbModule.Description = expectedModule.Description;
                    dbModule.Order = moduleOrder++;
                    dbModule.UpdatedAt = DateTime.UtcNow;
                    Console.WriteLine($"[UPDATE] Updated module: {expectedModule.Title}");
                }
            }
            
            await context.SaveChangesAsync();
            
            // Fix lessons and quizzes for each module
            Console.WriteLine("\n[CONTENT_FIX] Fixing lessons and quizzes...");
            foreach (var expectedModule in registry.Modules)
            {
                var dbModule = await context.Modules
                    .Include(m => m.Lessons)
                    .ThenInclude(l => l.LessonQuizzes)
                    .FirstOrDefaultAsync(m => m.Slug == expectedModule.Slug);
                
                if (dbModule == null) continue;
                
                // Check if we need to seed lessons
                var expectedLessonCount = expectedModule.Thresholds?.RequiredLessons ?? 0;
                var actualLessonCount = dbModule.Lessons.Count;
                
                if (actualLessonCount < expectedLessonCount)
                {
                    Console.WriteLine($"[LESSON_SEED] Seeding lessons for {expectedModule.Title}...");
                    await SeedLessonsForModule(context, dbModule, expectedModule);
                }
                
                // Check if we need to seed quizzes
                var expectedQuizCount = expectedModule.Thresholds?.RequiredQuestions ?? 0;
                var actualQuizCount = dbModule.Lessons.SelectMany(l => l.LessonQuizzes).Count();
                
                if (actualQuizCount < expectedQuizCount)
                {
                    Console.WriteLine($"[QUIZ_SEED] Seeding quizzes for {expectedModule.Title}...");
                    await SeedQuizzesForModule(context, dbModule, expectedModule);
                }
            }
            
            Console.WriteLine("\n[SUCCESS] Content fixing process completed!");
        }
        
        private static async Task SeedLessonsForModule(GlassCodeDbContext context, Module dbModule, ModuleData expectedModule)
        {
            try
            {
                var assemblyLocation = System.Reflection.Assembly.GetExecutingAssembly().Location;
                if (string.IsNullOrEmpty(assemblyLocation))
                {
                    Console.WriteLine($"   [LESSON_ERROR] Unable to determine assembly location for {expectedModule.Slug}");
                    return;
                }
                
                var lessonsPath = IOPath.Combine(IOPath.GetDirectoryName(assemblyLocation) ?? "", "..", "..", "content", "lessons", $"{expectedModule.Slug}.json");
                if (!File.Exists(lessonsPath))
                {
                    Console.WriteLine($"[WARNING] Lesson file not found for {expectedModule.Slug}");
                    return;
                }
                
                var jsonContent = await File.ReadAllTextAsync(lessonsPath);
                
                // Try to parse as array first
                try
                {
                    var lessons = JsonSerializer.Deserialize<JsonElement[]>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    if (lessons != null && lessons.Length > 0)
                    {
                        Console.WriteLine($"   [LESSON_INFO] Found {lessons.Length} lessons for {expectedModule.Slug}");
                        
                        for (int i = 0; i < lessons.Length; i++)
                        {
                            var lessonElement = lessons[i];
                            var title = "Untitled Lesson";
                            var order = i + 1;
                            
                            if (lessonElement.TryGetProperty("title", out var titleElement) && 
                                titleElement.ValueKind == JsonValueKind.String)
                            {
                                title = titleElement.GetString() ?? title;
                            }
                            
                            if (lessonElement.TryGetProperty("order", out var orderElement))
                            {
                                if (orderElement.ValueKind == JsonValueKind.Number)
                                    order = orderElement.GetInt32();
                                else if (orderElement.ValueKind == JsonValueKind.String && 
                                        int.TryParse(orderElement.GetString(), out var parsedOrder))
                                    order = parsedOrder;
                            }
                            
                            // Truncate title to 200 characters if needed
                            if (title.Length > 200)
                                title = title.Substring(0, 200);
                            
                            var lesson = new Lesson
                            {
                                Title = title,
                                Slug = GenerateSlug(title),
                                ModuleId = dbModule.Id,
                                Order = order,
                                Content = lessonElement.GetRawText(), // Store raw JSON for now
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            
                            context.Lessons.Add(lesson);
                        }
                        
                        await context.SaveChangesAsync();
                        Console.WriteLine($"   [LESSON_SUCCESS] Added {lessons.Length} lessons for {expectedModule.Title}");
                    }
                }
                catch (JsonException)
                {
                    // Try parsing as object with lessons property
                    try
                    {
                        var wrapper = JsonSerializer.Deserialize<JsonElement>(jsonContent);
                        if (wrapper.ValueKind == JsonValueKind.Object && 
                            wrapper.TryGetProperty("lessons", out var lessonsElement) && 
                            lessonsElement.ValueKind == JsonValueKind.Array)
                        {
                            var lessonsArray = lessonsElement.EnumerateArray().ToArray();
                            Console.WriteLine($"   [LESSON_INFO] Found {lessonsArray.Length} lessons in wrapper for {expectedModule.Slug}");
                            
                            for (int i = 0; i < lessonsArray.Length; i++)
                            {
                                var lessonElement = lessonsArray[i];
                                var title = "Untitled Lesson";
                                var order = i + 1;
                                
                                if (lessonElement.TryGetProperty("title", out var titleElement) && 
                                    titleElement.ValueKind == JsonValueKind.String)
                                {
                                    title = titleElement.GetString() ?? title;
                                }
                                
                                if (lessonElement.TryGetProperty("order", out var orderElement))
                                {
                                    if (orderElement.ValueKind == JsonValueKind.Number)
                                        order = orderElement.GetInt32();
                                    else if (orderElement.ValueKind == JsonValueKind.String && 
                                            int.TryParse(orderElement.GetString(), out var parsedOrder))
                                        order = parsedOrder;
                                }
                                
                                // Truncate title to 200 characters if needed
                                if (title.Length > 200)
                                    title = title.Substring(0, 200);
                                
                                var lesson = new Lesson
                                {
                                    Title = title,
                                    Slug = GenerateSlug(title),
                                    ModuleId = dbModule.Id,
                                    Order = order,
                                    Content = lessonElement.GetRawText(), // Store raw JSON for now
                                    CreatedAt = DateTime.UtcNow,
                                    UpdatedAt = DateTime.UtcNow
                                };
                                
                                context.Lessons.Add(lesson);
                            }
                            
                            await context.SaveChangesAsync();
                            Console.WriteLine($"   [LESSON_SUCCESS] Added {lessonsArray.Length} lessons for {expectedModule.Title}");
                        }
                    }
                    catch (JsonException ex2)
                    {
                        Console.WriteLine($"   [LESSON_ERROR] Failed to parse lesson file for {expectedModule.Slug}: {ex2.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   [LESSON_ERROR] Error processing lessons for {expectedModule.Slug}: {ex.Message}");
            }
        }
        
        private static async Task SeedQuizzesForModule(GlassCodeDbContext context, Module dbModule, ModuleData expectedModule)
        {
            try
            {
                var assemblyLocation = System.Reflection.Assembly.GetExecutingAssembly().Location;
                if (string.IsNullOrEmpty(assemblyLocation))
                {
                    Console.WriteLine($"   [QUIZ_ERROR] Unable to determine assembly location for {expectedModule.Slug}");
                    return;
                }
                
                var quizzesPath = IOPath.Combine(IOPath.GetDirectoryName(assemblyLocation) ?? "", "..", "..", "content", "quizzes", $"{expectedModule.Slug}.json");
                if (!File.Exists(quizzesPath))
                {
                    Console.WriteLine($"   [QUIZ_WARNING] Quiz file not found for {expectedModule.Slug}");
                    return;
                }
                
                var jsonContent = await File.ReadAllTextAsync(quizzesPath);
                var quizData = JsonSerializer.Deserialize<QuizFileData>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                if (quizData?.Questions != null && quizData.Questions.Count > 0)
                {
                    Console.WriteLine($"   [QUIZ_INFO] Found {quizData.Questions.Count} questions for {expectedModule.Slug}");
                    
                    // Distribute questions across existing lessons
                    var lessons = await context.Lessons
                        .Where(l => l.ModuleId == dbModule.Id)
                        .OrderBy(l => l.Order)
                        .ToListAsync();
                    
                    if (lessons.Count == 0)
                    {
                        Console.WriteLine($"   [QUIZ_WARNING] No lessons found for {expectedModule.Slug}, creating placeholder lesson");
                        var placeholderLesson = new Lesson
                        {
                            Title = $"{expectedModule.Title} Overview",
                            Slug = GenerateSlug($"{expectedModule.Title} Overview"),
                            ModuleId = dbModule.Id,
                            Order = 1,
                            Content = "{}",
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        context.Lessons.Add(placeholderLesson);
                        await context.SaveChangesAsync();
                        lessons.Add(placeholderLesson);
                    }
                    
                    // Distribute questions evenly across lessons
                    var questionsPerLesson = Math.Max(1, quizData.Questions.Count / lessons.Count);
                    var questionIndex = 0;
                    
                    foreach (var lesson in lessons)
                    {
                        var questionsForThisLesson = quizData.Questions
                            .Skip(questionIndex)
                            .Take(questionsPerLesson)
                            .ToList();
                        
                        if (questionsForThisLesson.Count == 0) continue;
                        
                        foreach (var question in questionsForThisLesson)
                        {
                            var quizQuestion = new LessonQuiz
                            {
                                LessonId = lesson.Id,
                                Question = question.Question ?? "Untitled Question",
                                Choices = question.Choices != null ? string.Join("|", question.Choices) : "",
                                CorrectAnswer = question.CorrectAnswer,
                                Explanation = question.Explanation ?? "",
                                Difficulty = question.Difficulty ?? "Beginner",
                                QuestionType = question.QuestionType ?? "multiple-choice",
                                Topic = question.Topic ?? "general",
                                EstimatedTime = question.EstimatedTime ?? 90,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            
                            context.LessonQuizzes.Add(quizQuestion);
                        }
                        
                        Console.WriteLine($"   [QUIZ_SUCCESS] Added {questionsForThisLesson.Count} questions to lesson {lesson.Title}");
                        questionIndex += questionsForThisLesson.Count;
                    }
                    
                    // Handle any remaining questions
                    if (questionIndex < quizData.Questions.Count)
                    {
                        var remainingQuestions = quizData.Questions.Skip(questionIndex).ToList();
                        var lastLesson = lessons.Last();
                        
                        foreach (var question in remainingQuestions)
                        {
                            var quizQuestion = new LessonQuiz
                            {
                                LessonId = lastLesson.Id,
                                Question = question.Question ?? "Untitled Question",
                                Choices = question.Choices != null ? string.Join("|", question.Choices) : "",
                                CorrectAnswer = question.CorrectAnswer,
                                Explanation = question.Explanation ?? "",
                                Difficulty = question.Difficulty ?? "Beginner",
                                QuestionType = question.QuestionType ?? "multiple-choice",
                                Topic = question.Topic ?? "general",
                                EstimatedTime = question.EstimatedTime ?? 90,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };
                            
                            context.LessonQuizzes.Add(quizQuestion);
                        }
                        
                        Console.WriteLine($"   [QUIZ_SUCCESS] Added {remainingQuestions.Count} remaining questions to lesson {lastLesson.Title}");
                    }
                    
                    await context.SaveChangesAsync();
                    Console.WriteLine($"   [QUIZ_SUCCESS] Added {quizData.Questions.Count} questions for {expectedModule.Title}");
                }
                else
                {
                    Console.WriteLine($"   [QUIZ_WARNING] No questions found in quiz file for {expectedModule.Slug}");
                }
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"   [QUIZ_ERROR] Invalid JSON in quiz file for {expectedModule.Slug}: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   [QUIZ_ERROR] Error processing quizzes for {expectedModule.Slug}: {ex.Message}");
            }
        }
        
        private static string GenerateSlug(string input)
        {
            if (string.IsNullOrEmpty(input)) return "untitled";
            
            return input.ToLower()
                         .Replace(" ", "-")
                         .Replace(".", "")
                         .Replace(",", "")
                         .Replace("?", "")
                         .Replace("!", "")
                         .Replace("@", "at")
                         .Replace("%", "percent")
                         .Replace("&", "and")
                         .Replace("#", "hash")
                         .Replace("$", "dollar")
                         .Replace("+", "plus")
                         .Replace("=", "equals")
                         .Replace("/", "-")
                         .Replace("\\", "-")
                         .Replace("(", "")
                         .Replace(")", "")
                         .Replace("[", "")
                         .Replace("]", "")
                         .Replace("{", "")
                         .Replace("}", "")
                         .Replace(":", "")
                         .Replace(";", "")
                         .Replace("'", "")
                         .Replace("\"", "")
                         .Trim('-');
        }
    }
}