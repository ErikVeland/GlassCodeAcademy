using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Services;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly GlassCodeDbContext _ctx;
        private readonly AutomatedMigrationService _migrationService;

        public AdminController(GlassCodeDbContext ctx, AutomatedMigrationService migrationService)
        {
            _ctx = ctx;
            _migrationService = migrationService;
        }

        [HttpPost("wipe-and-remigrate")]
        public async Task<IActionResult> WipeAndRemigrate()
        {
            // Capture pre-wipe counts
            var preModules = await _ctx.Modules.CountAsync();
            var preLessons = await _ctx.Lessons.CountAsync();
            var preQuizzes = await _ctx.LessonQuizzes.CountAsync();

            // Wipe quizzes first to avoid FK constraints
            var quizzes = await _ctx.LessonQuizzes.ToListAsync();
            if (quizzes.Count > 0)
            {
                _ctx.LessonQuizzes.RemoveRange(quizzes);
            }

            // Wipe lessons
            var lessons = await _ctx.Lessons.ToListAsync();
            if (lessons.Count > 0)
            {
                _ctx.Lessons.RemoveRange(lessons);
            }

            await _ctx.SaveChangesAsync();

            // Re-run automated migration
            var success = await _migrationService.PerformFullMigrationAsync();

            // Capture post-wipe counts
            var postModules = await _ctx.Modules.CountAsync();
            var postLessons = await _ctx.Lessons.CountAsync();
            var postQuizzes = await _ctx.LessonQuizzes.CountAsync();

            return Ok(new
            {
                wiped = new { modules = preModules, lessons = preLessons, quizzes = preQuizzes },
                after = new { modules = postModules, lessons = postLessons, quizzes = postQuizzes },
                success
            });
        }
    }
}