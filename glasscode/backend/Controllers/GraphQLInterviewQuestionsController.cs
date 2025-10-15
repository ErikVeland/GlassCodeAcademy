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
            // Candidate paths for content quizzes (GraphQL advanced assessment)
            var candidatePaths = new List<string>
            {
                System.IO.Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "content", "quizzes", "graphql-advanced.json"),
                System.IO.Path.Combine(Directory.GetCurrentDirectory(), "..", "content", "quizzes", "graphql-advanced.json"),
                System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "content", "quizzes", "graphql-advanced.json"),
                System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "content", "quizzes", "graphql-advanced.json"),
                System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "content", "quizzes", "graphql-advanced.json")
            };

            var jsonPath = candidatePaths.FirstOrDefault(System.IO.File.Exists);
            if (jsonPath == null)
            {
                Console.WriteLine($"GraphQL questions file not found in content paths. Checked: {string.Join(", ", candidatePaths)}");
                _questions = new List<GraphQLInterviewQuestion>();
                return;
            }

            var jsonString = System.IO.File.ReadAllText(jsonPath);
            var mappedQuestions = new List<GraphQLInterviewQuestion>();

            try
            {
                using var doc = JsonDocument.Parse(jsonString, new JsonDocumentOptions { AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip });
                if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out var questionsProp) && questionsProp.ValueKind == JsonValueKind.Array)
                {
                    int idx = 0;
                    foreach (var q in questionsProp.EnumerateArray())
                    {
                        idx++;
                        string id = idx.ToString();
                        if (q.TryGetProperty("id", out var idProp))
                        {
                            if (idProp.ValueKind == JsonValueKind.Number)
                            {
                                id = idProp.GetInt32().ToString();
                            }
                            else if (idProp.ValueKind == JsonValueKind.String)
                            {
                                id = idProp.GetString() ?? idx.ToString();
                            }
                        }

                        string topic = q.TryGetProperty("topic", out var topicProp) && topicProp.ValueKind == JsonValueKind.String
                            ? topicProp.GetString() ?? "GraphQL"
                            : "GraphQL";

                        string type = q.TryGetProperty("questionType", out var qtProp) && qtProp.ValueKind == JsonValueKind.String
                            ? qtProp.GetString() ?? "multiple-choice"
                            : "multiple-choice";

                        string question = q.TryGetProperty("question", out var questionProp) && questionProp.ValueKind == JsonValueKind.String
                            ? questionProp.GetString() ?? string.Empty
                            : string.Empty;

                        List<string> choices = new List<string>();
                        if (q.TryGetProperty("choices", out var choicesProp) && choicesProp.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var c in choicesProp.EnumerateArray())
                            {
                                if (c.ValueKind == JsonValueKind.String)
                                    choices.Add(c.GetString() ?? string.Empty);
                            }
                        }

                        int? correctIndex = null;
                        if (q.TryGetProperty("correctIndex", out var ciProp) && ciProp.ValueKind == JsonValueKind.Number)
                        {
                            var idxVal = ciProp.GetInt32();
                            if (idxVal >= 0 && idxVal < choices.Count)
                                correctIndex = idxVal;
                        }
                        else if (q.TryGetProperty("correctAnswer", out var caProp) && caProp.ValueKind == JsonValueKind.String)
                        {
                            var answerText = caProp.GetString() ?? string.Empty;
                            var idxVal = choices.FindIndex(c => string.Equals(c, answerText, StringComparison.OrdinalIgnoreCase));
                            if (idxVal >= 0)
                                correctIndex = idxVal;
                        }

                        string explanation = q.TryGetProperty("explanation", out var expProp) && expProp.ValueKind == JsonValueKind.String
                            ? expProp.GetString() ?? string.Empty
                            : string.Empty;

                        mappedQuestions.Add(new GraphQLInterviewQuestion
                        {
                            Id = id,
                            Topic = topic,
                            Type = type,
                            Question = question,
                            Choices = choices.ToArray(),
                            CorrectAnswer = correctIndex,
                            Explanation = explanation
                        });
                    }
                }
                else
                {
                    Console.WriteLine($"Unexpected JSON format for GraphQL questions at: {jsonPath}. Expected object with 'questions' array.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error parsing GraphQL questions: {ex.Message}");
            }

            _questions = mappedQuestions;
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
    public ActionResult<GraphQLInterviewQuestion> Get(string id)
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