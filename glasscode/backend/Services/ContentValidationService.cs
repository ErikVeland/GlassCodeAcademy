using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace backend.Services
{
    public class ContentValidationService
    {
        private readonly GlassCodeDbContext _context;
        private readonly DataService _dataService;

        public ContentValidationService(GlassCodeDbContext context, DataService dataService)
        {
            _context = context;
            _dataService = dataService;
        }

        public async Task<ContentValidationResult> ValidateContentParityAsync()
        {
            var result = new ContentValidationResult();

            try
            {
                // Validate modules
                var dbModules = await _context.Modules.ToListAsync();
                var registryModules = GetModulesFromRegistry();
                
                result.ModulesValidation = new ValidationSummary
                {
                    DatabaseCount = dbModules.Count,
                    JsonCount = registryModules.Count,
                    IsConsistent = dbModules.Count == registryModules.Count
                };

                // Validate lessons
                var dbLessons = await _context.Lessons.ToListAsync();
                var jsonLessonsCount = GetTotalJsonLessonsCount();
                
                result.LessonsValidation = new ValidationSummary
                {
                    DatabaseCount = dbLessons.Count,
                    JsonCount = jsonLessonsCount,
                    IsConsistent = dbLessons.Count == jsonLessonsCount
                };

                // Validate quizzes
                var dbQuizzes = await _context.LessonQuizzes.ToListAsync();
                var jsonQuizzesCount = GetTotalJsonQuizzesCount();
                
                result.QuizzesValidation = new ValidationSummary
                {
                    DatabaseCount = dbQuizzes.Count,
                    JsonCount = jsonQuizzesCount,
                    IsConsistent = dbQuizzes.Count == jsonQuizzesCount
                };

                result.IsOverallConsistent = result.ModulesValidation.IsConsistent && 
                                           result.LessonsValidation.IsConsistent && 
                                           result.QuizzesValidation.IsConsistent;
            }
            catch (Exception ex)
            {
                result.Error = ex.Message;
            }

            return result;
        }

        // New: Per-module parity
        public async Task<List<ModuleParityResult>> GetPerModuleParityAsync()
        {
            var modules = await _context.Modules
                .Include(m => m.Lessons)
                    .ThenInclude(l => l.LessonQuizzes)
                .ToListAsync();

            var results = new List<ModuleParityResult>();

            foreach (var module in modules)
            {
                var lessonsDb = module.Lessons.Count;
                var quizzesDb = module.Lessons.SelectMany(l => l.LessonQuizzes).Count();

                var (lessonsJson, quizzesJson) = GetJsonCountsForModuleSlug(module.Slug);

                results.Add(new ModuleParityResult
                {
                    ModuleId = module.Id,
                    Slug = module.Slug,
                    LessonsDb = lessonsDb,
                    LessonsJson = lessonsJson,
                    QuizzesDb = quizzesDb,
                    QuizzesJson = quizzesJson,
                    LessonsDelta = lessonsDb - lessonsJson,
                    QuizzesDelta = quizzesDb - quizzesJson
                });
            }

            return results;
        }

        private (int lessonsCount, int quizzesCount) GetJsonCountsForModuleSlug(string slug)
        {
            var lessonsPath = System.IO.Path.Combine(DataService.ContentPath, "lessons", $"{slug}.json");
            var quizzesPath = System.IO.Path.Combine(DataService.ContentPath, "quizzes", $"{slug}.json");
            var lessonsCount = CountArrayItems(lessonsPath, "lessons");
            var quizzesCount = CountArrayItems(quizzesPath, "questions");
            return (lessonsCount, quizzesCount);
        }

        private int CountArrayItems(string filePath, string arrayPropName)
        {
            if (!System.IO.File.Exists(filePath))
            {
                return 0;
            }
            try
            {
                var json = System.IO.File.ReadAllText(filePath);
                using var doc = JsonDocument.Parse(json);

                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    return doc.RootElement.GetArrayLength();
                }
                if (doc.RootElement.ValueKind == JsonValueKind.Object &&
                    doc.RootElement.TryGetProperty(arrayPropName, out var arr) &&
                    arr.ValueKind == JsonValueKind.Array)
                {
                    return arr.GetArrayLength();
                }
            }
            catch
            {
                // Skip malformed files
            }
            return 0;
        }

        private List<object> GetModulesFromRegistry()
        {
            var registryPath = System.IO.Path.Combine(DataService.ContentPath, "registry.json");
            if (!System.IO.File.Exists(registryPath))
            {
                return new List<object>();
            }

            var jsonContent = System.IO.File.ReadAllText(registryPath);
            var registryData = JsonSerializer.Deserialize<ModuleRegistryData>(jsonContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return registryData?.Modules?.Cast<object>().ToList() ?? new List<object>();
        }

        private int GetTotalJsonLessonsCount()
        {
            var lessonsPath = System.IO.Path.Combine(DataService.ContentPath, "lessons");
            if (!System.IO.Directory.Exists(lessonsPath))
            {
                return 0;
            }

            var jsonFiles = System.IO.Directory.GetFiles(lessonsPath, "*.json", System.IO.SearchOption.AllDirectories);
            var total = 0;

            foreach (var file in jsonFiles)
            {
                try
                {
                    var json = System.IO.File.ReadAllText(file);
                    using var doc = JsonDocument.Parse(json);

                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        total += doc.RootElement.GetArrayLength();
                    }
                    else if (doc.RootElement.ValueKind == JsonValueKind.Object &&
                             doc.RootElement.TryGetProperty("lessons", out var lessonsElement) &&
                             lessonsElement.ValueKind == JsonValueKind.Array)
                    {
                        total += lessonsElement.GetArrayLength();
                    }
                }
                catch
                {
                    // Skip malformed files
                }
            }

            return total;
        }

        private int GetTotalJsonQuizzesCount()
        {
            var quizzesPath = System.IO.Path.Combine(DataService.ContentPath, "quizzes");
            if (!System.IO.Directory.Exists(quizzesPath))
            {
                return 0;
            }

            var jsonFiles = System.IO.Directory.GetFiles(quizzesPath, "*.json");
            var total = 0;

            foreach (var file in jsonFiles)
            {
                try
                {
                    var json = System.IO.File.ReadAllText(file);
                    using var doc = JsonDocument.Parse(json);

                    if (doc.RootElement.ValueKind == JsonValueKind.Object &&
                        doc.RootElement.TryGetProperty("questions", out var questionsElement) &&
                        questionsElement.ValueKind == JsonValueKind.Array)
                    {
                        total += questionsElement.GetArrayLength();
                    }
                    else if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        total += doc.RootElement.GetArrayLength();
                    }
                }
                catch
                {
                    // Skip malformed files
                }
            }

            return total;
        }

        // Add the missing GenerateContentHash method
        public string GenerateContentHash(string content)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(content);
            var hashBytes = sha256.ComputeHash(bytes);
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }
    }

    public class ContentValidationResult
    {
        public bool IsOverallConsistent { get; set; }
        public ValidationSummary ModulesValidation { get; set; } = new();
        public ValidationSummary LessonsValidation { get; set; } = new();
        public ValidationSummary QuizzesValidation { get; set; } = new();
        public string? Error { get; set; }
    }

    public class ValidationSummary
    {
        public int DatabaseCount { get; set; }
        public int JsonCount { get; set; }
        public bool IsConsistent { get; set; }
    }

    public class ModuleParityResult
    {
        public int ModuleId { get; set; }
        public string Slug { get; set; } = string.Empty;
        public int LessonsDb { get; set; }
        public int LessonsJson { get; set; }
        public int QuizzesDb { get; set; }
        public int QuizzesJson { get; set; }
        public int LessonsDelta { get; set; }
        public int QuizzesDelta { get; set; }
    }
}