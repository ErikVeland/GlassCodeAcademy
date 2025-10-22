using Microsoft.AspNetCore.Http;
using Serilog;
using System.Security.Claims;

namespace backend.Middleware
{
    public class RoleBasedAuthorizationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RoleBasedAuthorizationMiddleware> _logger;

        public RoleBasedAuthorizationMiddleware(RequestDelegate next, ILogger<RoleBasedAuthorizationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Check if the request requires role-based authorization
            var requiredRole = GetRequiredRole(context);

            if (!string.IsNullOrEmpty(requiredRole))
            {
                // Check if user is authenticated
                if (!context.User.Identity.IsAuthenticated)
                {
                    _logger.LogWarning("Unauthorized access attempt to {Path} - User not authenticated", context.Request.Path);
                    await ReturnUnauthorizedResponse(context, "Authentication required");
                    return;
                }

                // Check if user has the required role
                if (!HasRequiredRole(context.User, requiredRole))
                {
                    _logger.LogWarning("Forbidden access attempt to {Path} - User lacks required role {Role}",
                        context.Request.Path, requiredRole);
                    await ReturnForbiddenResponse(context, $"Access denied. Required role: {requiredRole}");
                    return;
                }

                _logger.LogInformation("Authorized access to {Path} for user {UserId} with role {Role}",
                    context.Request.Path,
                    context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "unknown",
                    requiredRole ?? "none");
            }

            // Continue with the next middleware
            await _next(context);
        }

        private string? GetRequiredRole(HttpContext context)
        {
            // This is a simplified implementation. In a real application, you might:
            // 1. Check route-based role requirements
            // 2. Check custom attributes on controllers/actions
            // 3. Check configuration-based role mappings

            var path = context.Request.Path.Value?.ToLowerInvariant();

            // Example role requirements based on path prefixes
            if (path != null)
            {
                if (path.StartsWith("/api/admin"))
                    return "Admin";

                if (path.StartsWith("/api/instructor"))
                    return "Instructor";

                if (path.StartsWith("/api/student"))
                    return "Student";
            }

            return null;
        }

        private bool HasRequiredRole(ClaimsPrincipal user, string requiredRole)
        {
            // Direct role check
            if (user.IsInRole(requiredRole))
                return true;

            // Role hierarchy check
            return IsRoleInHierarchy(user, requiredRole);
        }

        private bool IsRoleInHierarchy(ClaimsPrincipal user, string requiredRole)
        {
            // Define role hierarchy
            var roleHierarchy = new Dictionary<string, string[]>
            {
                { "Admin", new[] { "Instructor", "Student" } },
                { "Instructor", new[] { "Student" } },
                { "Student", Array.Empty<string>() }
            };

            if (!roleHierarchy.ContainsKey(requiredRole))
                return false;

            // Check if user has any role in the hierarchy
            var userRoles = user.FindAll(ClaimTypes.Role).Select(c => c.Value);
            var allowedRoles = roleHierarchy[requiredRole].Concat(new[] { requiredRole });

            return userRoles.Any(role => allowedRoles.Contains(role));
        }

        private async Task ReturnUnauthorizedResponse(HttpContext context, string message)
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            context.Response.ContentType = "application/json";

            var response = new
            {
                error = "Unauthorized",
                message = message,
                timestamp = DateTime.UtcNow
            };

            await context.Response.WriteAsJsonAsync(response);
        }

        private async Task ReturnForbiddenResponse(HttpContext context, string message)
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.ContentType = "application/json";

            var response = new
            {
                error = "Forbidden",
                message = message,
                timestamp = DateTime.UtcNow
            };

            await context.Response.WriteAsJsonAsync(response);
        }
    }
}