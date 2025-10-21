using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs;
using backend.Services;
using Microsoft.Extensions.Configuration;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ModulesController : ControllerBase
    {
        private readonly GlassCodeDbContext _context;
        private readonly AutomatedMigrationService _migrationService;
        private readonly IConfiguration _configuration;

        public ModulesController(GlassCodeDbContext context, AutomatedMigrationService migrationService, IConfiguration configuration)
        {
            _context = context;
            _migrationService = migrationService;
            _configuration = configuration;
        }

        // GET: api/modules
        [HttpGet]
        public async Task<ActionResult<IEnumerable<backend.Models.Module>>> GetModules(int? courseId = null)
        {
            var query = _context.Modules.AsQueryable();
            
            if (courseId.HasValue)
            {
                query = query.Where(m => m.CourseId == courseId.Value);
            }
            
            return await query.ToListAsync();
        }

        // GET: api/modules/5
        [HttpGet("{id}")]
        public async Task<ActionResult<backend.Models.Module>> GetModule(int id)
        {
            var module = await _context.Modules.FindAsync(id);

            if (module == null)
            {
                return NotFound();
            }

            return module;
        }

        // POST: api/modules
        [HttpPost]
        public async Task<ActionResult<backend.Models.Module>> PostModule(ModuleCreateDto moduleDto)
        {
            // Verify that the course exists
            var courseExists = await _context.Courses.AnyAsync(c => c.Id == moduleDto.CourseId);
            if (!courseExists)
            {
                return BadRequest("Course not found");
            }

            var module = new backend.Models.Module
            {
                Title = moduleDto.Title,
                Description = moduleDto.Description,
                Slug = moduleDto.Slug,
                Order = moduleDto.Order,
                IsPublished = moduleDto.IsPublished,
                CourseId = moduleDto.CourseId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _context.Modules.Add(module);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetModule", new { id = module.Id }, module);
        }

        // PUT: api/modules/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutModule(int id, backend.Models.Module module)
        {
            if (id != module.Id)
            {
                return BadRequest();
            }

            module.UpdatedAt = DateTime.UtcNow;
            _context.Entry(module).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ModuleExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/modules/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteModule(int id)
        {
            var module = await _context.Modules.FindAsync(id);
            if (module == null)
            {
                return NotFound();
            }

            _context.Modules.Remove(module);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/modules/{slug}/quiz
        [HttpGet("{slug}/quiz")]
        public async Task<ActionResult<IEnumerable<LessonQuizResponseDto>>> GetModuleQuiz(string slug)
        {
            // Find the module by slug
            var module = await _context.Modules
                .Include(m => m.Lessons)
                .ThenInclude(l => l.LessonQuizzes)
                .FirstOrDefaultAsync(m => m.Slug == slug);

            if (module == null)
            {
                return NotFound($"Module with slug '{slug}' not found");
            }

            // Get all quiz questions from all lessons in this module
            var quizQuestions = module.Lessons
                .SelectMany(l => l.LessonQuizzes)
                .Where(q => q.IsPublished)
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
                    LessonId = q.LessonId,
                    CreatedAt = q.CreatedAt,
                    UpdatedAt = q.UpdatedAt
                })
                .ToList();

            return Ok(quizQuestions);
        }

        // POST: api/modules/{slug}/backfill-quizzes
        [HttpPost("{slug}/backfill-quizzes")]
        public async Task<IActionResult> BackfillQuizzesForModule(string slug)
        {
            // Admin token validation (aligns with global middleware behavior)
            var configToken = _configuration["AdminApiToken"] ?? Environment.GetEnvironmentVariable("ADMIN_API_TOKEN");
            var authHeader = Request.Headers["Authorization"].ToString();
            var headerToken = Request.Headers["X-Admin-Token"].ToString();
            var bearerToken = authHeader.StartsWith("Bearer ") ? authHeader.Substring("Bearer ".Length) : string.Empty;

            if (!string.IsNullOrEmpty(configToken) && (bearerToken != configToken && headerToken != configToken))
            {
                return Unauthorized("Unauthorized");
            }

            var result = await _migrationService.SeedQuizzesForModuleSlugAsync(slug);
            if (result)
            {
                return Ok(new { success = true, module = slug, message = $"Backfill completed for '{slug}'" });
            }
            else
            {
                return BadRequest(new { success = false, module = slug, message = $"Backfill failed or no quizzes published for '{slug}'" });
            }
        }

        private bool ModuleExists(int id)
        {
            return _context.Modules.Any(e => e.Id == id);
        }
    }
}