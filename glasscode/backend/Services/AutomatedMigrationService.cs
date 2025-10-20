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
        private readonly LessonMappingService _lessonMappingService;

        public AutomatedMigrationService(GlassCodeDbContext context, LessonMappingService lessonMappingService)
        {
            _context = context;
            _lessonMappingService = lessonMappingService;
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

                // Map lessons to correct modules after seeding
                Console.WriteLine("🧭 Mapping lessons to modules...");
                await _lessonMappingService.MapLessonsToModulesAsync();

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

                var jsonFiles = Directory.GetFiles(lessonsPath, "*.json", SearchOption.AllDirectories);
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
        /// Processes a single lesson element with tolerant deserialization
        /// </summary>
        private async Task ProcessSingleLessonAsync(JsonElement lessonElement, string fileName)
        {
            try
            {
                LessonData? lessonData = null;
                try
                {
                    lessonData = JsonSerializer.Deserialize<LessonData>(lessonElement.GetRawText(), new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                }
                catch (JsonException jsonEx)
                {
                    Console.WriteLine($"   ⚠️ Typed lesson deserialization failed: {jsonEx.Message}. Using tolerant parsing.");
                }

                // Helpers for tolerant extraction
                string? GetString(JsonElement root, string name)
                {
                    if (root.TryGetProperty(name, out var el))
                    {
                        if (el.ValueKind == JsonValueKind.String)
                            return el.GetString();
                    }
                    return null;
                }

                int? GetInt(JsonElement root, string name)
                {
                    if (root.TryGetProperty(name, out var el))
                    {
                        if (el.ValueKind == JsonValueKind.Number)
                            return el.GetInt32();
                        if (el.ValueKind == JsonValueKind.String && int.TryParse(el.GetString(), out var n))
                            return n;
                    }
                    return null;
                }

                List<string>? GetStrings(JsonElement root, string name)
                {
                    if (root.TryGetProperty(name, out var el))
                    {
                        if (el.ValueKind == JsonValueKind.Array)
                        {
                            var list = new List<string>();
                            foreach (var item in el.EnumerateArray())
                            {
                                if (item.ValueKind == JsonValueKind.String && item.GetString() != null)
                                    list.Add(item.GetString()!);
                            }
                            return list.Count > 0 ? list : null;
                        }
                        if (el.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(el.GetString()))
                            return new List<string> { el.GetString()! };
                    }
                    return null;
                }

                // Prefer typed values if available, otherwise tolerant extraction
                var title = lessonData?.Title ?? GetString(lessonElement, "title");
                var slug = lessonData?.Slug ?? GetString(lessonElement, "slug");
                var order = lessonData?.Order ?? GetInt(lessonElement, "order");
                var difficulty = lessonData?.Difficulty ?? GetString(lessonElement, "difficulty");
                var estimatedMinutes = lessonData?.EstimatedMinutes ?? GetInt(lessonElement, "estimatedMinutes");
                var intro = lessonData?.Intro ?? GetString(lessonElement, "intro");
                var topic = lessonData?.Topic ?? GetString(lessonElement, "topic");
                var description = lessonData?.Description ?? GetString(lessonElement, "description");
                var codeExample = lessonData?.CodeExample ?? GetString(lessonElement, "codeExample");
                var output = lessonData?.Output ?? GetString(lessonElement, "output");
                var version = lessonData?.Version ?? GetString(lessonElement, "version");
                var lastUpdated = lessonData?.LastUpdated ?? GetString(lessonElement, "lastUpdated");

                JsonElement? codeEl = lessonData?.Code;
                if (codeEl == null && lessonElement.TryGetProperty("code", out var cEl)) codeEl = cEl;
                JsonElement? pitfallsEl = lessonData?.Pitfalls;
                if (pitfallsEl == null && lessonElement.TryGetProperty("pitfalls", out var pEl)) pitfallsEl = pEl;
                JsonElement? exercisesEl = lessonData?.Exercises;
                if (exercisesEl == null && lessonElement.TryGetProperty("exercises", out var eEl)) exercisesEl = eEl;
                JsonElement? sourcesEl = lessonData?.Sources;
                if (sourcesEl == null && lessonElement.TryGetProperty("sources", out var sEl)) sourcesEl = sEl;

                // Objectives: accept array or single string
                List<string>? objectives = lessonData?.Objectives;
                if (objectives == null)
                {
                    if (lessonElement.TryGetProperty("objectives", out var objEl))
                    {
                        if (objEl.ValueKind == JsonValueKind.Array)
                        {
                            objectives = objEl.EnumerateArray()
                                .Where(x => x.ValueKind == JsonValueKind.String && x.GetString() != null)
                                .Select(x => x.GetString()!)
                                .ToList();
                        }
                        else if (objEl.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(objEl.GetString()))
                        {
                            objectives = new List<string> { objEl.GetString()! };
                        }
                    }
                }

                // Next and tags: accept array or single string
                List<string>? next = lessonData?.Next;
                if (next == null && lessonElement.TryGetProperty("next", out var nextEl))
                {
                    if (nextEl.ValueKind == JsonValueKind.Array)
                    {
                        next = nextEl.EnumerateArray()
                            .Where(x => x.ValueKind == JsonValueKind.String && x.GetString() != null)
                            .Select(x => x.GetString()!)
                            .ToList();
                    }
                    else if (nextEl.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(nextEl.GetString()))
                    {
                        next = new List<string> { nextEl.GetString()! };
                    }
                }

                List<string>? tags = lessonData?.Tags;
                if (tags == null && lessonElement.TryGetProperty("tags", out var tagsEl))
                {
                    if (tagsEl.ValueKind == JsonValueKind.Array)
                    {
                        tags = tagsEl.EnumerateArray()
                            .Where(x => x.ValueKind == JsonValueKind.String && x.GetString() != null)
                            .Select(x => x.GetString()!)
                            .ToList();
                    }
                    else if (tagsEl.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(tagsEl.GetString()))
                    {
                        tags = new List<string> { tagsEl.GetString()! };
                    }
                }

                // Try exact module slug match first (equality), then fall back to partials
                var fileNameLower = fileName.ToLowerInvariant();
                Module? module = await _context.Modules
                    .FirstOrDefaultAsync(m =>
                        m.Slug.Equals(fileName, StringComparison.OrdinalIgnoreCase) ||
                        m.Slug.Equals(fileNameLower, StringComparison.OrdinalIgnoreCase));

                if (module == null)
                {
                    var moduleSlug = fileNameLower
                        .Replace("-lessons", "")
                        .Replace("-fundamentals", "")
                        .Replace("-advanced", "")
                        .Replace("-basics", "");

                    // Try exact equality on derived module slug
                    module = await _context.Modules
                        .FirstOrDefaultAsync(m => m.Slug.Equals(moduleSlug, StringComparison.OrdinalIgnoreCase));

                    if (module == null)
                    {
                        // Finally, fall back to partial matches
                        module = await _context.Modules.FirstOrDefaultAsync(m =>
                            m.Slug.Contains(moduleSlug, StringComparison.OrdinalIgnoreCase) ||
                            fileNameLower.Contains(m.Slug.ToLowerInvariant()));
                    }
                }

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

                // Prepare content and metadata payloads for insert/update
                var contentData = new
                {
                    intro = intro,
                    objectives = objectives,
                    code = codeEl,
                    pitfalls = pitfallsEl,
                    exercises = exercisesEl,
                    next = next,
                    sources = sourcesEl
                };

                var metadataData = new
                {
                    tags = tags,
                    topic = topic,
                    description = description,
                    codeExample = codeExample,
                    output = output,
                    version = version,
                    lastUpdated = lastUpdated
                };

                // Upsert by slug + module
                var existingLesson = await _context.Lessons
                    .FirstOrDefaultAsync(l => l.Slug == slug && l.ModuleId == module.Id);

                if (existingLesson == null)
                {
                    var lesson = new Lesson
                    {
                        Title = title ?? "Untitled Lesson",
                        Slug = slug ?? Guid.NewGuid().ToString(),
                        Order = order ?? 1,
                        Content = JsonSerializer.Serialize(contentData),
                        Metadata = JsonSerializer.Serialize(metadataData),
                        Difficulty = difficulty ?? "Beginner",
                        EstimatedMinutes = estimatedMinutes ?? 30,
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
                    existingLesson.Title = title ?? existingLesson.Title;
                    existingLesson.Order = order ?? existingLesson.Order;
                    existingLesson.Content = JsonSerializer.Serialize(contentData);
                    existingLesson.Metadata = JsonSerializer.Serialize(metadataData);
                    existingLesson.Difficulty = difficulty ?? existingLesson.Difficulty;
                    existingLesson.EstimatedMinutes = estimatedMinutes ?? existingLesson.EstimatedMinutes;
                    existingLesson.UpdatedAt = DateTime.UtcNow;
                    Console.WriteLine($"   ✏️ Updated lesson: {existingLesson.Title}");
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
        public List<string>? Objectives { get; set; }
        public System.Text.Json.JsonElement? Code { get; set; }
        public System.Text.Json.JsonElement? Pitfalls { get; set; }
        public System.Text.Json.JsonElement? Exercises { get; set; }
        public List<string>? Next { get; set; }
        public System.Text.Json.JsonElement? Sources { get; set; }
        public List<string>? Tags { get; set; }
        public string? Topic { get; set; }
        public string? Description { get; set; }
        public string? CodeExample { get; set; }
        public string? Output { get; set; }
        public string? Version { get; set; }
        public string? LastUpdated { get; set; }
    }
}