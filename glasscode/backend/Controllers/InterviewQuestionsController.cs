using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InterviewQuestionsController : ControllerBase
{
    private readonly DataService _dataService = DataService.Instance;

    [HttpGet]
    public ActionResult<IEnumerable<BaseInterviewQuestion>> Get([FromQuery] string? module = null)
    {
        var questions = GetQuestionsByModule(module ?? "dotnet");
        return Ok(questions);
    }

    [HttpGet("by-topic/{topic}")]
    public ActionResult<IEnumerable<BaseInterviewQuestion>> GetByTopic(string topic, [FromQuery] string? module = null)
    {
        var questions = GetQuestionsByModule(module ?? "dotnet");
        var filtered = questions.Where(q => q.Topic != null && q.Topic.Equals(topic, StringComparison.OrdinalIgnoreCase)).ToList();
        return Ok(filtered);
    }

    [HttpPost("submit")] // expects { questionId, answerIndex }
    public ActionResult<AnswerResult> SubmitAnswer([FromBody] AnswerSubmission submission)
    {
        return Ok(_dataService.ValidateAnswer(submission.QuestionId, submission.AnswerIndex));
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
