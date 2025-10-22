using Microsoft.AspNetCore.Mvc;
using backend.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ContentValidationController : ControllerBase
{
    private readonly ContentValidationService _validationService;

    public ContentValidationController(ContentValidationService validationService)
    {
        _validationService = validationService;
    }

    [HttpGet("parity")]
    public async Task<ActionResult<ContentValidationResult>> CheckContentParity()
    {
        try
        {
            var validationService = HttpContext.RequestServices.GetRequiredService<ContentValidationService>();
            var result = await validationService.ValidateContentParityAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            var logger = HttpContext.RequestServices.GetService<ILogger<ContentValidationController>>();
            logger?.LogError(ex, "Error validating content parity");
            return Ok(new ContentValidationResult { Error = ex.Message });
        }
    }

    [HttpGet("parity/modules")]
    public async Task<ActionResult<IEnumerable<ModuleParityResult>>> CheckModuleParity()
    {
        try
        {
            var validationService = HttpContext.RequestServices.GetRequiredService<ContentValidationService>();
            var result = await validationService.GetPerModuleParityAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            var logger = HttpContext.RequestServices.GetService<ILogger<ContentValidationController>>();
            logger?.LogError(ex, "Error validating per-module content parity");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("health")]
    public async Task<ActionResult<object>> HealthCheck()
    {
        try
        {
            var validationService = HttpContext.RequestServices.GetRequiredService<ContentValidationService>();
            var validationResult = await validationService.ValidateContentParityAsync();

            return Ok(new
            {
                status = validationResult.IsOverallConsistent ? "healthy" : "degraded",
                validation = validationResult,
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            var logger = HttpContext.RequestServices.GetService<ILogger<ContentValidationController>>();
            logger?.LogError(ex, "Error in content validation health check");

            var fallbackValidation = new ContentValidationResult { Error = ex.Message };
            return Ok(new
            {
                status = "degraded",
                validation = fallbackValidation,
                timestamp = DateTime.UtcNow
            });
        }
    }
}