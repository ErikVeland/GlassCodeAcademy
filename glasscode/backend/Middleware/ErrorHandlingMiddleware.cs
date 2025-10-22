using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.WebUtilities;
using Serilog;
using System.Collections.Generic;
using System.Linq;

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
            // Generate or retrieve correlation ID
            var correlationId = GetOrCreateCorrelationId(context);

            // Add correlation ID to response headers
            context.Response.Headers.Append("X-Correlation-ID", correlationId);

            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Unhandled exception during {Method} {Path} [CorrelationId: {CorrelationId}]",
                    context.Request.Method, context.Request.Path, correlationId);

                await HandleExceptionAsync(context, ex, correlationId);
            }
        }

        private string GetOrCreateCorrelationId(HttpContext context)
        {
            // Check if correlation ID is already provided in request headers
            if (context.Request.Headers.TryGetValue("X-Correlation-ID", out var correlationId))
            {
                return correlationId.ToString();
            }

            // Generate new correlation ID
            return Guid.NewGuid().ToString();
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception, string correlationId)
        {
            context.Response.ContentType = "application/json";

            var response = new ProblemDetailsResponse
            {
                Title = "An unexpected error occurred",
                Status = StatusCodes.Status500InternalServerError,
                Detail = "An unexpected error occurred while processing your request.",
                TraceId = context.TraceIdentifier,
                CorrelationId = correlationId,
                Timestamp = DateTime.UtcNow,
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1"
            };

            // Categorize the error and set appropriate status code
            if (exception is UnauthorizedAccessException)
            {
                response.Status = StatusCodes.Status401Unauthorized;
                response.Title = "Unauthorized";
                response.Detail = "Access to the requested resource requires authentication.";
                response.Type = "https://tools.ietf.org/html/rfc7235#section-3.1";
            }
            else if (exception is ArgumentException || exception is ArgumentNullException)
            {
                response.Status = StatusCodes.Status400BadRequest;
                response.Title = "Bad Request";
                response.Detail = "The request contains invalid or missing parameters.";
                response.Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1";
            }
            else if (exception is KeyNotFoundException)
            {
                response.Status = StatusCodes.Status404NotFound;
                response.Title = "Not Found";
                response.Detail = "The requested resource was not found.";
                response.Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4";
            }
            else if (exception is InvalidOperationException)
            {
                response.Status = StatusCodes.Status400BadRequest;
                response.Title = "Invalid Operation";
                response.Detail = "The requested operation is invalid.";
                response.Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1";
            }
            else
            {
                // Log the full exception details for internal errors
                Log.Error(exception, "Unhandled exception [CorrelationId: {CorrelationId}]", correlationId);
            }

            context.Response.StatusCode = response.Status;

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }

    public class ProblemDetailsResponse
    {
        public string Title { get; set; } = string.Empty;
        public int Status { get; set; }
        public string Detail { get; set; } = string.Empty;
        public string TraceId { get; set; } = string.Empty;
        public string CorrelationId { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string Type { get; set; } = string.Empty;
        public Dictionary<string, object> Extensions { get; set; } = new Dictionary<string, object>();
    }
}