using backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace backend.Services
{
    public class LessonMappingService
    {
        private readonly GlassCodeDbContext _context;

        public LessonMappingService(GlassCodeDbContext context)
        {
            _context = context;
        }

        public async Task MapLessonsToModulesAsync()
        {
            // Get all lessons to debug
            var allLessons = await _context.Lessons.ToListAsync();
            Console.WriteLine($"🔍 Total lessons in database: {allLessons.Count}");
            
            // Get the first module to use as temporary assignment
            var firstModule = await _context.Modules.FirstOrDefaultAsync();
            if (firstModule == null)
            {
                Console.WriteLine("❌ No modules found in database. Cannot map lessons.");
                return;
            }

            // Get all unmapped lessons (those with the temporary ModuleId assignment)
            var unmappedLessons = await _context.Lessons
                .Where(l => l.ModuleId == firstModule.Id)
                .ToListAsync();

            Console.WriteLine($"🔍 Unmapped lessons found: {unmappedLessons.Count}");
            
            if (!unmappedLessons.Any())
            {
                Console.WriteLine("✅ All lessons are already mapped to modules.");
                return;
            }

            // Build module lookup by slug for fast mapping
            var modules = await _context.Modules.ToListAsync();
            var slugToModuleId = modules.ToDictionary(m => m.Slug.ToLowerInvariant(), m => m.Id);

            // Helper: map by keywords found in tags or title
            int ResolveModuleIdForLesson(backend.Models.Lesson lesson)
            {
                string title = lesson.Title?.ToLowerInvariant() ?? string.Empty;
                string slug = lesson.Slug?.ToLowerInvariant() ?? string.Empty;
                var tags = new List<string>();

                if (!string.IsNullOrEmpty(lesson.Metadata))
                {
                    try
                    {
                        using var doc = JsonDocument.Parse(lesson.Metadata);
                        if (doc.RootElement.TryGetProperty("tags", out var tagsEl) && tagsEl.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var t in tagsEl.EnumerateArray())
                            {
                                if (t.ValueKind == JsonValueKind.String && t.GetString() != null)
                                {
                                    tags.Add(t.GetString()!.ToLowerInvariant());
                                }
                            }
                        }
                        if (doc.RootElement.TryGetProperty("topic", out var topicEl) && topicEl.ValueKind == JsonValueKind.String)
                        {
                            tags.Add(topicEl.GetString()!.ToLowerInvariant());
                        }
                    }
                    catch
                    {
                        // ignore malformed metadata
                    }
                }

                // Keyword sets for mapping
                bool HasAny(params string[] keys) => keys.Any(k => title.Contains(k) || slug.Contains(k) || tags.Any(t => t.Contains(k)));

                // Try specific modules in priority order
                if (HasAny("typescript", "ts")) return slugToModuleId.GetValueOrDefault("typescript-fundamentals", firstModule.Id);
                if (HasAny("react")) return slugToModuleId.GetValueOrDefault("react-fundamentals", firstModule.Id);
                if (HasAny("node", "express")) return slugToModuleId.GetValueOrDefault("node-fundamentals", firstModule.Id);
                if (HasAny("laravel", "php")) return slugToModuleId.GetValueOrDefault("laravel-fundamentals", firstModule.Id);
                if (HasAny("graphql")) return slugToModuleId.GetValueOrDefault("graphql-advanced", firstModule.Id);
                if (HasAny("tailwind")) return slugToModuleId.GetValueOrDefault("tailwind-advanced", firstModule.Id);
                if (HasAny("sass", "scss")) return slugToModuleId.GetValueOrDefault("sass-advanced", firstModule.Id);
                if (HasAny("vue")) return slugToModuleId.GetValueOrDefault("vue-advanced", firstModule.Id);
                if (HasAny("nextjs", "next.js")) return slugToModuleId.GetValueOrDefault("nextjs-advanced", firstModule.Id);
                if (HasAny("sql", "database", "nosql")) return slugToModuleId.GetValueOrDefault("database-systems", firstModule.Id);
                if (HasAny("testing", "unit test", "tdd")) return slugToModuleId.GetValueOrDefault("testing-fundamentals", firstModule.Id);
                if (HasAny("security", "auth", "jwt", "oauth")) return slugToModuleId.GetValueOrDefault("security-fundamentals", firstModule.Id);
                if (HasAny("performance", "optimiz", "profil")) return slugToModuleId.GetValueOrDefault("performance-optimization", firstModule.Id);
                if (HasAny("git", "version control")) return slugToModuleId.GetValueOrDefault("version-control", firstModule.Id);
                if (HasAny("web", "html", "css", "dom")) return slugToModuleId.GetValueOrDefault("web-fundamentals", firstModule.Id);
                if (HasAny(".net", "c#", "asp.net", "entity framework")) return slugToModuleId.GetValueOrDefault("dotnet-fundamentals", firstModule.Id);
                if (HasAny("programming", "fundamentals", "basics")) return slugToModuleId.GetValueOrDefault("programming-fundamentals", firstModule.Id);

                // Default to first module if nothing matches
                return firstModule.Id;
            }

            int mappedCount = 0;

            foreach (var lesson in unmappedLessons)
            {
                var targetModuleId = ResolveModuleIdForLesson(lesson);
                if (targetModuleId != lesson.ModuleId)
                {
                    lesson.ModuleId = targetModuleId;
                    lesson.UpdatedAt = DateTime.UtcNow;
                    mappedCount++;
                }
            }

            await _context.SaveChangesAsync();
            Console.WriteLine($"✅ Mapped {mappedCount} lessons to modules.");
        }
    }
}