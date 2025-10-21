using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/lessons-db")]
public class LessonsDbController : ControllerBase
{
    private readonly GlassCodeDbContext _context;

    public LessonsDbController(GlassCodeDbContext context)
    {
        _context = context;
    }

    // GET: api/lessons-db
    [HttpGet]
    public async Task<ActionResult<IEnumerable<backend.Models.Lesson>>> GetLessons([FromQuery] int? moduleId = null)
    {
        var query = _context.Lessons.AsQueryable();

        if (moduleId.HasValue)
        {
            query = query.Where(l => l.ModuleId == moduleId.Value);
        }

        var lessons = await query.ToListAsync();
        
        // Clear navigation properties to prevent circular references
        foreach (var lesson in lessons)
        {
            lesson.Module = null!;
            lesson.LessonTags = null!;
            lesson.UserLessonProgress = null!;
        }

        return lessons;
    }

    // GET: api/lessons-db/5
    [HttpGet("{id}")]
    public async Task<ActionResult<backend.Models.Lesson>> GetLesson(int id)
    {
        var lesson = await _context.Lessons.FirstOrDefaultAsync(l => l.Id == id);

        if (lesson == null)
        {
            return NotFound();
        }

        // Clear navigation properties to prevent circular references
        lesson.Module = null!;
        lesson.LessonTags = null!;
        lesson.UserLessonProgress = null!;

        return lesson;
    }

    // POST: api/lessons-db
    [HttpPost]
    public async Task<ActionResult<Lesson>> PostLesson(LessonCreateDto lessonDto)
    {
        try
        {
            // Verify that the module exists
            var module = await _context.Modules.FindAsync(lessonDto.ModuleId);
            if (module == null)
            {
                return BadRequest($"Module with ID {lessonDto.ModuleId} not found.");
            }

            var lesson = new Lesson
            {
                Title = lessonDto.Title,
                Slug = lessonDto.Slug,
                Order = lessonDto.Order,
                Content = lessonDto.Content?.GetRawText(),
                Metadata = lessonDto.Metadata?.GetRawText(),
                IsPublished = lessonDto.IsPublished,
                Difficulty = lessonDto.Difficulty,
                EstimatedMinutes = lessonDto.EstimatedMinutes,
                ModuleId = lessonDto.ModuleId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Set navigation property to null to prevent circular references
            lesson.Module = null!;

            _context.Lessons.Add(lesson);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetLesson", new { id = lesson.Id }, lesson);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, innerException = ex.InnerException?.Message });
        }
    }

    // PUT: api/lessons-db/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutLesson(int id, LessonUpdateDto lessonUpdateDto)
    {
        try
        {
            var existingLesson = await _context.Lessons.FindAsync(id);
            if (existingLesson == null)
            {
                return NotFound();
            }

            // Update only the provided fields
            existingLesson.Title = lessonUpdateDto.Title;
            existingLesson.Slug = lessonUpdateDto.Slug;
            existingLesson.Order = lessonUpdateDto.Order;
            existingLesson.Content = lessonUpdateDto.Content?.GetRawText();
            existingLesson.Metadata = lessonUpdateDto.Metadata?.GetRawText();
            existingLesson.IsPublished = lessonUpdateDto.IsPublished;
            existingLesson.Difficulty = lessonUpdateDto.Difficulty;
            existingLesson.EstimatedMinutes = lessonUpdateDto.EstimatedMinutes ?? 0;
            existingLesson.ModuleId = lessonUpdateDto.ModuleId;
            existingLesson.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            
            // Set navigation properties to null to prevent circular references
            existingLesson.Module = null!;
            existingLesson.LessonTags = null!;
            existingLesson.UserLessonProgress = null!;

            return Ok(existingLesson);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!LessonExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

    }

    // DELETE: api/lessons-db/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLesson(int id)
    {
        var lesson = await _context.Lessons.FindAsync(id);
        if (lesson == null)
        {
            return NotFound();
        }

        _context.Lessons.Remove(lesson);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool LessonExists(int id)
    {
        return _context.Lessons.Any(e => e.Id == id);
    }
}