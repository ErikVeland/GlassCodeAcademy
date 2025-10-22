using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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
            optionsBuilder.UseNpgsql("Host=localhost;Database=glasscode_test;Username=postgres;Password=postgres;Port=5432");
            
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
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
        }
    }
}