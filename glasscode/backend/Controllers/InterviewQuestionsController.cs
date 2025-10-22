using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Services;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InterviewQuestionsController : ControllerBase
{
    private readonly DataService _dataService = DataService.Instance;
    private readonly GlassCodeDbContext _dbContext;

    public InterviewQuestionsController(GlassCodeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> Get([FromQuery] string? module = null)
    {
        // Try to get questions from database first
        try
        {
            var dbQuestions = await GetQuestionsFromDatabase(module ?? "dotnet");
            if (dbQuestions != null && dbQuestions.Any())
            {
                return Ok(dbQuestions);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database fetch failed: {ex.Message}");
        }

        // Fallback to JSON files
        var questions = GetQuestionsByModule(module ?? "dotnet");
        return Ok(questions);
    }

    [HttpGet("by-topic/{topic}")]
    public async Task<ActionResult<IEnumerable<object>>> GetByTopic(string topic, [FromQuery] string? module = null)
    {
        // Try to get questions from database first
        try
        {
            var dbQuestions = await GetQuestionsFromDatabase(module ?? "dotnet");
            if (dbQuestions != null && dbQuestions.Any())
            {
                var filtered = dbQuestions.Where(q =>
                {
                    // Extract topic from metadata if it exists
                    if (q is IDictionary<string, object> dict && dict.ContainsKey("Topic"))
                    {
                        return dict["Topic"]?.ToString()?.Equals(topic, StringComparison.OrdinalIgnoreCase) ?? false;
                    }
                    return false;
                }).ToList();
                return Ok(filtered);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Database fetch failed: {ex.Message}");
        }

        // Fallback to JSON files
        var questions = GetQuestionsByModule(module ?? "dotnet");
        var filteredQuestions = questions.Where(q => q.Topic != null && q.Topic.Equals(topic, StringComparison.OrdinalIgnoreCase)).ToList();
        return Ok(filteredQuestions);
    }

    [HttpPost("submit")] // expects { questionId, answerIndex }
    public ActionResult<AnswerResult> SubmitAnswer([FromBody] AnswerSubmission submission)
    {
        return Ok(_dataService.ValidateAnswer(submission.QuestionId, submission.AnswerIndex));
    }

    private async Task<IEnumerable<object>> GetQuestionsFromDatabase(string moduleSlug)
    {
        var module = await _dbContext.Modules
            .FirstOrDefaultAsync(m => m.Slug == moduleSlug);

        if (module == null)
        {
            return new List<object>();
        }

        var quizzes = await _dbContext.LessonQuizzes
            .Where(l => l.Lesson.ModuleId == module.Id)
            .ToListAsync();

        // Convert database quizzes to the format expected by the frontend
        var convertedQuestions = quizzes.Select(quiz => new
        {
            Id = quiz.Id,
            Topic = quiz.Topic,
            Type = quiz.QuestionType,
            Question = quiz.Question,
            Choices = !string.IsNullOrEmpty(quiz.Choices) ? System.Text.Json.JsonSerializer.Deserialize<string[]>(quiz.Choices) : null,
            FixedChoiceOrder = quiz.FixedChoiceOrder,
            ChoiceLabels = !string.IsNullOrEmpty(quiz.ChoiceLabels) ? System.Text.Json.JsonSerializer.Deserialize<string[]>(quiz.ChoiceLabels) : null,
            AcceptedAnswers = !string.IsNullOrEmpty(quiz.AcceptedAnswers) ? System.Text.Json.JsonSerializer.Deserialize<string[]>(quiz.AcceptedAnswers) : null,
            CorrectAnswer = quiz.CorrectAnswer,
            Explanation = quiz.Explanation,
            Difficulty = quiz.Difficulty,
            EstimatedTime = quiz.EstimatedTime,
            Tags = !string.IsNullOrEmpty(quiz.Tags) ? System.Text.Json.JsonSerializer.Deserialize<string[]>(quiz.Tags) : null,
            Sources = !string.IsNullOrEmpty(quiz.Sources) ? System.Text.Json.JsonSerializer.Deserialize<string[]>(quiz.Sources) : null,
            IndustryContext = quiz.IndustryContext,
            IsPublished = quiz.IsPublished,
            CreatedAt = quiz.CreatedAt,
            UpdatedAt = quiz.UpdatedAt
        });

        return convertedQuestions;
    }

    private IEnumerable<BaseInterviewQuestion> GetQuestionsByModule(string module)
    {
        return module.ToLower() switch
        {
            "dotnet" => _dataService.DotNetInterviewQuestions,
            "react" => _dataService.ReactInterviewQuestions,
            "vue" => _dataService.VueInterviewQuestions,
            "node" => _dataService.NodeInterviewQuestions,
            "typescript" => _dataService.TypescriptInterviewQuestions,
            "database" => _dataService.DatabaseInterviewQuestions,
            "testing" => _dataService.TestingInterviewQuestions,
            "sass" => _dataService.SassInterviewQuestions,
            "tailwind" => _dataService.TailwindInterviewQuestions,
            "nextjs" => _dataService.NextJsInterviewQuestions,
            "laravel" => _dataService.LaravelInterviewQuestions,
            "graphql" => _dataService.GraphQLInterviewQuestions,
            "programming" => _dataService.ProgrammingInterviewQuestions,
            "web" => _dataService.WebInterviewQuestions,
            "performance" => _dataService.PerformanceInterviewQuestions,
            "security" => _dataService.SecurityInterviewQuestions,
            "version" => _dataService.VersionInterviewQuestions,
            _ => _dataService.DotNetInterviewQuestions
        };
    }
}