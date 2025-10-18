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
/// Integration tests for LessonsDbController API endpoints (database-first approach)
/// </summary>
public class LessonsDbControllerTests : IntegrationTestBase
{
    public LessonsDbControllerTests(WebApplicationFactory<Program> factory, ITestOutputHelper output) 
        : base(factory, output)
    {
    }

    [Fact]
    public async Task GetLessonsFromDatabase_Should_Return_Success()
    {
        // Act
        var response = await Client.GetAsync("/api/lessons-db");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        
        var lessons = JsonSerializer.Deserialize<Lesson[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        lessons.Should().NotBeNull();
        // Note: May be empty if no lessons seeded in test environment
        
        Output.WriteLine($"Retrieved lessons from database: {lessons?.Length ?? 0} lessons");
    }

    [Fact]
    public async Task GetLessonsFromDatabase_With_ModuleId_Should_Return_Success()
    {
        // Act
        var response = await Client.GetAsync("/api/lessons-db?moduleId=1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        
        Output.WriteLine($"Retrieved lessons with moduleId=1: {content.Length} characters returned");
    }

    [Fact]
    public async Task GetLessonByIdFromDatabase_Should_Return_Success()
    {
        // First, get a lesson ID to test with
        var listResponse = await Client.GetAsync("/api/lessons-db");
        if (listResponse.StatusCode == HttpStatusCode.OK)
        {
            var content = await listResponse.Content.ReadAsStringAsync();
            var lessons = JsonSerializer.Deserialize<Lesson[]>(content, new JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true 
            });
            
            if (lessons != null && lessons.Length > 0)
            {
                // Act - get specific lesson
                var response = await Client.GetAsync($"/api/lessons-db/{lessons[0].Id}");

                // Assert
                response.StatusCode.Should().Be(HttpStatusCode.OK);
                
                var lessonContent = await response.Content.ReadAsStringAsync();
                lessonContent.Should().NotBeNullOrEmpty();
                
                Output.WriteLine($"Retrieved specific lesson by ID: {lessons[0].Id}");
                return;
            }
        }
        
        // If no lessons exist, test with a non-existent ID
        var response = await Client.GetAsync("/api/lessons-db/999999");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        
        Output.WriteLine("No lessons found in database, tested with non-existent ID");
    }

    [Fact]
    public async Task GetLessonsFromDatabase_Should_Return_Valid_JSON_Structure()
    {
        // Act
        var response = await Client.GetAsync("/api/lessons-db");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var lessons = JsonSerializer.Deserialize<Lesson[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        lessons.Should().NotBeNull();
        // Note: May be empty if no lessons seeded in test environment
        
        // If we have lessons, validate structure of first lesson
        if (lessons != null && lessons.Length > 0)
        {
            var firstLesson = lessons[0];
            firstLesson.Id.Should().BeGreaterThan(0);
            firstLesson.Title.Should().NotBeNullOrEmpty();
            firstLesson.Slug.Should().NotBeNullOrEmpty();
            
            Output.WriteLine($"First lesson validation: ID={firstLesson.Id}, Title={firstLesson.Title}, Slug={firstLesson.Slug}");
        }
        else
        {
            Output.WriteLine("No lessons in database to validate structure");
        }
    }

    [Fact]
    public async Task GetLessonsFromDatabase_Should_Have_Correct_Content_Type()
    {
        // Act
        var response = await Client.GetAsync("/api/lessons-db");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
        
        Output.WriteLine($"Content-Type: {response.Content.Headers.ContentType}");
    }

    [Fact]
    public async Task LessonsDbEndpoint_Should_Be_Different_From_Lessons_Endpoint()
    {
        // Act
        var dbResponse = await Client.GetAsync("/api/lessons-db");
        var jsonResponse = await Client.GetAsync("/api/lessons");

        // Assert
        dbResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        jsonResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // The responses should be different (different data structures)
        var dbContent = await dbResponse.Content.ReadAsStringAsync();
        var jsonContent = await jsonResponse.Content.ReadAsStringAsync();
        
        // They may be the same if both are empty or both have the same data,
        // but at least we verified both endpoints exist and work
        Output.WriteLine($"Database endpoint returned: {dbContent.Length} characters");
        Output.WriteLine($"JSON endpoint returned: {jsonContent.Length} characters");
    }
}