using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services
{
    public class LessonSeedingService
    {
        private readonly GlassCodeDbContext _context;
        private readonly DataService _dataService;

        public LessonSeedingService(GlassCodeDbContext context)
        {
            _context = context;
            _dataService = DataService.Instance;
        }

        public async Task SeedLessonsToDatabase()
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                Console.WriteLine("🌱 Starting lesson seeding to database...");

                // Check if lessons already exist in database
                var existingLessonsCount = await _context.Lessons.CountAsync();
                if (existingLessonsCount > 0)
                {
                    Console.WriteLine($"✅ Database already contains {existingLessonsCount} lessons. Skipping seeding.");
                    return;
                }

                // Verify that we have a valid module to assign lessons to
                var firstModule = await _context.Modules.FirstOrDefaultAsync();
                if (firstModule == null)
                {
                    Console.WriteLine("❌ No modules found in database. Cannot seed lessons without modules.");
                    return;
                }

                Console.WriteLine($"📋 Using temporary ModuleId: {firstModule.Id} ({firstModule.Title})");

                var lessonsToSeed = new List<Lesson>();

                // Collect all lessons from DataService
                var allLessonCollections = new[]
                {
                    (_dataService.DotNetLessons, "DotNet"),
                    (_dataService.ReactLessons, "React"),
                    (_dataService.TailwindLessons, "Tailwind"),
                    (_dataService.NodeLessons, "Node"),
                    (_dataService.SassLessons, "Sass"),
                    (_dataService.VueLessons, "Vue"),
                    (_dataService.TypescriptLessons, "TypeScript"),
                    (_dataService.DatabaseLessons, "Database"),
                    (_dataService.TestingLessons, "Testing"),
                    (_dataService.ProgrammingLessons, "Programming"),
                    (_dataService.WebLessons, "Web"),
                    (_dataService.NextJsLessons, "NextJs"),
                    (_dataService.PerformanceLessons, "Performance"),
                    (_dataService.SecurityLessons, "Security"),
                    (_dataService.VersionLessons, "Version"),
                    (_dataService.LaravelLessons, "Laravel")
                };

                foreach (var (lessons, category) in allLessonCollections)
                {
                    if (lessons?.Any() == true)
                    {
                        Console.WriteLine($"📚 Processing {lessons.Count()} {category} lessons...");
                        
                        foreach (var baseLesson in lessons)
                        {
                            // Create content JSON from BaseLesson
                            var contentData = new
                            {
                                intro = baseLesson.Intro,
                                objectives = baseLesson.Objectives,
                                code = baseLesson.Code,
                                pitfalls = baseLesson.Pitfalls,
                                exercises = baseLesson.Exercises,
                                next = baseLesson.Next,
                                sources = baseLesson.Sources
                            };

                            // Create metadata JSON
                            var metadataData = new
                            {
                                tags = baseLesson.Tags,
                                topic = baseLesson.Topic ?? category,
                                description = baseLesson.Description,
                                codeExample = baseLesson.CodeExample,
                                output = baseLesson.Output,
                                version = baseLesson.Version,
                                lastUpdated = baseLesson.LastUpdated
                            };

                            var lesson = new Lesson
                            {
                                Title = baseLesson.Title ?? $"Untitled {category} Lesson",
                                Slug = GenerateSlug(baseLesson.Title ?? $"untitled-{category}-lesson"),
                                Order = baseLesson.Order,
                                Content = System.Text.Json.JsonSerializer.Serialize(contentData),
                                Metadata = System.Text.Json.JsonSerializer.Serialize(metadataData),
                                Difficulty = baseLesson.Difficulty ?? "Beginner",
                                EstimatedMinutes = baseLesson.EstimatedMinutes,
                                ModuleId = firstModule.Id, // Use the first available module
                                IsPublished = true,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            };

                            lessonsToSeed.Add(lesson);
                        }
                    }
                }

                if (lessonsToSeed.Any())
                {
                    Console.WriteLine($"💾 Saving {lessonsToSeed.Count} lessons to database...");
                    
                    // Process in batches to avoid memory issues
                    var batchSize = 50;
                    var totalBatches = (int)Math.Ceiling((double)lessonsToSeed.Count / batchSize);
                    
                    for (int batch = 0; batch < totalBatches; batch++)
                    {
                        var batchLessons = lessonsToSeed.Skip(batch * batchSize).Take(batchSize);
                        await _context.Lessons.AddRangeAsync(batchLessons);
                        Console.WriteLine($"📦 Processing batch {batch + 1}/{totalBatches} ({batchLessons.Count()} lessons)");
                        
                        // Save each batch immediately
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"✅ Saved batch {batch + 1}/{totalBatches}");
                    }
                    await transaction.CommitAsync();
                    Console.WriteLine($"✅ Successfully seeded {lessonsToSeed.Count} lessons to database!");
                }
                else
                {
                    Console.WriteLine("⚠️ No lessons found to seed.");
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"❌ Error seeding lessons: {ex.Message}");
                Console.WriteLine($"📍 Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        private string GenerateSlug(string title)
        {
            return title.ToLowerInvariant()
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
                       .Replace("%", "percent");
        }
    }
}