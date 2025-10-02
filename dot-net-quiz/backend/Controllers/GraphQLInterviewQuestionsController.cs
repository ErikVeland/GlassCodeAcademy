using Microsoft.AspNetCore.Mvc;
using backend.Models;
using System.Text.Json;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GraphQLInterviewQuestionsController : ControllerBase
{
    private static List<GraphQLInterviewQuestion>? _questions;
    
    public static List<GraphQLInterviewQuestion> Questions
    {
        get
        {
            if (_questions == null)
            {
                LoadQuestionsFromFile();
            }
            return _questions!;
        }
    }

    private static void LoadQuestionsFromFile()
    {
        try
        {
            var jsonPath = System.IO.Path.Combine(Directory.GetCurrentDirectory(), "Data", "graphql_questions.json");
            if (System.IO.File.Exists(jsonPath))
            {
                var jsonString = System.IO.File.ReadAllText(jsonPath);
                _questions = JsonSerializer.Deserialize<List<GraphQLInterviewQuestion>>(jsonString, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new List<GraphQLInterviewQuestion>();
            }
            else
            {
                Console.WriteLine($"GraphQL questions file not found at: {jsonPath}");
                _questions = new List<GraphQLInterviewQuestion>();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading GraphQL questions: {ex.Message}");
            _questions = new List<GraphQLInterviewQuestion>();
        }
    }

    [HttpGet]
    public ActionResult<IEnumerable<GraphQLInterviewQuestion>> GetAll()
    {
        Console.WriteLine($"GraphQL Questions count: {Questions.Count}");
        if (Questions == null || Questions.Count == 0)
        {
            return StatusCode(500, "No GraphQL questions available.");
        }
        return Ok(Questions);
    }

    [HttpGet("{id}")]
    public ActionResult<GraphQLInterviewQuestion> Get(int id)
    {
        var question = Questions.FirstOrDefault(q => q.Id == id);
        return question == null ? NotFound() : Ok(question);
    }

    [HttpGet("by-topic/{topic}")]
    public ActionResult<IEnumerable<GraphQLInterviewQuestion>> GetByTopic(string topic)
    {
        var filtered = Questions.Where(q => q.Topic != null && 
            q.Topic.Equals(topic, StringComparison.OrdinalIgnoreCase)).ToList();
        return Ok(filtered);
    }

    [HttpPost("submit")]
    public ActionResult<AnswerResult> SubmitAnswer([FromBody] AnswerSubmission submission)
    {
        var question = Questions.FirstOrDefault(q => q.Id == submission.QuestionId);
        if (question == null)
            return NotFound();
        
        // Open-ended questions always pass since they're for learning
        bool isCorrect = question.Type == "open-ended" || 
                        (question.CorrectAnswer.HasValue && submission.AnswerIndex == question.CorrectAnswer.Value);
        
        return Ok(new AnswerResult
        {
            IsCorrect = isCorrect,
            Explanation = question.Explanation
        });
    }
}