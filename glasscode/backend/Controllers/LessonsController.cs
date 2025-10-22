using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Services;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LessonsController : ControllerBase
{
    private readonly DataService _dataService = DataService.Instance;
    private readonly GlassCodeDbContext _dbContext;

    public LessonsController(GlassCodeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll([FromQuery] string? module = null)
    {
        // Try to get lessons from database first
        try
        {
            var dbLessons = await GetLessonsFromDatabase(module ?? "dotnet");
            if (dbLessons != null && dbLessons.Any())
            {
                return Ok(dbLessons);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database fetch failed: {ex.Message}");
        }

        // Fallback to JSON files
        var lessons = GetLessonsByModule(module ?? "dotnet");
        Console.WriteLine($"Lessons count: {lessons.Count()}");
        if (lessons == null || !lessons.Any())
        {
            return StatusCode(500, "No lessons available.");
        }
        return Ok(lessons);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<object>> Get(string id, [FromQuery] string? module = null)
    {
        // Try to get lesson from database first
        try
        {
            if (int.TryParse(id, out int lessonId))
            {
                var dbLesson = await GetLessonFromDatabase(lessonId);
                if (dbLesson != null)
                {
                    return Ok(dbLesson);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database fetch failed: {ex.Message}");
        }

        // Fallback to JSON files
        var lessons = GetLessonsByModule(module ?? "dotnet");
        var lesson = lessons.FirstOrDefault(l => l.Id == int.Parse(id));
        return lesson == null ? NotFound() : Ok(lesson);
    }

    private async Task<IEnumerable<object>> GetLessonsFromDatabase(string moduleSlug)
    {
        var module = await _dbContext.Modules
            .FirstOrDefaultAsync(m => m.Slug == moduleSlug);

        if (module == null)
        {
            return new List<object>();
        }

        var lessons = await _dbContext.Lessons
            .Where(l => l.ModuleId == module.Id)
            .ToListAsync();

        // Convert database lessons to the format expected by the frontend
        var convertedLessons = lessons.Select(lesson => new
        {
            Id = lesson.Id,
            Title = lesson.Title,
            Slug = lesson.Slug,
            Order = lesson.Order,
            Content = lesson.Content,
            Metadata = lesson.Metadata,
            Difficulty = lesson.Difficulty,
            EstimatedMinutes = lesson.EstimatedMinutes,
            IsPublished = lesson.IsPublished,
            CreatedAt = lesson.CreatedAt,
            UpdatedAt = lesson.UpdatedAt
        });

        return convertedLessons;
    }

    private async Task<object?> GetLessonFromDatabase(int id)
    {
        var lesson = await _dbContext.Lessons
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lesson == null)
        {
            return null;
        }

        // Convert database lesson to the format expected by the frontend
        var convertedLesson = new
        {
            Id = lesson.Id,
            Title = lesson.Title,
            Slug = lesson.Slug,
            Order = lesson.Order,
            Content = lesson.Content,
            Metadata = lesson.Metadata,
            Difficulty = lesson.Difficulty,
            EstimatedMinutes = lesson.EstimatedMinutes,
            IsPublished = lesson.IsPublished,
            CreatedAt = lesson.CreatedAt,
            UpdatedAt = lesson.UpdatedAt
        };

        return convertedLesson;
    }

    private IEnumerable<BaseLesson> GetLessonsByModule(string module)
    {
        return module.ToLower() switch
        {
            "dotnet" => _dataService.DotNetLessons,
            "react" => _dataService.ReactLessons,
            "vue" => _dataService.VueLessons,
            "node" => _dataService.NodeLessons,
            "typescript" => _dataService.TypescriptLessons,
            "typescript-fundamentals" => _dataService.TypescriptLessons,
            "database" => _dataService.DatabaseLessons,
            "testing" => _dataService.TestingLessons,
            "sass" => _dataService.SassLessons,
            "tailwind" => _dataService.TailwindLessons,
            "nextjs" => _dataService.NextJsLessons,
            "programming-fundamentals" => _dataService.ProgrammingLessons,
            "web" => _dataService.WebLessons,
            "performance" => _dataService.PerformanceLessons,
            "security" => _dataService.SecurityLessons,
            "version" => _dataService.VersionLessons,
            // Added explicit Laravel mapping for module slug used by frontend
            "laravel" => _dataService.LaravelLessons,
            "laravel-fundamentals" => _dataService.LaravelLessons,
            _ => _dataService.DotNetLessons
        };
    }
}