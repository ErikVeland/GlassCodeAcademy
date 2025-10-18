using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/content")]
public class ContentController : ControllerBase
{
    private readonly GlassCodeDbContext _context;
    private readonly ILogger<ContentController> _logger;

    public ContentController(GlassCodeDbContext context, ILogger<ContentController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("registry")]
    public async Task<ActionResult<object>> GetContentRegistry()
    {
        try
        {
            var contentPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "content");
            var registryPath = System.IO.Path.Combine(contentPath, "registry.json");
            if (!System.IO.File.Exists(registryPath))
            {
                return NotFound("Registry file not found");
            }

            var jsonContent = await System.IO.File.ReadAllTextAsync(registryPath);
            return Content(jsonContent, "application/json");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading registry file");
            return StatusCode(500, "Error reading registry file");
        }
    }

    [HttpGet("quizzes/{moduleSlug}")]
    public async Task<ActionResult<object>> GetModuleQuiz(string moduleSlug)
    {
        try
        {
            _logger.LogInformation($"Fetching quiz for module: {moduleSlug}");

            // First try to get from database
            var module = await _context.Modules
                .FirstOrDefaultAsync(m => m.Slug == moduleSlug);

            if (module == null)
            {
                _logger.LogWarning($"Module not found: {moduleSlug}");
                return NotFound($"Module '{moduleSlug}' not found");
            }

            // Get all lessons for this module
            var lessons = await _context.Lessons
                .Where(l => l.ModuleId == module.Id)
                .ToListAsync();

            if (!lessons.Any())
            {
                _logger.LogWarning($"No lessons found for module: {moduleSlug}");
                return NotFound($"No lessons found for module '{moduleSlug}'");
            }

            // Get all quizzes for these lessons
            var lessonIds = lessons.Select(l => l.Id).ToList();
            var quizzes = await _context.LessonQuizzes
                .Where(q => lessonIds.Contains(q.LessonId))
                .ToListAsync();

            _logger.LogInformation($"Found {quizzes.Count} quizzes for module: {moduleSlug}");

            // Convert to the expected format
            var questions = quizzes.Select(quiz => new
            {
                id = quiz.Id,
                topic = quiz.Topic,
                type = quiz.QuestionType,
                question = quiz.Question,
                choices = !string.IsNullOrEmpty(quiz.Choices) ? 
                    System.Text.Json.JsonSerializer.Deserialize<string[]>(quiz.Choices) : null,
                correctAnswer = quiz.CorrectAnswer,
                explanation = quiz.Explanation,
                difficulty = quiz.Difficulty,
                estimatedTime = quiz.EstimatedTime,
                tags = !string.IsNullOrEmpty(quiz.Tags) ? 
                    System.Text.Json.JsonSerializer.Deserialize<string[]>(quiz.Tags) : null,
                sources = !string.IsNullOrEmpty(quiz.Sources) ? 
                    System.Text.Json.JsonSerializer.Deserialize<string[]>(quiz.Sources) : null,
                industryContext = quiz.IndustryContext,
                isPublished = quiz.IsPublished,
                createdAt = quiz.CreatedAt,
                updatedAt = quiz.UpdatedAt
            }).ToList();

            var result = new
            {
                questions = questions
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error fetching quiz for module: {moduleSlug}");
            return StatusCode(500, $"Error fetching quiz for module '{moduleSlug}'");
        }
    }

    [HttpGet("lessons/{moduleSlug}")]
    public async Task<ActionResult<object>> GetModuleLessons(string moduleSlug)
    {
        try
        {
            _logger.LogInformation($"Fetching lessons for module: {moduleSlug}");

            // First try to get from database
            var module = await _context.Modules
                .FirstOrDefaultAsync(m => m.Slug == moduleSlug);

            if (module == null)
            {
                _logger.LogWarning($"Module not found: {moduleSlug}");
                return NotFound($"Module '{moduleSlug}' not found");
            }

            // Get all lessons for this module
            var lessons = await _context.Lessons
                .Where(l => l.ModuleId == module.Id)
                .ToListAsync();

            _logger.LogInformation($"Found {lessons.Count} lessons for module: {moduleSlug}");

            // Convert to the expected format
            var result = lessons.Select(lesson => new
            {
                id = lesson.Id,
                title = lesson.Title,
                slug = lesson.Slug,
                order = lesson.Order,
                content = !string.IsNullOrEmpty(lesson.Content) ? 
                    System.Text.Json.JsonSerializer.Deserialize<object>(lesson.Content) : null,
                metadata = !string.IsNullOrEmpty(lesson.Metadata) ? 
                    System.Text.Json.JsonSerializer.Deserialize<object>(lesson.Metadata) : null,
                difficulty = lesson.Difficulty,
                estimatedMinutes = lesson.EstimatedMinutes,
                isPublished = lesson.IsPublished,
                createdAt = lesson.CreatedAt,
                updatedAt = lesson.UpdatedAt
            }).ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error fetching lessons for module: {moduleSlug}");
            return StatusCode(500, $"Error fetching lessons for module '{moduleSlug}'");
        }
    }
}