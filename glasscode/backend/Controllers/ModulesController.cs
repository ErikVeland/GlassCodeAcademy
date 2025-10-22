using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ModulesController : ControllerBase
    {
        private readonly GlassCodeDbContext _context;

        public ModulesController(GlassCodeDbContext context)
        {
            _context = context;
        }

        // GET: api/Modules/{moduleId}/quiz
        [HttpGet("{moduleId}/quiz")]
        public async Task<ActionResult<IEnumerable<LessonQuizResponseDto>>> GetModuleQuiz(int moduleId)
        {
            var module = await _context.Modules.Include(m => m.Lessons)
                .FirstOrDefaultAsync(m => m.Id == moduleId);

            if (module == null)
            {
                return NotFound();
            }

            var lessonIds = module.Lessons.Select(l => l.Id).ToList();

            var quizzes = await _context.LessonQuizzes
                .Where(q => lessonIds.Contains(q.LessonId))
                .OrderBy(q => q.SortOrder)
                .Select(q => new LessonQuizResponseDto
                {
                    Id = q.Id,
                    Question = q.Question,
                    Topic = q.Topic,
                    Difficulty = q.Difficulty,
                    Choices = q.Choices,
                    FixedChoiceOrder = q.FixedChoiceOrder,
                    ChoiceLabels = q.ChoiceLabels,
                    AcceptedAnswers = q.AcceptedAnswers,
                    Explanation = q.Explanation,
                    IndustryContext = q.IndustryContext,
                    Tags = q.Tags,
                    QuestionType = q.QuestionType,
                    EstimatedTime = q.EstimatedTime,
                    CorrectAnswer = q.CorrectAnswer,
                    QuizType = q.QuizType,
                    Sources = q.Sources,
                    SortOrder = q.SortOrder,
                    IsPublished = q.IsPublished,
                    CreatedAt = q.CreatedAt,
                    UpdatedAt = q.UpdatedAt,
                    LessonId = q.LessonId
                })
                .ToListAsync();

            return Ok(quizzes);
        }
    }
}