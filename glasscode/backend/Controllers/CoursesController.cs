using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoursesController : ControllerBase
{
    private readonly GlassCodeDbContext _context;

    public CoursesController(GlassCodeDbContext context)
    {
        _context = context;
    }

    // GET: api/courses
    [HttpGet]
    public async Task<ActionResult<IEnumerable<backend.Models.Course>>> GetCourses()
    {
        var courses = await _context.Courses.ToListAsync();
        
        // Set navigation properties to null to prevent circular references
        foreach (var course in courses)
        {
            course.Modules = null!;
            course.UserProgress = null!;
        }
        
        return courses;
    }

    // GET: api/courses/5
    [HttpGet("{id}")]
    public async Task<ActionResult<backend.Models.Course>> GetCourse(int id)
    {
        var course = await _context.Courses.FirstOrDefaultAsync(c => c.Id == id);

        if (course == null)
        {
            return NotFound();
        }

        // Set navigation properties to null to prevent circular references
        course.Modules = null!;
        course.UserProgress = null!;

        return course;
    }

    // POST: api/courses
    [HttpPost]
    public async Task<ActionResult<backend.Models.Course>> PostCourse(backend.Models.Course course)
    {
        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

        return CreatedAtAction("GetCourse", new { id = course.Id }, course);
    }

    // PUT: api/courses/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutCourse(int id, backend.Models.Course course)
    {
        if (id != course.Id)
        {
            return BadRequest();
        }

        _context.Entry(course).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!CourseExists(id))
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

    // DELETE: api/courses/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCourse(int id)
    {
        var course = await _context.Courses.FindAsync(id);
        if (course == null)
        {
            return NotFound();
        }

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool CourseExists(int id)
    {
        return _context.Courses.Any(e => e.Id == id);
    }
}