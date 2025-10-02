using Microsoft.AspNetCore.Mvc;
using backend.Models;
using System.Text.Json;
using System.IO;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestingLessonsController : ControllerBase
    {
        private readonly backend.Services.DataService _dataService = backend.Services.DataService.Instance;

        [HttpGet]
        public IEnumerable<TestingLesson> Get()
        {
            var jsonPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "testing_lessons.json");
            if (!System.IO.File.Exists(jsonPath))
            {
                return new List<TestingLesson>();
            }

            var jsonContent = System.IO.File.ReadAllText(jsonPath);
            var lessons = System.Text.Json.JsonSerializer.Deserialize<List<TestingLesson>>(jsonContent, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            });

            return lessons ?? new List<TestingLesson>();
        }
    }
}