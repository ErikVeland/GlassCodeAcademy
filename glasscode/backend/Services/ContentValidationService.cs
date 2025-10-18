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
            var allLessonCollections = new[]
            {
                _dataService.DotNetLessons,
                _dataService.ReactLessons,
                _dataService.TailwindLessons,
                _dataService.NodeLessons,
                _dataService.SassLessons,
                _dataService.VueLessons,
                _dataService.TypescriptLessons,
                _dataService.DatabaseLessons,
                _dataService.TestingLessons,
                _dataService.ProgrammingLessons,
                _dataService.WebLessons,
                _dataService.NextJsLessons,
                _dataService.PerformanceLessons,
                _dataService.SecurityLessons,
                _dataService.VersionLessons,
                _dataService.LaravelLessons
            };

            return allLessonCollections.Where(lessons => lessons?.Any() == true)
                                      .Sum(lessons => lessons.Count());
        }

        private int GetTotalJsonQuizzesCount()
        {
            var allQuestionCollections = new[]
            {
                _dataService.DotNetInterviewQuestions,
                _dataService.ReactInterviewQuestions,
                _dataService.TailwindInterviewQuestions,
                _dataService.NodeInterviewQuestions,
                _dataService.SassInterviewQuestions,
                _dataService.VueInterviewQuestions,
                _dataService.TypescriptInterviewQuestions,
                _dataService.DatabaseInterviewQuestions,
                _dataService.TestingInterviewQuestions,
                _dataService.ProgrammingInterviewQuestions,
                _dataService.WebInterviewQuestions,
                _dataService.NextJsInterviewQuestions,
                _dataService.PerformanceInterviewQuestions,
                _dataService.SecurityInterviewQuestions,
                _dataService.VersionInterviewQuestions,
                _dataService.LaravelInterviewQuestions,
                _dataService.GraphQLInterviewQuestions
            };

            return allQuestionCollections.Where(questions => questions?.Any() == true)
                                        .Sum(questions => questions.Count());
        }

        public string GenerateContentHash(string content)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(content));
                return BitConverter.ToString(hashedBytes).Replace("-", "").ToLower();
            }
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

    // Reuse the ModuleRegistryData classes from ModuleSeedingService
}