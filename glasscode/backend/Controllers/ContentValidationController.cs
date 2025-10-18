using Microsoft.AspNetCore.Mvc;
using backend.Services;

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
        var result = await _validationService.ValidateContentParityAsync();
        return Ok(result);
    }

    [HttpGet("health")]
    public async Task<ActionResult<object>> HealthCheck()
    {
        var validationResult = await _validationService.ValidateContentParityAsync();
        
        return Ok(new
        {
            status = validationResult.IsOverallConsistent ? "healthy" : "degraded",
            validation = validationResult,
            timestamp = DateTime.UtcNow
        });
    }
}