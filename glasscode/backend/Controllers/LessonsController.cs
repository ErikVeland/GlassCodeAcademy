using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LessonsController : ControllerBase
{
    private readonly DataService _dataService = DataService.Instance;

    [HttpGet]
    public ActionResult<IEnumerable<BaseLesson>> GetAll([FromQuery] string? module = null)
    {
        var lessons = GetLessonsByModule(module ?? "dotnet");
        Console.WriteLine($"Lessons count: {lessons.Count()}");
        if (lessons == null || !lessons.Any())
        {
            return StatusCode(500, "No lessons available.");
        }
        return Ok(lessons);
    }

    [HttpGet("{id}")]
    public ActionResult<BaseLesson> Get(string id, [FromQuery] string? module = null)
    {
        var lessons = GetLessonsByModule(module ?? "dotnet");
        var lesson = lessons.FirstOrDefault(l => l.Id == int.Parse(id));
        return lesson == null ? NotFound() : Ok(lesson);
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
            "database" => _dataService.DatabaseLessons,
            "testing" => _dataService.TestingLessons,
            "sass" => _dataService.SassLessons,
            "tailwind" => _dataService.TailwindLessons,
            "nextjs" => _dataService.NextJsLessons,
            _ => _dataService.DotNetLessons
        };
    }
}
