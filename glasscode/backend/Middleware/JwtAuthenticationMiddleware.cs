using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Http;
using Serilog;

namespace backend.Middleware
{
    public class JwtAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string _issuer;
        private readonly string _audience;
        private readonly string _secretKey;

        public JwtAuthenticationMiddleware(RequestDelegate next, string issuer, string audience, string secretKey)
        {
            _next = next;
            _issuer = issuer;
            _audience = audience;
            _secretKey = secretKey;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Extract token from Authorization header
            var token = ExtractTokenFromHeader(context);

            if (!string.IsNullOrEmpty(token))
            {
                var principal = ValidateToken(token);
                if (principal != null)
                {
                    // Attach the user principal to the context
                    context.User = principal;
                    Log.Information("JWT token validated for user {UserId}", GetUserIdFromPrincipal(principal));
                }
                else
                {
                    Log.Warning("Invalid JWT token provided for request {Method} {Path}", context.Request.Method, context.Request.Path);
                }
            }

            // Continue with the next middleware
            await _next(context);
        }

        private string? ExtractTokenFromHeader(HttpContext context)
        {
            var authHeader = context.Request.Headers.Authorization.ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return null;
            }

            return authHeader.Substring("Bearer ".Length).Trim();
        }

        private ClaimsPrincipal? ValidateToken(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            
            try
            {
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = _issuer,
                    ValidAudience = _audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey)),
                    ClockSkew = TimeSpan.Zero // Remove default 5-minute clock skew
                };

                return tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
            }
            catch (SecurityTokenExpiredException)
            {
                Log.Warning("JWT token has expired");
                return null;
            }
            catch (SecurityTokenInvalidSignatureException)
            {
                Log.Warning("JWT token has invalid signature");
                return null;
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Error validating JWT token");
                return null;
            }
        }

        private string GetUserIdFromPrincipal(ClaimsPrincipal principal)
        {
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier);
            return userIdClaim?.Value ?? "unknown";
        }
    }
}