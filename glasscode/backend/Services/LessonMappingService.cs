using backend.Data;
using Microsoft.EntityFrameworkCore;

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

            // Get the .NET Core Fundamentals module
            var dotnetModule = await _context.Modules
                .FirstOrDefaultAsync(m => m.Slug == "dotnet-fundamentals");

            // Get the Programming Fundamentals module
            var programmingModule = await _context.Modules
                .FirstOrDefaultAsync(m => m.Slug == "programming-fundamentals");

            // Get the Testing module
            var testingModule = await _context.Modules
                .FirstOrDefaultAsync(m => m.Slug == "testing-fundamentals");

            if (dotnetModule == null || programmingModule == null || testingModule == null)
            {
                Console.WriteLine("❌ Required modules not found for lesson mapping.");
                return;
            }

            int mappedCount = 0;

            foreach (var lesson in unmappedLessons)
            {
                // Map lessons based on their titles
                if (lesson.Title.Contains("Testing") || lesson.Title.Contains("Test"))
                {
                    lesson.ModuleId = testingModule.Id;
                }
                else if (lesson.Title.Contains("Introduction") && lesson.Title.Contains(".NET"))
                {
                    // Basic intro lessons go to Programming Fundamentals
                    lesson.ModuleId = programmingModule.Id;
                }
                else
                {
                    // Most .NET specific lessons go to .NET Core Fundamentals
                    lesson.ModuleId = dotnetModule.Id;
                }

                lesson.UpdatedAt = DateTime.UtcNow;
                mappedCount++;
            }

            await _context.SaveChangesAsync();
            Console.WriteLine($"✅ Mapped {mappedCount} lessons to modules.");
        }
    }
}