using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Text.Json;

namespace backend.Services
{
    public class AutomatedMigrationService
    {
        private readonly GlassCodeDbContext _context;
        private readonly string _contentPath;

        public AutomatedMigrationService(GlassCodeDbContext context)
        {
            _context = context;
            _contentPath = DataService.ContentPath;
        }

        /// <summary>
        /// Performs a complete migration of all content from JSON files to the database
        /// </summary>
        public async Task<bool> PerformFullMigrationAsync()
        {
            try
            {
                Console.WriteLine("🚀 Starting full automated migration process...");

                // Step 1: Ensure database is created and up to date
                Console.WriteLine("📋 Ensuring database schema is up to date...");
                await _context.Database.MigrateAsync();

                // Step 2: Seed modules from registry
                Console.WriteLine("🌱 Seeding modules from registry...");
                await SeedModulesFromRegistryAsync();

                // Step 3: Seed lessons from JSON files
                Console.WriteLine("📚 Seeding lessons from JSON files...");
                await SeedLessonsFromJsonAsync();

                // Step 4: Seed quizzes from JSON files
                Console.WriteLine("❓ Seeding quizzes from JSON files...");
                await SeedQuizzesFromJsonAsync();

                // Step 5: Validate migration
                Console.WriteLine("✅ Validating migration results...");
                await ValidateMigrationAsync();

                Console.WriteLine("🎉 Full migration completed successfully!");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Migration failed: {ex.Message}");
                Console.WriteLine($"📍 Stack trace: {ex.StackTrace}");
                return false;
            }
        }

