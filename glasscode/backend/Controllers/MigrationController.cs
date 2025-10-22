using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MigrationController : ControllerBase
{
    private readonly AutomatedMigrationService _migrationService;

    public MigrationController(AutomatedMigrationService migrationService)
    {
        _migrationService = migrationService;
    }

    [HttpPost("full-migration")]
    public async Task<ActionResult<MigrationResult>> PerformFullMigration()
    {
        try
        {
            var success = await _migrationService.PerformFullMigrationAsync();

            return Ok(new MigrationResult
            {
                Success = success,
                Message = success ? "Full migration completed successfully" : "Migration failed",
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new MigrationResult
            {
                Success = false,
                Message = $"Migration failed: {ex.Message}",
                Timestamp = DateTime.UtcNow
            });
        }
    }

    [HttpGet("status")]
    public ActionResult<MigrationStatus> GetMigrationStatus()
    {
        // This would typically check the actual migration status
        // For now, we'll return a simple status
        return Ok(new MigrationStatus
        {
            IsDatabaseConnected = true,
            LastMigration = DateTime.UtcNow,
            Status = "Ready for migration"
        });
    }
}

public class MigrationResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}

public class MigrationStatus
{
    public bool IsDatabaseConnected { get; set; }
    public DateTime LastMigration { get; set; }
    public string Status { get; set; } = string.Empty;
}