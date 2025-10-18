using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LessonQuizController : ControllerBase
    {
        private readonly GlassCodeDbContext _context;

        public LessonQuizController(GlassCodeDbContext context)
        {
            _context = context;
        }

        // GET: api/LessonQuiz
        // GET: api/LessonQuiz?lessonId=1
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LessonQuizResponseDto>>> GetLessonQuizzes([FromQuery] int? lessonId = null)
        {
            var query = _context.LessonQuizzes.AsQueryable();
            
            if (lessonId.HasValue)
            {
                query = query.Where(q => q.LessonId == lessonId.Value);
            }
            
            var quizzes = await query
                .OrderBy(q => q.SortOrder)
                .Select(q => new LessonQuizResponseDto
                {
                    Id = q.Id,
                    Question = q.Question,
                    Topic = q.Topic,
                    Difficulty = q.Difficulty,
                    Choices = q.Choices,
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

        // GET: api/LessonQuiz/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LessonQuizResponseDto>> GetLessonQuiz(int id)
        {
            var quiz = await _context.LessonQuizzes.FindAsync(id);

            if (quiz == null)
            {
                return NotFound();
            }

            var responseDto = new LessonQuizResponseDto
            {
                Id = quiz.Id,
                Question = quiz.Question,
                Topic = quiz.Topic,
                Difficulty = quiz.Difficulty,
                Choices = quiz.Choices,
                Explanation = quiz.Explanation,
                IndustryContext = quiz.IndustryContext,
                Tags = quiz.Tags,
                QuestionType = quiz.QuestionType,
                EstimatedTime = quiz.EstimatedTime,
                CorrectAnswer = quiz.CorrectAnswer,
                QuizType = quiz.QuizType,
                Sources = quiz.Sources,
                SortOrder = quiz.SortOrder,
                IsPublished = quiz.IsPublished,
                CreatedAt = quiz.CreatedAt,
                UpdatedAt = quiz.UpdatedAt,
                LessonId = quiz.LessonId
            };

            return Ok(responseDto);
        }

        // POST: api/LessonQuiz
        [HttpPost]
        public async Task<ActionResult<LessonQuizResponseDto>> PostLessonQuiz(LessonQuizCreateDto createDto)
        {
            // Validate that the lesson exists
            var lessonExists = await _context.Lessons.AnyAsync(l => l.Id == createDto.LessonId);
            if (!lessonExists)
            {
                return BadRequest("Invalid LessonId. The specified lesson does not exist.");
            }

            var quiz = new LessonQuiz
            {
                Question = createDto.Question,
                Topic = createDto.Topic,
                Difficulty = createDto.Difficulty,
                Choices = createDto.Choices,
                Explanation = createDto.Explanation,
                IndustryContext = createDto.IndustryContext,
                Tags = createDto.Tags,
                QuestionType = createDto.QuestionType,
                EstimatedTime = createDto.EstimatedTime,
                CorrectAnswer = createDto.CorrectAnswer,
                QuizType = createDto.QuizType,
                Sources = createDto.Sources,
                SortOrder = createDto.SortOrder,
                LessonId = createDto.LessonId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.LessonQuizzes.Add(quiz);
            await _context.SaveChangesAsync();

            var responseDto = new LessonQuizResponseDto
            {
                Id = quiz.Id,
                Question = quiz.Question,
                Topic = quiz.Topic,
                Difficulty = quiz.Difficulty,
                Choices = quiz.Choices,
                Explanation = quiz.Explanation,
                IndustryContext = quiz.IndustryContext,
                Tags = quiz.Tags,
                QuestionType = quiz.QuestionType,
                EstimatedTime = quiz.EstimatedTime,
                CorrectAnswer = quiz.CorrectAnswer,
                QuizType = quiz.QuizType,
                Sources = quiz.Sources,
                SortOrder = quiz.SortOrder,
                IsPublished = quiz.IsPublished,
                CreatedAt = quiz.CreatedAt,
                UpdatedAt = quiz.UpdatedAt,
                LessonId = quiz.LessonId
            };

            return CreatedAtAction(nameof(GetLessonQuiz), new { id = quiz.Id }, responseDto);
        }

        // PUT: api/LessonQuiz/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLessonQuiz(int id, LessonQuizUpdateDto updateDto)
        {
            var quiz = await _context.LessonQuizzes.FindAsync(id);
            if (quiz == null)
            {
                return NotFound();
            }

            quiz.Question = updateDto.Question;
            quiz.Topic = updateDto.Topic;
            quiz.Difficulty = updateDto.Difficulty;
            quiz.Choices = updateDto.Choices;
            quiz.Explanation = updateDto.Explanation;
            quiz.IndustryContext = updateDto.IndustryContext;
            quiz.Tags = updateDto.Tags;
            quiz.QuestionType = updateDto.QuestionType;
            quiz.EstimatedTime = updateDto.EstimatedTime;
            quiz.CorrectAnswer = updateDto.CorrectAnswer;
            quiz.QuizType = updateDto.QuizType;
            quiz.Sources = updateDto.Sources;
            quiz.SortOrder = updateDto.SortOrder;
            quiz.IsPublished = updateDto.IsPublished;
            quiz.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LessonQuizExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            var responseDto = new LessonQuizResponseDto
            {
                Id = quiz.Id,
                Question = quiz.Question,
                Topic = quiz.Topic,
                Difficulty = quiz.Difficulty,
                Choices = quiz.Choices,
                Explanation = quiz.Explanation,
                IndustryContext = quiz.IndustryContext,
                Tags = quiz.Tags,
                QuestionType = quiz.QuestionType,
                EstimatedTime = quiz.EstimatedTime,
                CorrectAnswer = quiz.CorrectAnswer,
                QuizType = quiz.QuizType,
                Sources = quiz.Sources,
                SortOrder = quiz.SortOrder,
                IsPublished = quiz.IsPublished,
                CreatedAt = quiz.CreatedAt,
                UpdatedAt = quiz.UpdatedAt,
                LessonId = quiz.LessonId
            };

            return Ok(responseDto);
        }

        // DELETE: api/LessonQuiz/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLessonQuiz(int id)
        {
            var quiz = await _context.LessonQuizzes.FindAsync(id);
            if (quiz == null)
            {
                return NotFound();
            }

            _context.LessonQuizzes.Remove(quiz);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool LessonQuizExists(int id)
        {
            return _context.LessonQuizzes.Any(e => e.Id == id);
        }
    }
}