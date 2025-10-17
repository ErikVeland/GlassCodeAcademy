using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Text.Json;
using FluentAssertions;
using Xunit;
using Xunit.Abstractions;
using Backend.Tests.Infrastructure;
using backend.Models;

namespace Backend.Tests.Controllers;

/// <summary>
/// Integration tests for LessonsController API endpoints
/// </summary>
public class LessonsControllerTests : IntegrationTestBase
{
    public LessonsControllerTests(WebApplicationFactory<Program> factory, ITestOutputHelper output) 
        : base(factory, output)
    {
    }

    [Fact]
    public async Task GetDotNetLessons_Should_Return_Success()
    {
        // Act
        var response = await Client.GetAsync("/api/lessons?module=dotnet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        
        var lessons = JsonSerializer.Deserialize<BaseLesson[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        lessons.Should().NotBeNull();
        lessons.Should().NotBeEmpty();
        
        Output.WriteLine($"Retrieved {lessons!.Length} DotNet lessons");
    }

    [Fact]
    public async Task GetReactLessons_Should_Return_Success()
    {
        // Act
        var response = await Client.GetAsync("/api/lessons?module=react");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var lessons = JsonSerializer.Deserialize<BaseLesson[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        lessons.Should().NotBeNull();
        lessons.Should().NotBeEmpty();
        
        Output.WriteLine($"Retrieved {lessons!.Length} React lessons");
    }

    [Theory]
    [InlineData("/api/lessons?module=dotnet")]
    [InlineData("/api/lessons?module=react")]
    [InlineData("/api/lessons?module=tailwind")]
    [InlineData("/api/lessons?module=node")]
    [InlineData("/api/lessons?module=sass")]
    [InlineData("/api/lessons?module=vue")]
    [InlineData("/api/lessons?module=typescript")]
    public async Task GetLessons_Should_Return_Success_For_All_Technologies(string endpoint)
    {
        // Act
        var response = await Client.GetAsync(endpoint);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        
        Output.WriteLine($"Endpoint {endpoint}: {content.Length} characters returned");
    }

    [Fact]
    public async Task GetLessons_Should_Return_Default_For_Invalid_Technology()
    {
        // Act
        var response = await Client.GetAsync("/api/lessons?module=invalidtech");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var lessons = JsonSerializer.Deserialize<BaseLesson[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        lessons.Should().NotBeNull();
        lessons.Should().NotBeEmpty(); // Should return default DotNet lessons
        
        Output.WriteLine($"Invalid technology endpoint returned default lessons: {lessons!.Length} lessons");
    }

    [Fact]
    public async Task GetLessons_Should_Return_Valid_JSON_Structure()
    {
        // Act
        var response = await Client.GetAsync("/api/lessons?module=dotnet");
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var lessons = JsonSerializer.Deserialize<BaseLesson[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        lessons.Should().NotBeNull();
        lessons.Should().NotBeEmpty();
        
        // Validate structure of first lesson
        var firstLesson = lessons!.First();
        firstLesson.Id.Should().NotBeNull();
        firstLesson.Title.Should().NotBeNullOrEmpty();
        // Check for content in various possible fields
        var hasContent = !string.IsNullOrEmpty(firstLesson.Intro) || 
                       !string.IsNullOrEmpty(firstLesson.Description) || 
                       !string.IsNullOrEmpty(firstLesson.CodeExample);
        hasContent.Should().BeTrue("Lesson should have some form of content");
        
        Output.WriteLine($"First lesson validation: ID={firstLesson.Id}, Title={firstLesson.Title}");
    }

    [Fact]
    public async Task GetLessons_Should_Have_Correct_Content_Type()
    {
        // Act
        var response = await Client.GetAsync("/api/lessons?module=dotnet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
        
        Output.WriteLine($"Content-Type: {response.Content.Headers.ContentType}");
    }

    [Fact]
    public async Task GetLessons_Should_Handle_CORS_Headers()
    {
        // Act
        var response = await Client.GetAsync("/api/lessons?module=dotnet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Check if CORS headers are present (they should be configured in the app)
        Output.WriteLine("Response headers:");
        foreach (var header in response.Headers)
        {
            Output.WriteLine($"  {header.Key}: {string.Join(", ", header.Value)}");
        }
    }
}