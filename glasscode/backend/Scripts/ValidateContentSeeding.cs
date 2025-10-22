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
    public class ValidateContentSeeding
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

            await ValidateContent(context);
        }

        public static async Task ValidateContent(GlassCodeDbContext context)
        {
            Console.WriteLine("[START] Starting content validation...");

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

            // Validate modules
            Console.WriteLine("\n[MODULE_CHECK] Validating modules...");
            var validModules = 0;
            foreach (var expectedModule in registry.Modules)
            {
                var dbModule = await context.Modules
                    .Include(m => m.Lessons)
                    .ThenInclude(l => l.LessonQuizzes)
                    .FirstOrDefaultAsync(m => m.Slug == expectedModule.Slug);

                if (dbModule == null)
                {
                    Console.WriteLine($"[MISSING] Missing module: {expectedModule.Title}");
                    continue;
                }

                // Check if we have enough lessons
                var expectedLessons = expectedModule.Thresholds?.RequiredLessons ?? 0;
                var actualLessons = dbModule.Lessons.Count;

                if (actualLessons < expectedLessons)
                {
                    Console.WriteLine($"[LESSON_SHORT] Module {expectedModule.Title} has {actualLessons}/{expectedLessons} lessons");
                }
                else
                {
                    Console.WriteLine($"[LESSON_OK] Module {expectedModule.Title} has {actualLessons} lessons (required: {expectedLessons})");
                }

                // Check if we have enough quizzes
                var expectedQuizzes = expectedModule.Thresholds?.RequiredQuestions ?? 0;
                var actualQuizzes = dbModule.Lessons.SelectMany(l => l.LessonQuizzes).Count();

                if (actualQuizzes < expectedQuizzes)
                {
                    Console.WriteLine($"[QUIZ_SHORT] Module {expectedModule.Title} has {actualQuizzes}/{expectedQuizzes} quiz questions");
                }
                else
                {
                    Console.WriteLine($"[QUIZ_OK] Module {expectedModule.Title} has {actualQuizzes} quiz questions (required: {expectedQuizzes})");
                }

                // Count as valid if it meets minimum requirements
                if (actualLessons >= expectedLessons && actualQuizzes >= expectedQuizzes)
                {
                    validModules++;
                }
            }

            Console.WriteLine($"\n[SUMMARY] Validation Summary:");
            Console.WriteLine($"   Valid modules: {validModules}/{registry.Modules.Count}");

            if (validModules == registry.Modules.Count)
            {
                Console.WriteLine("\n[SUCCESS] All modules have sufficient content!");
            }
            else
            {
                Console.WriteLine("\n[WARNING] Some modules are missing content.");
                Console.WriteLine("[INFO] Run the FixContentSeeding script to resolve these issues.");
            }
        }
    }
}