        /// <summary>
        /// Seeds modules from the registry.json file
        /// </summary>
        private async Task SeedModulesFromRegistryAsync()
        {
            try
            {
                var registryPath = System.IO.Path.Combine(_contentPath, "registry.json");
                if (!System.IO.File.Exists(registryPath))
                {
                    Console.WriteLine($"⚠️ Registry file not found at: {registryPath}");
                    return;
                }

                var jsonContent = await System.IO.File.ReadAllTextAsync(registryPath);
                var registryData = JsonSerializer.Deserialize<ModuleRegistryData>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (registryData?.Modules == null || !registryData.Modules.Any())
                {
                    Console.WriteLine("⚠️ No modules found in registry.json");
                    return;
                }

                // Ensure we have a default course
                var defaultCourse = await _context.Courses.FirstOrDefaultAsync();
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
                    _context.Courses.Add(defaultCourse);
                    await _context.SaveChangesAsync();
                    Console.WriteLine("✅ Created default course");
                }

                // Add modules from registry
                var moduleOrder = 1;
                foreach (var moduleData in registryData.Modules)
                {
                    // Check if module already exists
                    var existingModule = await _context.Modules
                        .FirstOrDefaultAsync(m => m.Slug == moduleData.Slug);
                    
                    if (existingModule == null)
                    {
                        var module = new Module
                        {
                            Title = moduleData.Title,
                            Slug = moduleData.Slug,
                            Description = moduleData.Description,
                            Order = moduleOrder++,
                            CourseId = defaultCourse.Id,
                            IsPublished = true,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        _context.Modules.Add(module);
                        Console.WriteLine($"➕ Added module: {module.Title}");
                    }
                    else
                    {
                        Console.WriteLine($"🔄 Updated module: {existingModule.Title}");
                        existingModule.Title = moduleData.Title;
                        existingModule.Description = moduleData.Description;
                        existingModule.Order = moduleOrder++;
                        existingModule.UpdatedAt = DateTime.UtcNow;
                    }
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ Successfully processed {registryData.Modules.Count} modules from registry.json");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error seeding modules from registry: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Seeds lessons from JSON files
        /// </summary>
        private async Task SeedLessonsFromJsonAsync()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(_contentPath, "lessons");
                
                if (!Directory.Exists(lessonsPath))
                {
                    Console.WriteLine($"⚠️ Lessons directory not found: {lessonsPath}");
                    return;
                }

                var jsonFiles = Directory.GetFiles(lessonsPath, "*.json");
                Console.WriteLine($"📁 Found {jsonFiles.Length} lesson files to process");

                foreach (var file in jsonFiles)
                {
                    await ProcessLessonFileAsync(file);
                }

                await _context.SaveChangesAsync();
                Console.WriteLine("✅ Lesson seeding completed!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error seeding lessons: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Processes a single lesson JSON file
        /// </summary>
        private async Task ProcessLessonFileAsync(string filePath)
        {
            try
            {
                var fileName = System.IO.Path.GetFileNameWithoutExtension(filePath);
                Console.WriteLine($"📄 Processing lesson file: {fileName}");

                var jsonContent = await File.ReadAllTextAsync(filePath);
                
                // Try to parse as array first
                try
                {
                    var lessons = JsonSerializer.Deserialize<List<JsonElement>>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                    if (lessons != null && lessons.Any())
                    {
                        Console.WriteLine($"   📚 Found {lessons.Count} lessons in array format");
                        
                        foreach (var lessonElement in lessons)
                        {
                            await ProcessSingleLessonAsync(lessonElement, fileName);
                        }
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
                            Console.WriteLine($"   📚 Found lessons array in wrapper object");
                            
                            foreach (var lessonElement in lessonsElement.EnumerateArray())
                            {
                                await ProcessSingleLessonAsync(lessonElement, fileName);
                            }
                        }
                    }
                    catch (JsonException)
                    {
                        Console.WriteLine($"   ⚠️ Could not parse lesson file {fileName} as expected format");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error processing lesson file {filePath}: {ex.Message}");
            }
        }

        /// <summary>
        /// Processes a single lesson element
        /// </summary>
        private async Task ProcessSingleLessonAsync(JsonElement lessonElement, string fileName)
        {
            try
            {
                var lessonData = JsonSerializer.Deserialize<LessonData>(lessonElement.GetRawText(), new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (lessonData == null)
                {
                    Console.WriteLine($"   ⚠️ Failed to deserialize lesson data");
                    return;
                }

                // Find the module by matching filename to module slug
                var moduleSlug = fileName.Replace("-fundamentals", "")
                                         .Replace("-advanced", "")
                                         .Replace("-basics", "");
                
                var module = await _context.Modules
                    .FirstOrDefaultAsync(m => m.Slug.Contains(moduleSlug, StringComparison.OrdinalIgnoreCase) || 
                                            fileName.Contains(m.Slug, StringComparison.OrdinalIgnoreCase));

                if (module == null)
                {
                    Console.WriteLine($"   ⚠️ No matching module found for {fileName}, using first available module");
                    module = await _context.Modules.FirstOrDefaultAsync();
                    if (module == null)
                    {
                        Console.WriteLine($"   ⚠️ No modules available, skipping lesson");
                        return;
                    }
                }

                // Check if lesson already exists
                var existingLesson = await _context.Lessons
                    .FirstOrDefaultAsync(l => l.Slug == lessonData.Slug && l.ModuleId == module.Id);

                if (existingLesson == null)
                {
                    // Create content and metadata objects
                    var contentData = new
                    {
                        intro = lessonData.Intro,
                        objectives = lessonData.Objectives,
                        code = lessonData.Code,
                        pitfalls = lessonData.Pitfalls,
                        exercises = lessonData.Exercises,
                        next = lessonData.Next,
                        sources = lessonData.Sources
                    };

                    var metadataData = new
                    {
                        tags = lessonData.Tags,
                        topic = lessonData.Topic,
                        description = lessonData.Description,
                        codeExample = lessonData.CodeExample,
                        output = lessonData.Output,
                        version = lessonData.Version,
                        lastUpdated = lessonData.LastUpdated
                    };

                    var lesson = new Lesson
                    {
                        Title = lessonData.Title ?? "Untitled Lesson",
                        Slug = lessonData.Slug ?? Guid.NewGuid().ToString(),
                        Order = lessonData.Order ?? 1,
                        Content = JsonSerializer.Serialize(contentData),
                        Metadata = JsonSerializer.Serialize(metadataData),
                        Difficulty = lessonData.Difficulty ?? "Beginner",
                        EstimatedMinutes = lessonData.EstimatedMinutes ?? 30,
                        ModuleId = module.Id,
                        IsPublished = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Lessons.Add(lesson);
                    Console.WriteLine($"   ➕ Added lesson: {lesson.Title}");
                }
                else
                {
                    Console.WriteLine($"   🔄 Lesson already exists: {existingLesson.Title}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   ❌ Error processing single lesson: {ex.Message}");
            }
        }

        /// <summary>
        /// Seeds quizzes from JSON files
        /// </summary>
        private async Task SeedQuizzesFromJsonAsync()
        {
            try
            {
                var quizzesPath = System.IO.Path.Combine(_contentPath, "quizzes");
                
                if (!Directory.Exists(quizzesPath))
                {
                    Console.WriteLine($"⚠️ Quizzes directory not found: {quizzesPath}");
                    return;
                }

                var jsonFiles = Directory.GetFiles(quizzesPath, "*.json");
                Console.WriteLine($"📁 Found {jsonFiles.Length} quiz files to process");

                foreach (var file in jsonFiles)
                {
                    await ProcessQuizFileAsync(file);
                }

                await _context.SaveChangesAsync();
                Console.WriteLine("✅ Quiz seeding completed!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error seeding quizzes: {ex.Message}");
                throw;
            }
        }

        /// <summary>
        /// Processes a single quiz JSON file
        /// </summary>
        private async Task ProcessQuizFileAsync(string filePath)
        {
            try
            {
                var fileName = System.IO.Path.GetFileNameWithoutExtension(filePath);
                Console.WriteLine($"📄 Processing quiz file: {fileName}");

                var jsonContent = await File.ReadAllTextAsync(filePath);
                var quizData = JsonSerializer.Deserialize<QuizFileData>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (quizData?.Questions == null || !quizData.Questions.Any())
                {
                    Console.WriteLine($"   ⚠️ No questions found in {fileName}");
                    return;
                }

                // Try to find a matching lesson by filename
                var lesson = await FindMatchingLessonAsync(fileName);
                if (lesson == null)
                {
                    Console.WriteLine($"   ⚠️ No matching lesson found for {fileName}. Skipping quiz migration.");
                    return;
                }

                foreach (var question in quizData.Questions)
                {
                    // Check if quiz already exists
                    var existingQuiz = await _context.LessonQuizzes
                        .FirstOrDefaultAsync(q => q.Question == question.Question && q.LessonId == lesson.Id);

                    if (existingQuiz == null)
                    {
                        var lessonQuiz = new LessonQuiz
                        {
                            LessonId = lesson.Id,
                            Question = question.Question,
                            Topic = question.Topic,
                            Difficulty = question.Difficulty ?? "Beginner",
                            Choices = question.Choices != null ? JsonSerializer.Serialize(question.Choices) : null,
                            CorrectAnswer = question.CorrectAnswer,
                            Explanation = question.Explanation,
                            QuizType = question.Type ?? "multiple-choice",
                            QuestionType = question.QuestionType ?? question.Type ?? "multiple-choice",
                            SortOrder = question.Id ?? 0,
                            EstimatedTime = question.EstimatedTime ?? 60,
                            IsPublished = true,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };

                        _context.LessonQuizzes.Add(lessonQuiz);
                        Console.WriteLine($"   ➕ Added quiz question: {question.Question.Substring(0, Math.Min(50, question.Question.Length))}...");
                    }
                    else
                    {
                        Console.WriteLine($"   🔄 Quiz question already exists: {existingQuiz.Question.Substring(0, Math.Min(50, existingQuiz.Question.Length))}...");
                    }
                }

                Console.WriteLine($"   ✅ Processed {quizData.Questions.Count} questions from {fileName}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error processing quiz file {filePath}: {ex.Message}");
            }
        }

        /// <summary>
        /// Finds a matching lesson for a quiz file
        /// </summary>
        private async Task<Lesson?> FindMatchingLessonAsync(string fileName)
        {
            // Try exact slug match first
            var lesson = await _context.Lessons
                .FirstOrDefaultAsync(l => l.Slug == fileName);
            
            if (lesson != null)
            {
                return lesson;
            }

            // Try to find lesson by matching filename patterns
            var searchTerms = fileName.Replace("-", " ").Split(' ');
            
            foreach (var term in searchTerms)
            {
                lesson = await _context.Lessons
                    .FirstOrDefaultAsync(l => l.Title.ToLower().Contains(term.ToLower()));
                if (lesson != null)
                {
                    return lesson;
                }
            }

            // Fallback: return first lesson
            return await _context.Lessons.FirstOrDefaultAsync();
        }

        /// <summary>
        /// Validates the migration results
        /// </summary>
        private async Task ValidateMigrationAsync()
        {
            var moduleCount = await _context.Modules.CountAsync();
            var lessonCount = await _context.Lessons.CountAsync();
            var quizCount = await _context.LessonQuizzes.CountAsync();

            Console.WriteLine($"📊 Migration Summary:");
            Console.WriteLine($"   Modules: {moduleCount}");
            Console.WriteLine($"   Lessons: {lessonCount}");
            Console.WriteLine($"   Quiz Questions: {quizCount}");

            if (moduleCount > 0 && lessonCount > 0)
            {
                Console.WriteLine($"✅ Migration validation passed");
            }
            else
            {
                Console.WriteLine($"⚠️ Migration validation has concerns - some entities are missing");
            }
        }
    }

    // Data models for JSON deserialization
    public class LessonData
    {
        public int? Id { get; set; }
        public string? Title { get; set; }
        public string? Slug { get; set; }
        public int? Order { get; set; }
        public string? Difficulty { get; set; }
        public int? EstimatedMinutes { get; set; }
        public string? Intro { get; set; }
        public string? Objectives { get; set; }
        public string? Code { get; set; }
        public string? Pitfalls { get; set; }
        public string? Exercises { get; set; }
        public string? Next { get; set; }
        public List<string>? Sources { get; set; }
        public List<string>? Tags { get; set; }
        public string? Topic { get; set; }
        public string? Description { get; set; }
        public string? CodeExample { get; set; }
        public string? Output { get; set; }
        public string? Version { get; set; }
        public string? LastUpdated { get; set; }
    }
}