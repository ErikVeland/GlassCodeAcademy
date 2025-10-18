using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using backend.Data;

class Program
{
    static async Task Main()
    {
        try
        {
            Console.WriteLine("Testing database connection...");
            
            // Create DbContext options
            var optionsBuilder = new DbContextOptionsBuilder<GlassCodeDbContext>();
            optionsBuilder.UseNpgsql("Host=localhost;Database=glasscode_dev;Username=postgres;Password=postgres;Port=5432");
            
            using var context = new GlassCodeDbContext(optionsBuilder.Options);
            
            // Test connection
            var canConnect = await context.Database.CanConnectAsync();
            Console.WriteLine($"Database connection: {(canConnect ? "SUCCESS" : "FAILED")}");
            
            if (canConnect)
            {
                // Check counts
                var moduleCount = await context.Modules.CountAsync();
                var lessonCount = await context.Lessons.CountAsync();
                var quizCount = await context.LessonQuizzes.CountAsync();
                
                Console.WriteLine($"Modules: {moduleCount}");
                Console.WriteLine($"Lessons: {lessonCount}");
                Console.WriteLine($"Quizzes: {quizCount}");
                
                // Check for programming fundamentals
                var programmingModules = await context.Modules
                    .Where(m => m.Slug.Contains("programming"))
                    .ToListAsync();
                    
                Console.WriteLine($"Programming modules found: {programmingModules.Count}");
                foreach (var module in programmingModules)
                {
                    Console.WriteLine($"  - {module.Title} (ID: {module.Id}, Slug: {module.Slug})");
                    
                    var moduleLessons = await context.Lessons
                        .Where(l => l.ModuleId == module.Id)
                        .ToListAsync();
                        
                    Console.WriteLine($"    Lessons: {moduleLessons.Count}");
                    
                    foreach (var lesson in moduleLessons)
                    {
                        var lessonQuizzes = await context.LessonQuizzes
                            .Where(q => q.LessonId == lesson.Id)
                            .ToListAsync();
                        Console.WriteLine($"      - {lesson.Title}: {lessonQuizzes.Count} quizzes");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
        }
    }
}