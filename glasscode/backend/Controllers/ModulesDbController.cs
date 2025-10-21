using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/modules-db")]
public class ModulesDbController : ControllerBase
{
    private readonly GlassCodeDbContext _context;

    public ModulesDbController(GlassCodeDbContext context)
    {
        _context = context;
    }

    // GET: api/modules-db
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Module>>> GetModules()
    {
        var modules = await _context.Modules
            .OrderBy(m => m.Order)
            .ToListAsync();
            
        // Clear navigation properties to prevent circular references
        foreach (var module in modules)
        {
            module.Course = null!;
            module.Lessons = null!;
        }

        return modules;
    }

    // GET: api/modules-db/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Module>> GetModule(int id)
    {
        var module = await _context.Modules
            .FirstOrDefaultAsync(m => m.Id == id);

        if (module == null)
        {
            return NotFound();
        }

        // Clear navigation properties to prevent circular references
        module.Course = null!;
        module.Lessons = null!;

        return module;
    }

    // POST: api/modules-db
    [HttpPost]
    public async Task<ActionResult<Module>> PostModule(ModuleCreateDto moduleDto)
    {
        try
        {
            // Verify that the course exists
            var course = await _context.Courses.FindAsync(moduleDto.CourseId);
            if (course == null)
            {
                return BadRequest($"Course with ID {moduleDto.CourseId} not found.");
            }

            var module = new Module
            {
                Title = moduleDto.Title,
                Slug = moduleDto.Slug,
                Description = moduleDto.Description,
                Order = moduleDto.Order,
                IsPublished = moduleDto.IsPublished,
                CourseId = moduleDto.CourseId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Modules.Add(module);
            await _context.SaveChangesAsync();

            // Clear navigation properties to prevent circular references
            module.Course = null!;
            module.Lessons = null!;

            return CreatedAtAction("GetModule", new { id = module.Id }, module);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message, innerException = ex.InnerException?.Message });
        }
    }

    // PUT: api/modules-db/5
    [HttpPut("{id}")]
    public async Task<IActionResult> PutModule(int id, ModuleCreateDto moduleUpdateDto)
    {
        try
        {
            var existingModule = await _context.Modules.FindAsync(id);
            if (existingModule == null)
            {
                return NotFound();
            }

            // Update only the provided fields
            existingModule.Title = moduleUpdateDto.Title;
            existingModule.Slug = moduleUpdateDto.Slug;
            existingModule.Description = moduleUpdateDto.Description;
            existingModule.Order = moduleUpdateDto.Order;
            existingModule.IsPublished = moduleUpdateDto.IsPublished;
            existingModule.CourseId = moduleUpdateDto.CourseId;
            existingModule.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            
            // Clear navigation properties to prevent circular references
            existingModule.Course = null!;
            existingModule.Lessons = null!;

            return Ok(existingModule);
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

    }

    // DELETE: api/modules-db/5
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

    private bool ModuleExists(int id)
    {
        return _context.Modules.Any(e => e.Id == id);
    }
}