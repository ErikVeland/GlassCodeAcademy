using Microsoft.AspNetCore.Mvc;
using backend.Models;
using System.Text.Json;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GraphQLLessonsController : ControllerBase
{
    private static List<GraphQLLesson>? _lessons;
    
    public static List<GraphQLLesson> Lessons
    {
        get
        {
            if (_lessons == null)
            {
                LoadLessonsFromFile();
            }
            return _lessons!;
        }
    }

    private static void LoadLessonsFromFile()
    {
        try
        {
            var jsonPath = System.IO.Path.Combine(Directory.GetCurrentDirectory(), "Data", "graphql_lessons.json");
            if (System.IO.File.Exists(jsonPath))
            {
                var jsonString = System.IO.File.ReadAllText(jsonPath);
                _lessons = JsonSerializer.Deserialize<List<GraphQLLesson>>(jsonString, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new List<GraphQLLesson>();
            }
            else
            {
                Console.WriteLine($"GraphQL lessons file not found at: {jsonPath}");
                _lessons = new List<GraphQLLesson>();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading GraphQL lessons: {ex.Message}");
            _lessons = new List<GraphQLLesson>();
        }
    }

    [HttpGet]
    public ActionResult<IEnumerable<GraphQLLesson>> GetAll()
    {
        Console.WriteLine($"GraphQL Lessons count: {Lessons.Count}");
        if (Lessons == null || Lessons.Count == 0)
        {
            return StatusCode(500, "No GraphQL lessons available.");
        }
        return Ok(Lessons);
    }

    [HttpGet("{id}")]
    public ActionResult<GraphQLLesson> Get(int id)
    {
        var lesson = Lessons.FirstOrDefault(l => l.Id == id);
        return lesson == null ? NotFound() : Ok(lesson);
    }

    [HttpGet("by-topic/{topic}")]
    public ActionResult<IEnumerable<GraphQLLesson>> GetByTopic(string topic)
    {
        var filtered = Lessons.Where(l => l.Topic != null && 
            l.Topic.Equals(topic, StringComparison.OrdinalIgnoreCase)).ToList();
        return Ok(filtered);
    }
}