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

        private static string GenerateSlug(string source)
        {
            if (string.IsNullOrWhiteSpace(source)) return "untitled";
            return source.ToLowerInvariant()
                         .Replace(" ", "-")
                         .Replace(".", "")
                         .Replace("#", "sharp")
                         .Replace("+", "plus")
                         .Replace("&", "and")
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
                         .Replace(",", "")
                         .Replace("?", "")
                         .Replace("!", "")
                         .Replace("@", "at")
                         .Replace("%", "percent")
                         .Trim('-');
        }

        /// <summary>
        /// Performs a complete migration of all content from JSON files to the database
        /// </summary>
        public async Task<bool> PerformFullMigrationAsync(int maxRetries = 3)
        {
            for (int attempt = 1; attempt <= maxRetries; attempt++)
            {
                try
                {
                    Console.WriteLine($"🚀 Starting full automated migration process (attempt {attempt}/{maxRetries})...");

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
                    var validationResult = await ValidateMigrationAsync();
                    
                    if (!validationResult)
                    {
                        Console.WriteLine($"❌ Migration validation failed on attempt {attempt}!");
                        if (attempt < maxRetries)
                        {
                            Console.WriteLine("⏳ Waiting before retry...");
                            await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt))); // Exponential backoff
                        }
                        continue; // Retry
                    }

                    Console.WriteLine("🎉 Full migration completed successfully!");
                    return true;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ Migration failed on attempt {attempt}: {ex.Message}");
                    Console.WriteLine($"📍 Stack trace: {ex.StackTrace}");
                    
                    if (attempt < maxRetries)
                    {
                        Console.WriteLine("⏳ Waiting before retry...");
                        await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt))); // Exponential backoff
                    }
                    else
                    {
                        return false; // All retries exhausted
                    }
                }
            }
            
            return false; // All retries exhausted
        }

        /// <summary>
        /// Seeds modules from the registry.json file
        /// </summary>
        private async Task SeedModulesFromRegistryAsync()
        {
            try
            {
                Console.WriteLine("🔍 Reading registry.json file...");
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

                Console.WriteLine($"📋 Found {registryData.Modules.Count} modules in registry.json");

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
                var addedModules = 0;
                var updatedModules = 0;
                
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
                        Console.WriteLine($"➕ Added module: {module.Title} (slug: {module.Slug})");
                        addedModules++;
                    }
                    else
                    {
                        Console.WriteLine($"🔄 Updated module: {existingModule.Title} (slug: {existingModule.Slug})");
                        existingModule.Title = moduleData.Title;
                        existingModule.Description = moduleData.Description;
                        existingModule.Order = moduleOrder++;
                        existingModule.UpdatedAt = DateTime.UtcNow;
                        updatedModules++;
                    }
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ Successfully processed {registryData.Modules.Count} modules from registry.json (Added: {addedModules}, Updated: {updatedModules})");
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
                Console.WriteLine("🔍 Looking for lessons directory...");
                var lessonsPath = System.IO.Path.Combine(_contentPath, "lessons");
                
                if (!Directory.Exists(lessonsPath))
                {
                    Console.WriteLine($"⚠️ Lessons directory not found: {lessonsPath}");
                    return;
                }

                var jsonFiles = Directory.GetFiles(lessonsPath, "*.json", SearchOption.AllDirectories);
                Console.WriteLine($"📁 Found {jsonFiles.Length} lesson files to process");

                var totalLessonsProcessed = 0;
                var totalLessonsAdded = 0;
                var totalLessonsUpdated = 0;
                
                foreach (var file in jsonFiles)
                {
                    var lessonsBefore = _context.ChangeTracker.Entries<Lesson>().Count(e => e.State == EntityState.Added || e.State == EntityState.Modified);
                    await ProcessLessonFileAsync(file);
                    var lessonsAfter = _context.ChangeTracker.Entries<Lesson>().Count(e => e.State == EntityState.Added || e.State == EntityState.Modified);
                    
                    var lessonsInFile = lessonsAfter - lessonsBefore;
                    Console.WriteLine($"📊 Processed {lessonsInFile} lessons from file: {System.IO.Path.GetFileNameWithoutExtension(file)}");
                    totalLessonsProcessed += lessonsInFile;
                    
                    try
                    {
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"✅ Saved lesson changes after file: {System.IO.Path.GetFileNameWithoutExtension(file)}");
                        
                        // Count added vs updated lessons
                        var addedLessons = _context.ChangeTracker.Entries<Lesson>().Where(e => e.State == EntityState.Added).Count();
                        var updatedLessons = _context.ChangeTracker.Entries<Lesson>().Where(e => e.State == EntityState.Modified).Count();
                        totalLessonsAdded += addedLessons;
                        totalLessonsUpdated += updatedLessons;
                    }
                    catch (Exception saveEx)
                    {
                        try
                        {
                            var pendingAdds = _context.ChangeTracker.Entries<Lesson>().Count(e => e.State == EntityState.Added);
                            Console.WriteLine($"🧮 Pending added lessons (after file {System.IO.Path.GetFileNameWithoutExtension(file)}): {pendingAdds}");
                        }
                        catch { /* ignore telemetry errors */ }
                        Console.WriteLine($"❌ Error saving lessons after file {System.IO.Path.GetFileNameWithoutExtension(file)}: {saveEx.Message} | Inner: {saveEx.InnerException?.Message}");
                        throw;
                    }
                }

                Console.WriteLine($"✅ Lesson seeding completed! Total lessons processed: {totalLessonsProcessed} (Added: {totalLessonsAdded}, Updated: {totalLessonsUpdated})");
            }
            catch (Exception ex)
            {
                try
                {
                    var pendingAdds = _context.ChangeTracker.Entries<Lesson>().Count(e => e.State == EntityState.Added);
                    Console.WriteLine($"🧮 Pending added lessons: {pendingAdds}");
                }
                catch { /* ignore telemetry errors */ }
                Console.WriteLine($"❌ Error seeding lessons: {ex.Message} | Inner: {ex.InnerException?.Message}");
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
                        EF.Functions.ILike(m.Slug, fileName) ||
                        EF.Functions.ILike(m.Slug, fileNameLower));

                if (module == null)
                {
                    var moduleSlug = fileNameLower
                        .Replace("-lessons", "")
                        .Replace("-fundamentals", "")
                        .Replace("-advanced", "")
                        .Replace("-basics", "");

                    // Try exact equality on derived module slug
                    module = await _context.Modules
                        .FirstOrDefaultAsync(m => EF.Functions.ILike(m.Slug, moduleSlug));

                    if (module == null)
                    {
                        // Finally, fall back to partial matches
                        module = await _context.Modules.FirstOrDefaultAsync(m =>
                            EF.Functions.ILike(m.Slug, $"%{moduleSlug}%"));
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
                var effectiveSlug = !string.IsNullOrWhiteSpace(slug) ? slug! : GenerateSlug(title ?? fileName);
                // Enforce DB max length for slug (<=100)
                if (effectiveSlug.Length > 100)
                {
                    effectiveSlug = effectiveSlug.Substring(0, 100);
                }
                // First check tracked entities to avoid duplicate adds within same run
                var existingLesson = _context.Lessons.Local.FirstOrDefault(l => l.Slug == effectiveSlug && l.ModuleId == module.Id)
                                      ?? await _context.Lessons
                                          .FirstOrDefaultAsync(l => l.Slug == effectiveSlug && l.ModuleId == module.Id);

                if (existingLesson == null)
                {
                    // Enforce DB max length for title (<=200)
                    var safeTitle = (title ?? "Untitled Lesson");
                    if (safeTitle.Length > 200)
                    {
                        safeTitle = safeTitle.Substring(0, 200);
                    }

                    var lesson = new Lesson
                    {
                        Title = safeTitle,
                        Slug = effectiveSlug,
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
                    // Enforce DB max length for title (<=200)
                    var safeTitle = (title ?? existingLesson.Title);
                    if (safeTitle.Length > 200)
                    {
                        safeTitle = safeTitle.Substring(0, 200);
                    }

                    existingLesson.Title = safeTitle;
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
                Console.WriteLine("🔍 Looking for quizzes directory...");
                var quizzesPath = System.IO.Path.Combine(_contentPath, "quizzes");
                
                if (!Directory.Exists(quizzesPath))
                {
                    Console.WriteLine($"⚠️ Quizzes directory not found: {quizzesPath}");
                    return;
                }

                var jsonFiles = Directory.GetFiles(quizzesPath, "*.json");
                Console.WriteLine($"📁 Found {jsonFiles.Length} quiz files to process");

                var totalQuestionsProcessed = 0;
                var totalQuestionsAdded = 0;
                var totalQuestionsUpdated = 0;
                
                foreach (var file in jsonFiles)
                {
                    var questionsBefore = _context.ChangeTracker.Entries<LessonQuiz>().Count(e => e.State == EntityState.Added || e.State == EntityState.Modified);
                    await ProcessQuizFileAsync(file);
                    var questionsAfter = _context.ChangeTracker.Entries<LessonQuiz>().Count(e => e.State == EntityState.Added || e.State == EntityState.Modified);
                    
                    var questionsInFile = questionsAfter - questionsBefore;
                    Console.WriteLine($"📊 Processed {questionsInFile} questions from file: {System.IO.Path.GetFileNameWithoutExtension(file)}");
                    totalQuestionsProcessed += questionsInFile;
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ Quiz seeding completed! Total questions processed: {totalQuestionsProcessed}");
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
        private async Task ProcessQuizFileAsync(string filePath, int? targetLessonId = null, bool reassignDuplicates = false)
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

                // Resolve target lesson: either explicit target or by filename
                Lesson? lesson = null;
                if (targetLessonId.HasValue)
                {
                    lesson = await _context.Lessons.FindAsync(targetLessonId.Value);
                    if (lesson == null)
                    {
                        Console.WriteLine($"   ⚠️ Target lesson {targetLessonId.Value} not found. Skipping quiz migration.");
                        return;
                    }
                }
                else
                {
                    // Try to find a matching lesson by filename
                    lesson = await FindMatchingLessonAsync(fileName);
                    if (lesson == null)
                    {
                        Console.WriteLine($"   ⚠️ No matching lesson found for {fileName}. Skipping quiz migration.");
                        return;
                    }
                }

                foreach (var question in quizData.Questions)
                {
                    // Check if quiz already exists for this lesson
                    var existingQuiz = await _context.LessonQuizzes
                        .FirstOrDefaultAsync(q => q.Question == question.Question && q.LessonId == lesson.Id);

                    if (existingQuiz == null)
                    {
                        // If requested, reassign a globally existing duplicate to this target lesson
                        // Only reassign within the same module; otherwise allow cross-module duplicates
                        if (reassignDuplicates)
                        {
                            var globalQuiz = await _context.LessonQuizzes
                                .Include(q => q.Lesson)
                                .FirstOrDefaultAsync(q => q.Question == question.Question);
                            if (globalQuiz != null && globalQuiz.LessonId != lesson.Id)
                            {
                                var sourceLesson = globalQuiz.Lesson ?? await _context.Lessons.FindAsync(globalQuiz.LessonId);
                                if (sourceLesson != null && sourceLesson.ModuleId == lesson.ModuleId)
                                {
                                    globalQuiz.LessonId = lesson.Id;
                                    globalQuiz.IsPublished = true;
                                    globalQuiz.UpdatedAt = DateTime.UtcNow;
                                    _context.LessonQuizzes.Update(globalQuiz);
                                    Console.WriteLine($"   🔁 Reassigned quiz within module {sourceLesson.ModuleId} to lesson {lesson.Id}: {question.Question.Substring(0, Math.Min(50, question.Question.Length))}...");
                                    continue; // Skip adding a new record since we've reassigned
                                }
                                // Different module: do not reassign; proceed to add a new record below
                            }
                        }

                        var lessonQuiz = new LessonQuiz
                        {
                            LessonId = lesson.Id,
                            Question = question.Question,
                            Topic = question.Topic,
                            Difficulty = question.Difficulty ?? "Beginner",
                            Choices = question.Choices != null ? JsonSerializer.Serialize(question.Choices) : null,
                            FixedChoiceOrder = question.FixedChoiceOrder ?? false,
                            ChoiceLabels = question.ChoiceLabels != null ? JsonSerializer.Serialize(question.ChoiceLabels) : null,
                            AcceptedAnswers = question.AcceptedAnswers != null ? JsonSerializer.Serialize(question.AcceptedAnswers) : null,
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
            var fileNameLower = fileName.ToLowerInvariant();
            // Prefer exact module slug match before any normalization
            var exactModule = await _context.Modules.FirstOrDefaultAsync(m => EF.Functions.ILike(m.Slug, fileNameLower));
            if (exactModule != null)
            {
                var exactModuleLesson = await _context.Lessons
                    .Where(l => l.ModuleId == exactModule.Id)
                    .OrderBy(l => l.Order)
                    .FirstOrDefaultAsync();
                if (exactModuleLesson != null)
                {
                    return exactModuleLesson;
                }
            }

            // Try exact lesson slug match (case-insensitive)
            var lesson = await _context.Lessons
                .FirstOrDefaultAsync(l => EF.Functions.ILike(l.Slug, fileNameLower));
            if (lesson != null)
            {
                return lesson;
            }

            // Normalize slug to improve matching for files like web-development-basics.json
            var normalizedSlug = fileNameLower
                .Replace("-quizzes", "")
                .Replace("-questions", "")
                .Replace("-lessons", "")
                .Replace("-fundamentals", "")
                .Replace("-advanced", "")
                .Replace("-basics", "");

            // Try matching module by normalized slug with hyphen-insensitive equality
            var module = await _context.Modules
                .FirstOrDefaultAsync(m =>
                    EF.Functions.ILike(m.Slug, normalizedSlug) ||
                    EF.Functions.ILike(m.Slug.Replace("-", ""), normalizedSlug.Replace("-", "")));

            // Fallback to partial matches (hyphen-insensitive)
            if (module == null)
            {
                module = await _context.Modules.FirstOrDefaultAsync(m =>
                    EF.Functions.ILike(m.Slug, $"%{normalizedSlug}%") ||
                    EF.Functions.ILike(m.Slug.Replace("-", ""), $"%{normalizedSlug.Replace("-", "")}%"));
            }

            if (module != null)
            {
                var moduleLesson = await _context.Lessons
                    .Where(l => l.ModuleId == module.Id)
                    .OrderBy(l => l.Order)
                    .FirstOrDefaultAsync();
                if (moduleLesson != null)
                {
                    return moduleLesson;
                }
            }

            // No match found
            return null;
        }

        /// <summary>
        /// Validates the migration results
        /// </summary>
        private async Task<bool> ValidateMigrationAsync()
        {
            var moduleCount = await _context.Modules.CountAsync();
            var lessonCount = await _context.Lessons.CountAsync();
            var quizCount = await _context.LessonQuizzes.CountAsync();

            Console.WriteLine($"📊 Migration Summary:");
            Console.WriteLine($"   Modules: {moduleCount}");
            Console.WriteLine($"   Lessons: {lessonCount}");
            Console.WriteLine($"   Quiz Questions: {quizCount}");

            // Enhanced validation: ensure each module has at least one lesson
            var modules = await _context.Modules
                .Include(m => m.Lessons)
                .ToListAsync();

            var modulesWithLessons = modules.Count(m => m.Lessons.Any());
            var modulesWithoutLessons = modules.Count(m => !m.Lessons.Any());
            
            Console.WriteLine($"   Modules with lessons: {modulesWithLessons}");
            Console.WriteLine($"   Modules without lessons: {modulesWithoutLessons}");

            // Check if all modules have lessons
            if (modulesWithoutLessons > 0)
            {
                Console.WriteLine($"⚠️ Found {modulesWithoutLessons} modules without lessons. Listing modules without lessons:");
                foreach (var module in modules.Where(m => !m.Lessons.Any()))
                {
                    Console.WriteLine($"      - {module.Title} ({module.Slug})");
                }
            }

            // Check if all modules have published quizzes
            var modulesWithQuizzes = 0;
            foreach (var module in modules)
            {
                var hasQuizzes = module.Lessons.SelectMany(l => l.LessonQuizzes).Any(q => q.IsPublished);
                if (hasQuizzes)
                {
                    modulesWithQuizzes++;
                }
                else
                {
                    Console.WriteLine($"⚠️ Module '{module.Title}' has no published quizzes");
                }
            }
            
            Console.WriteLine($"   Modules with published quizzes: {modulesWithQuizzes}");

            if (moduleCount > 0 && lessonCount > 0 && modulesWithoutLessons == 0)
            {
                Console.WriteLine($"✅ Migration validation passed");
                return true;
            }
            else
            {
                Console.WriteLine($"❌ Migration validation failed - some entities are missing or incomplete");
                return false;
            }
        }

        public async Task<bool> SeedQuizzesForModuleSlugAsync(string moduleSlug)
        {
            try
            {
                var module = await _context.Modules
                    .Include(m => m.Lessons)
                    .ThenInclude(l => l.LessonQuizzes)
                    .FirstOrDefaultAsync(m => m.Slug == moduleSlug);

                if (module == null)
                {
                    Console.WriteLine($"⚠️ Module not found for slug: {moduleSlug}");
                    return false;
                }

                var hasPublishedQuizzes = module.Lessons.SelectMany(l => l.LessonQuizzes).Any(q => q.IsPublished);
                if (hasPublishedQuizzes)
                {
                    Console.WriteLine($"ℹ️ Module '{moduleSlug}' already has published quizzes. Skipping backfill.");
                    return true;
                }

                var quizzesPath = System.IO.Path.Combine(_contentPath, "quizzes");
                var filePath = System.IO.Path.Combine(quizzesPath, $"{moduleSlug}.json");
                if (!System.IO.File.Exists(filePath))
                {
                    Console.WriteLine($"⚠️ Quiz JSON not found for module '{moduleSlug}' at: {filePath}");
                    return false;
                }

                Console.WriteLine($"🔧 Backfilling quizzes for module '{moduleSlug}' from file: {System.IO.Path.GetFileName(filePath)}");
                var targetLesson = module.Lessons
                    .OrderBy(l => l.Order)
                    .FirstOrDefault();
                if (targetLesson == null)
                {
                    Console.WriteLine($"⚠️ No lessons found in module '{moduleSlug}'. Cannot backfill quizzes.");
                    return false;
                }
                await ProcessQuizFileAsync(filePath, targetLesson.Id, reassignDuplicates: true);
                await _context.SaveChangesAsync();

                var postHasPublishedQuizzes = module.Lessons.SelectMany(l => l.LessonQuizzes).Any(q => q.IsPublished);
                Console.WriteLine(postHasPublishedQuizzes
                    ? $"✅ Backfill completed for '{moduleSlug}'"
                    : $"⚠️ Backfill finished but no published quizzes detected for '{moduleSlug}'");

                return postHasPublishedQuizzes;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error backfilling quizzes for '{moduleSlug}': {ex.Message}");
                return false;
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

// Removed duplicate external SeedQuizzesForModuleSlugAsync method (moved inside class).