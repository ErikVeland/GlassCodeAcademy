using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Services.Auth
{
    public class RoleAuthorizationHandler : AuthorizationHandler<RoleRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, RoleRequirement requirement)
        {
            if (context.User?.Identity?.IsAuthenticated != true)
            {
                return Task.CompletedTask;
            }

            // Check if user has the required role
            if (context.User.IsInRole(requirement.Role))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            // Check for role hierarchy
            if (IsRoleInHierarchy(context.User, requirement.Role))
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
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
            {
                return false;
            }

            // Check if user has any role in the hierarchy
            var userRoles = user.FindAll(ClaimTypes.Role).Select(c => c.Value);
            var allowedRoles = roleHierarchy[requiredRole].Concat(new[] { requiredRole });

            return userRoles.Any(role => allowedRoles.Contains(role));
        }
    }

    public class RoleRequirement : IAuthorizationRequirement
    {
        public string Role { get; }

        public RoleRequirement(string role)
        {
            Role = role;
        }
    }
}