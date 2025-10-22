using Microsoft.AspNetCore.Mvc;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReadinessController : ControllerBase
    {
        private readonly ReadinessService _readinessService;
        private readonly GlassCodeDbContext _context;

        public ReadinessController(ReadinessService readinessService, GlassCodeDbContext context)
        {
            _readinessService = readinessService;
            _context = context;
        }

        /// <summary>
        /// Check if the service is ready to serve content
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<ReadinessResponse>> GetReadiness()
        {
            try
            {
                // Check database connectivity
                var canConnect = await _context.Database.CanConnectAsync();
                if (!canConnect)
                {
                    return StatusCode(503, new ReadinessResponse
                    {
                        Status = "not_ready",
                        Reason = "Database connection failed",
                        DatabaseConnected = false
                    });
                }

                // Check if content is ready
                var isContentReady = await _readinessService.CheckAndSetReadinessAsync();
                if (!isContentReady)
                {
                    return StatusCode(503, new ReadinessResponse
                    {
                        Status = "not_ready",
                        Reason = "Content not fully loaded",
                        DatabaseConnected = true,
                        ContentReady = false
                    });
                }

                // Perform comprehensive content completeness checks
                var completenessCheck = await CheckContentCompletenessAsync();
                if (!completenessCheck.IsComplete)
                {
                    return StatusCode(503, new ReadinessResponse
                    {
                        Status = "not_ready",
                        Reason = completenessCheck.Reason,
                        DatabaseConnected = true,
                        ContentReady = true,
                        ContentComplete = false
                    });
                }

                // Get content statistics
                var moduleCount = await _context.Modules.CountAsync();
                var lessonCount = await _context.Lessons.CountAsync();
                var quizCount = await _context.LessonQuizzes.CountAsync();

                return Ok(new ReadinessResponse
                {
                    Status = "ready",
                    DatabaseConnected = true,
                    ContentReady = true,
                    ContentComplete = true,
                    Modules = moduleCount,
                    Lessons = lessonCount,
                    Quizzes = quizCount,
                    Details = completenessCheck.Details
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new ReadinessResponse
                {
                    Status = "not_ready",
                    Reason = $"Error checking readiness: {ex.Message}",
                    DatabaseConnected = false
                });
            }
        }

        /// <summary>
        /// Perform comprehensive content completeness checks
        /// </summary>
        private async Task<(bool IsComplete, string Reason, Dictionary<string, object> Details)> CheckContentCompletenessAsync()
        {
            try
            {
                var details = new Dictionary<string, object>();

                // Check if we have the expected number of modules
                var moduleCount = await _context.Modules.CountAsync();
                details["moduleCount"] = moduleCount;

                // Load all modules with their lessons and quizzes
                var modules = await _context.Modules
                    .Include(m => m.Lessons)
                    .ThenInclude(l => l.LessonQuizzes)
                    .ToListAsync();

                // Check each module for completeness
                var incompleteModules = new List<string>();
                var modulesWithNoLessons = new List<string>();
                var modulesWithNoQuizzes = new List<string>();

                foreach (var module in modules)
                {
                    // Check if module has lessons
                    if (!module.Lessons.Any())
                    {
                        modulesWithNoLessons.Add(module.Slug);
                        incompleteModules.Add(module.Slug);
                        continue;
                    }

                    // Check if module has published quizzes
                    var hasPublishedQuizzes = module.Lessons
                        .SelectMany(l => l.LessonQuizzes)
                        .Any(q => q.IsPublished);

                    if (!hasPublishedQuizzes)
                    {
                        modulesWithNoQuizzes.Add(module.Slug);
                        incompleteModules.Add(module.Slug);
                    }
                }

                details["modulesWithNoLessons"] = modulesWithNoLessons;
                details["modulesWithNoQuizzes"] = modulesWithNoQuizzes;

                // If we have incomplete modules, return false
                if (incompleteModules.Any())
                {
                    return (false, $"Found {incompleteModules.Count} incomplete modules", details);
                }

                // Check if we have the minimum expected content
                var lessonCount = await _context.Lessons.CountAsync();
                var quizCount = await _context.LessonQuizzes.CountAsync();

                details["lessonCount"] = lessonCount;
                details["quizCount"] = quizCount;

                // Basic threshold checks
                if (moduleCount < 10) // We expect at least 10 modules
                {
                    return (false, $"Insufficient modules: {moduleCount} < 10", details);
                }

                if (lessonCount < 50) // We expect at least 50 lessons
                {
                    return (false, $"Insufficient lessons: {lessonCount} < 50", details);
                }

                if (quizCount < 100) // We expect at least 100 quizzes
                {
                    return (false, $"Insufficient quizzes: {quizCount} < 100", details);
                }

                return (true, "Content is complete", details);
            }
            catch (Exception ex)
            {
                return (false, $"Error checking content completeness: {ex.Message}", new Dictionary<string, object>());
            }
        }
    }

    public class ReadinessResponse
    {
        public string Status { get; set; } = "unknown";
        public string? Reason { get; set; }
        public bool DatabaseConnected { get; set; } = false;
        public bool ContentReady { get; set; } = false;
        public bool ContentComplete { get; set; } = false;
        public int Modules { get; set; } = 0;
        public int Lessons { get; set; } = 0;
        public int Quizzes { get; set; } = 0;
        public Dictionary<string, object>? Details { get; set; }
    }
}