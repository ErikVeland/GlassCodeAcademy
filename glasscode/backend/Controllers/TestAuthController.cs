using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestAuthController : ControllerBase
    {
        /// <summary>
        /// A public endpoint that doesn't require authentication
        /// </summary>
        [HttpGet("public")]
        public IActionResult PublicEndpoint()
        {
            return Ok(new { message = "This is a public endpoint", timestamp = DateTime.UtcNow });
        }

        /// <summary>
        /// An endpoint that requires authentication
        /// </summary>
        [Authorize]
        [HttpGet("protected")]
        public IActionResult ProtectedEndpoint()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            
            return Ok(new { 
                message = "This is a protected endpoint", 
                userId = userId,
                userEmail = userEmail,
                timestamp = DateTime.UtcNow 
            });
        }

        /// <summary>
        /// An endpoint that requires admin role
        /// </summary>
        [Authorize(Policy = "AdminOnly")]
        [HttpGet("admin")]
        public IActionResult AdminEndpoint()
        {
            return Ok(new { message = "This is an admin-only endpoint", timestamp = DateTime.UtcNow });
        }

        /// <summary>
        /// An endpoint that requires instructor or admin role
        /// </summary>
        [Authorize(Policy = "AdminOrInstructor")]
        [HttpGet("instructor")]
        public IActionResult InstructorEndpoint()
        {
            return Ok(new { message = "This is an instructor/admin endpoint", timestamp = DateTime.UtcNow });
        }

        /// <summary>
        /// An endpoint that demonstrates role hierarchy
        /// </summary>
        [Authorize(Policy = "RequireStudentRole")]
        [HttpGet("student")]
        public IActionResult StudentEndpoint()
        {
            return Ok(new { message = "This is a student endpoint", timestamp = DateTime.UtcNow });
        }
    }
}