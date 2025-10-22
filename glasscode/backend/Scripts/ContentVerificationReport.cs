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
    public class ContentVerificationReport
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

            await GenerateContentReport(context);
        }

        public static async Task GenerateContentReport(GlassCodeDbContext context)
        {
            Console.WriteLine("[START] Generating content verification report...");

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

            Console.WriteLine($"[REGISTRY] Total modules in registry: {registry.Modules.Count}");
            Console.WriteLine($"Expected modules: 18");
            Console.WriteLine(registry.Modules.Count == 18 ? "[SUCCESS] Correct number of modules" : "[ERROR] Incorrect number of modules");

            // Database content summary
            var dbModuleCount = await context.Modules.CountAsync();
            var dbLessonCount = await context.Lessons.CountAsync();
            var dbQuizCount = await context.LessonQuizzes.CountAsync();

            Console.WriteLine($"\n[DATABASE] Database Content Summary:");
            Console.WriteLine($"   Modules: {dbModuleCount}");
            Console.WriteLine($"   Lessons: {dbLessonCount}");
            Console.WriteLine($"   Quiz Questions: {dbQuizCount}");

            // Detailed module report
            Console.WriteLine($"\n[MODULE_REPORT] Detailed Module Report:");
            Console.WriteLine($"{"Module Name",-30} {"Slug",-25} {"Lessons",-8} {"Quizzes",-8} {"Status",-10}");
            Console.WriteLine(new string('-', 90));

            var totalExpectedLessons = 0;
            var totalExpectedQuizzes = 0;
            var totalActualLessons = 0;
            var totalActualQuizzes = 0;
            var completeModules = 0;

            foreach (var expectedModule in registry.Modules.OrderBy(m => m.Tier).ThenBy(m => m.Track))
            {
                var dbModule = await context.Modules
                    .Include(m => m.Lessons)
                    .ThenInclude(l => l.LessonQuizzes)
                    .FirstOrDefaultAsync(m => m.Slug == expectedModule.Slug);

                var expectedLessons = expectedModule.Thresholds?.RequiredLessons ?? 0;
                var expectedQuizzes = expectedModule.Thresholds?.RequiredQuestions ?? 0;
                var actualLessons = dbModule?.Lessons.Count ?? 0;
                var actualQuizzes = dbModule?.Lessons.SelectMany(l => l.LessonQuizzes).Count() ?? 0;

                totalExpectedLessons += expectedLessons;
                totalExpectedQuizzes += expectedQuizzes;
                totalActualLessons += actualLessons;
                totalActualQuizzes += actualQuizzes;

                var status = (actualLessons >= expectedLessons && actualQuizzes >= expectedQuizzes) ? "[SUCCESS]" : "[ERROR]";
                if (actualLessons >= expectedLessons && actualQuizzes >= expectedQuizzes) completeModules++;

                Console.WriteLine($"{expectedModule.Title,-30} {expectedModule.Slug,-25} {actualLessons,8} {actualQuizzes,8} {status,10}");
            }

            Console.WriteLine(new string('-', 90));
            Console.WriteLine($"{"TOTALS",-30} {"",-25} {totalActualLessons,8} {totalActualQuizzes,8} {((completeModules == 18) ? "[SUCCESS]" : "[ERROR]"),10}");
            Console.WriteLine($"{"EXPECTED",-30} {"",-25} {totalExpectedLessons,8} {totalExpectedQuizzes,8}");

            // Summary
            Console.WriteLine($"\n[REPORT] Report Summary:");
            Console.WriteLine($"   Modules with complete content: {completeModules}/18");
            Console.WriteLine($"   Total lessons: {totalActualLessons}/{totalExpectedLessons}");
            Console.WriteLine($"   Total quiz questions: {totalActualQuizzes}/{totalExpectedQuizzes}");

            var lessonCompletion = totalExpectedLessons > 0 ? (double)totalActualLessons / totalExpectedLessons * 100 : 0;
            var quizCompletion = totalExpectedQuizzes > 0 ? (double)totalActualQuizzes / totalExpectedQuizzes * 100 : 0;

            Console.WriteLine($"   Lesson completion: {lessonCompletion:F1}%");
            Console.WriteLine($"   Quiz completion: {quizCompletion:F1}%");

            if (completeModules == 18 && totalActualLessons >= totalExpectedLessons && totalActualQuizzes >= totalExpectedQuizzes)
            {
                Console.WriteLine("\n[SUCCESS] All content is properly seeded in the database!");
                Console.WriteLine("[SUCCESS] All 18 modules have the required number of lessons and quiz questions.");
            }
            else
            {
                Console.WriteLine("\n[WARNING] Some content issues were detected:");
                if (completeModules < 18)
                    Console.WriteLine($"   - Only {completeModules}/18 modules have complete content");
                if (totalActualLessons < totalExpectedLessons)
                    Console.WriteLine($"   - Missing {totalExpectedLessons - totalActualLessons} lessons");
                if (totalActualQuizzes < totalExpectedQuizzes)
                    Console.WriteLine($"   - Missing {totalExpectedQuizzes - totalActualQuizzes} quiz questions");

                Console.WriteLine("\n[INFO] Run the FixContentSeeding script to resolve these issues.");
            }
        }
    }

    // Data models are defined in Models/ContentModels.cs to avoid duplication
}