using Microsoft.AspNetCore.Mvc;
using backend.Models;
using System.Text.Json;
using System.IO;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestingInterviewQuestionsController : ControllerBase
    {
        private readonly backend.Services.DataService _dataService = backend.Services.DataService.Instance;

        [HttpGet]
        public IEnumerable<TestingInterviewQuestion> Get()
        {
            var jsonPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "testing_questions.json");
            if (!System.IO.File.Exists(jsonPath))
            {
                return new List<TestingInterviewQuestion>();
            }

            var jsonContent = System.IO.File.ReadAllText(jsonPath);
            var questions = System.Text.Json.JsonSerializer.Deserialize<List<TestingInterviewQuestion>>(jsonContent, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            });

            return questions ?? new List<TestingInterviewQuestion>();
        }
    }
}