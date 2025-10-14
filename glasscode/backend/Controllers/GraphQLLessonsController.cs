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
            // Candidate paths for content lessons (GraphQL module)
            var candidatePaths = new List<string>
            {
                System.IO.Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "content", "lessons", "graphql-advanced.json"),
                System.IO.Path.Combine(Directory.GetCurrentDirectory(), "..", "content", "lessons", "graphql-advanced.json"),
                System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "content", "lessons", "graphql-advanced.json"),
                System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "content", "lessons", "graphql-advanced.json"),
                "/Users/veland/GlassCodeAcademy/content/lessons/graphql-advanced.json"
            };

            var jsonPath = candidatePaths.FirstOrDefault(System.IO.File.Exists);
            if (jsonPath == null)
            {
                Console.WriteLine($"GraphQL lessons file not found in content paths. Checked: {string.Join(", ", candidatePaths)}");
                _lessons = new List<GraphQLLesson>();
                return;
            }

            var jsonString = System.IO.File.ReadAllText(jsonPath);
            var mappedLessons = new List<GraphQLLesson>();

            try
            {
                using var doc = JsonDocument.Parse(jsonString, new JsonDocumentOptions { AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip });
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var el in doc.RootElement.EnumerateArray())
                    {
                        int id = 0;
                        if (el.TryGetProperty("order", out var orderProp) && orderProp.ValueKind == JsonValueKind.Number)
                        {
                            id = orderProp.GetInt32();
                        }
                        else if (el.TryGetProperty("id", out var idProp) && idProp.ValueKind == JsonValueKind.String)
                        {
                            // Fallback: extract trailing digits from string id
                            var idStr = idProp.GetString() ?? string.Empty;
                            var digits = new string(idStr.Reverse().TakeWhile(char.IsDigit).Reverse().ToArray());
                            if (!string.IsNullOrEmpty(digits) && int.TryParse(digits, out var parsed))
                            {
                                id = parsed;
                            }
                        }

                        string? topic = null;
                        if (el.TryGetProperty("legacy", out var legacyProp) && legacyProp.ValueKind == JsonValueKind.Object)
                        {
                            if (legacyProp.TryGetProperty("originalTopic", out var t) && t.ValueKind == JsonValueKind.String)
                                topic = t.GetString();
                        }
                        if (string.IsNullOrWhiteSpace(topic) && el.TryGetProperty("tags", out var tagsProp) && tagsProp.ValueKind == JsonValueKind.Array)
                        {
                            var firstTag = tagsProp.EnumerateArray().FirstOrDefault();
                            if (firstTag.ValueKind == JsonValueKind.String)
                                topic = firstTag.GetString();
                        }
                        if (string.IsNullOrWhiteSpace(topic))
                        {
                            topic = "GraphQL Fundamentals";
                        }

                        string title = el.TryGetProperty("title", out var titleProp) && titleProp.ValueKind == JsonValueKind.String
                            ? titleProp.GetString() ?? string.Empty
                            : string.Empty;

                        string description = el.TryGetProperty("intro", out var introProp) && introProp.ValueKind == JsonValueKind.String
                            ? introProp.GetString() ?? string.Empty
                            : string.Empty;

                        string codeExample = string.Empty;
                        string output = string.Empty;

                        if (el.TryGetProperty("code", out var codeProp) && codeProp.ValueKind == JsonValueKind.Object)
                        {
                            if (codeProp.TryGetProperty("example", out var exProp) && exProp.ValueKind == JsonValueKind.String)
                                codeExample = exProp.GetString() ?? string.Empty;
                            if (codeProp.TryGetProperty("explanation", out var outProp) && outProp.ValueKind == JsonValueKind.String)
                                output = outProp.GetString() ?? string.Empty;
                        }

                        mappedLessons.Add(new GraphQLLesson
                        {
                            Id = id,
                            Topic = topic,
                            Title = title,
                            Description = description,
                            CodeExample = codeExample,
                            Output = output
                        });
                    }
                }
                else
                {
                    Console.WriteLine($"Unexpected JSON format for GraphQL lessons at: {jsonPath}. Expected an array.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing GraphQL lessons: {ex.Message}");
            }

            _lessons = mappedLessons;
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