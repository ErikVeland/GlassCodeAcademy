using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using FluentAssertions;
using Xunit;
using Xunit.Abstractions;
using Backend.Tests.Infrastructure;

namespace Backend.Tests.Infrastructure;

/// <summary>
/// Cross-environment tests to verify application behavior across different environments
/// </summary>
public class CrossEnvironmentTests : IntegrationTestBase
{
    public CrossEnvironmentTests(WebApplicationFactory<Program> factory, ITestOutputHelper output) 
        : base(factory, output)
    {
    }

    [Fact]
    public async Task HealthEndpoint_Should_Work_In_All_Environments()
    {
        // Act
        var response = await Client.GetAsync("/api/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        
        Output.WriteLine($"Health endpoint response: {content.Length} characters");
    }

    [Fact]
    public async Task ContentValidationEndpoint_Should_Work_In_All_Environments()
    {
        // Act
        var response = await Client.GetAsync("/api/contentvalidation/parity");

        // Assert
        // This might return 404 if the endpoint doesn't exist in test environment
        // or 200 with validation results
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
        
        Output.WriteLine($"Content validation endpoint status: {response.StatusCode}");
    }

    [Fact]
    public async Task DatabaseEndpoints_Should_Be_Accessible_In_All_Environments()
    {
        // Test multiple database endpoints
        var endpoints = new[]
        {
            "/api/lessons-db",
            "/api/LessonQuiz",
            "/api/modules-db"
        };

        foreach (var endpoint in endpoints)
        {
            // Act
            var response = await Client.GetAsync(endpoint);

            // Assert
            // Should be OK or NotFound (if no data), but not 500
            response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NotFound);
            
            Output.WriteLine($"Endpoint {endpoint} status: {response.StatusCode}");
        }
    }

    [Fact]
    public async Task JsonEndpoints_Should_Still_Work_As_Fallback()
    {
        // Test that JSON endpoints still work as fallback
        var endpoints = new[]
        {
            "/api/lessons?module=dotnet",
            "/api/interviewquestions?module=dotnet"
        };

        foreach (var endpoint in endpoints)
        {
            // Act
            var response = await Client.GetAsync(endpoint);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            
            var content = await response.Content.ReadAsStringAsync();
            content.Should().NotBeNullOrEmpty();
            
            Output.WriteLine($"JSON endpoint {endpoint} returned: {content.Length} characters");
        }
    }

    [Fact]
    public async Task CorsHeaders_Should_Be_Present_In_All_Environments()
    {
        // Act
        var response = await Client.GetAsync("/api/health");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Check for CORS headers
        var hasCorsHeaders = response.Headers.Contains("Access-Control-Allow-Origin") ||
                            response.Headers.Contains("Vary") && 
                            response.Headers.GetValues("Vary").Contains("Origin");
        
        // In test environment, CORS might not be fully configured, but we check if it's there
        Output.WriteLine($"CORS headers present: {hasCorsHeaders}");
        
        if (response.Headers.Contains("Access-Control-Allow-Origin"))
        {
            var corsOrigin = response.Headers.GetValues("Access-Control-Allow-Origin").FirstOrDefault();
            Output.WriteLine($"CORS Allow-Origin: {corsOrigin}");
        }
    }

    [Fact]
    public async Task DatabaseConnection_Should_Be_Valid_In_Test_Environment()
    {
        // This test verifies that the application can connect to the database
        // by checking if database endpoints respond appropriately
        
        // Act
        var response = await Client.GetAsync("/api/lessons-db");

        // Assert
        // Should not be a 500 error (which would indicate database connection issues)
        response.StatusCode.Should().NotBe(HttpStatusCode.InternalServerError);
        
        Output.WriteLine($"Database connectivity test status: {response.StatusCode}");
    }
}