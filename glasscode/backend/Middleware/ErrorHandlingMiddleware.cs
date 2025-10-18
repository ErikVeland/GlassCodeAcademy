using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Serilog;

namespace backend.Middleware
{
    public class ErrorHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public ErrorHandlingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Unhandled exception during {Method} {Path}", context.Request.Method, context.Request.Path);

                context.Response.ContentType = "application/json";
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;

                var payload = new
                {
                    title = "An unexpected error occurred",
                    status = 500,
                    traceId = context.TraceIdentifier
                };

                var json = JsonSerializer.Serialize(payload);
                await context.Response.WriteAsync(json);
            }
        }
    }
}