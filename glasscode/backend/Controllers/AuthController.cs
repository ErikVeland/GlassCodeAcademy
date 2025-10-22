using backend.Services.Auth;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly JwtValidationService _jwtValidationService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(JwtValidationService jwtValidationService, ILogger<AuthController> logger)
        {
            _jwtValidationService = jwtValidationService;
            _logger = logger;
        }

        /// <summary>
        /// Validates a JWT token
        /// </summary>
        /// <param name="token">The JWT token to validate</param>
        /// <returns>Validation result with user information if valid</returns>
        [HttpPost("validate")]
        public IActionResult ValidateToken([FromBody] ValidateTokenRequest request)
        {
            _logger.LogInformation("Token validation requested");

            if (string.IsNullOrEmpty(request.Token))
            {
                return BadRequest(new { error = "Token is required" });
            }

            var isValid = _jwtValidationService.ValidateToken(request.Token, out var principal);

            if (isValid && principal != null)
            {
                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var email = principal.FindFirst(ClaimTypes.Email)?.Value;
                var name = principal.FindFirst(ClaimTypes.Name)?.Value;

                _logger.LogInformation("Token validated successfully for user {UserId}", userId);

                return Ok(new
                {
                    valid = true,
                    user = new
                    {
                        id = userId,
                        email = email,
                        name = name
                    }
                });
            }

            _logger.LogWarning("Token validation failed");

            return Ok(new { valid = false });
        }

        /// <summary>
        /// Refreshes a JWT token
        /// </summary>
        /// <param name="request">The token refresh request</param>
        /// <returns>New JWT token if refresh is successful</returns>
        [HttpPost("refresh")]
        public IActionResult RefreshToken([FromBody] RefreshTokenRequest request)
        {
            _logger.LogInformation("Token refresh requested");

            if (string.IsNullOrEmpty(request.RefreshToken))
            {
                return BadRequest(new { error = "Refresh token is required" });
            }

            // In a real implementation, we would validate the refresh token against a database
            // For now, we'll just check if it's a valid JWT and generate a new one
            var isValid = _jwtValidationService.ValidateToken(request.RefreshToken, out var principal);

            if (isValid && principal != null)
            {
                // Extract user information from the refresh token
                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var email = principal.FindFirst(ClaimTypes.Email)?.Value;
                var name = principal.FindFirst(ClaimTypes.Name)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return BadRequest(new { error = "Invalid refresh token" });
                }

                // Create new claims for the access token
                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId),
                    new Claim(ClaimTypes.Email, email ?? ""),
                    new Claim(ClaimTypes.Name, name ?? ""),
                    new Claim(ClaimTypes.Role, "User")
                };

                // Generate new access token (expires in 1 hour)
                var accessToken = _jwtValidationService.GenerateToken(claims, DateTime.UtcNow.AddHours(1));

                _logger.LogInformation("Token refreshed successfully for user {UserId}", userId);

                return Ok(new
                {
                    accessToken = accessToken,
                    refreshToken = request.RefreshToken // In a real implementation, we might generate a new refresh token
                });
            }

            _logger.LogWarning("Token refresh failed - invalid refresh token");

            return BadRequest(new { error = "Invalid refresh token" });
        }

        /// <summary>
        /// Revokes a JWT token
        /// </summary>
        /// <param name="request">The token revocation request</param>
        /// <returns>Success status</returns>
        [HttpPost("revoke")]
        public IActionResult RevokeToken([FromBody] RevokeTokenRequest request)
        {
            _logger.LogInformation("Token revocation requested");

            if (string.IsNullOrEmpty(request.Token))
            {
                return BadRequest(new { error = "Token is required" });
            }

            // In a real implementation, we would add the token to a blacklist in the database
            // For now, we'll just log the revocation request
            var principal = _jwtValidationService.GetPrincipalFromToken(request.Token);
            if (principal != null)
            {
                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                _logger.LogInformation("Token revoked for user {UserId}", userId);
            }
            else
            {
                _logger.LogWarning("Token revocation requested for invalid token");
            }

            // Return success even if the token was invalid
            return Ok(new { success = true });
        }

        /// <summary>
        /// Gets information about a JWT token
        /// </summary>
        /// <param name="request">The token info request</param>
        /// <returns>Token information</returns>
        [HttpPost("info")]
        public IActionResult GetTokenInfo([FromBody] TokenInfoRequest request)
        {
            _logger.LogInformation("Token info requested");

            if (string.IsNullOrEmpty(request.Token))
            {
                return BadRequest(new { error = "Token is required" });
            }

            var principal = _jwtValidationService.GetPrincipalFromToken(request.Token);

            if (principal == null)
            {
                return Ok(new { valid = false });
            }

            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var email = principal.FindFirst(ClaimTypes.Email)?.Value;
            var name = principal.FindFirst(ClaimTypes.Name)?.Value;
            var roles = principal.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

            var isExpired = _jwtValidationService.IsTokenExpired(request.Token);

            _logger.LogInformation("Token info retrieved for user {UserId}", userId);

            return Ok(new
            {
                valid = true,
                expired = isExpired,
                user = new
                {
                    id = userId,
                    email = email,
                    name = name
                },
                roles = roles
            });
        }
    }

    public class ValidateTokenRequest
    {
        public string Token { get; set; } = string.Empty;
    }

    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class RevokeTokenRequest
    {
        public string Token { get; set; } = string.Empty;
    }

    public class TokenInfoRequest
    {
        public string Token { get; set; } = string.Empty;
    }
}