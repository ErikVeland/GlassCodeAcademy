using backend.Middleware;
using Microsoft.AspNetCore.Builder;

namespace backend.Extensions
{
    public static class JwtAuthenticationExtensions
    {
        public static IApplicationBuilder UseJwtAuthentication(
            this IApplicationBuilder builder,
            string issuer,
            string audience,
            string secretKey)
        {
            return builder.UseMiddleware<JwtAuthenticationMiddleware>(issuer, audience, secretKey);
        }

        public static IApplicationBuilder UseRoleBasedAuthorization(
            this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RoleBasedAuthorizationMiddleware>();
        }
    }
}