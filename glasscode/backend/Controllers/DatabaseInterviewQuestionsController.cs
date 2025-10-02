using Microsoft.AspNetCore.Mvc;
using backend.Models;
using System.Text.Json;
using System.IO;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DatabaseInterviewQuestionsController : ControllerBase
    {
        private readonly backend.Services.DataService _dataService = backend.Services.DataService.Instance;

        [HttpGet]
        public IEnumerable<DatabaseInterviewQuestion> Get()
        {
            var jsonPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "database_questions.json");
            if (!System.IO.File.Exists(jsonPath))
            {
                return new List<DatabaseInterviewQuestion>();
            }

            var jsonContent = System.IO.File.ReadAllText(jsonPath);
            var questions = System.Text.Json.JsonSerializer.Deserialize<List<DatabaseInterviewQuestion>>(jsonContent, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            });

            return questions ?? new List<DatabaseInterviewQuestion>();
        }
    }
}