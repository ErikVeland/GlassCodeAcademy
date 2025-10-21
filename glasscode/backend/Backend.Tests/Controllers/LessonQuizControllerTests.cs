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
/// Integration tests for LessonQuizController API endpoints (database-first approach for quizzes)
/// </summary>
public class LessonQuizControllerTests : IntegrationTestBase
{
    public LessonQuizControllerTests(WebApplicationFactory<Program> factory, ITestOutputHelper output) 
        : base(factory, output)
    {
    }

    [Fact]
    public async Task GetLessonQuizzesFromDatabase_Should_Return_Success()
    {
        // Act
        var response = await Client.GetAsync("/api/LessonQuiz");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        
        var quizzes = JsonSerializer.Deserialize<LessonQuiz[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        quizzes.Should().NotBeNull();
        // Note: May be empty if no quizzes seeded in test environment
        
        Output.WriteLine($"Retrieved quizzes from database: {quizzes?.Length ?? 0} quizzes");
    }

    [Fact]
    public async Task GetLessonQuizzesFromDatabase_With_LessonId_Should_Return_Success()
    {
        // Act
        var response = await Client.GetAsync("/api/LessonQuiz?lessonId=1");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        
        Output.WriteLine($"Retrieved quizzes with lessonId=1: {content.Length} characters returned");
    }

    [Fact]
    public async Task GetLessonQuizByIdFromDatabase_Should_Return_Success()
    {
        // First, get a quiz ID to test with
        var listResponse = await Client.GetAsync("/api/LessonQuiz");
        if (listResponse.StatusCode == HttpStatusCode.OK)
        {
            var content = await listResponse.Content.ReadAsStringAsync();
            var quizzes = JsonSerializer.Deserialize<LessonQuiz[]>(content, new JsonSerializerOptions 
            { 
                PropertyNameCaseInsensitive = true 
            });
            
            if (quizzes != null && quizzes.Length > 0)
            {
                // Act - get specific quiz
                var detailResponse = await Client.GetAsync($"/api/LessonQuiz/{quizzes[0].Id}");

                // Assert
                detailResponse.StatusCode.Should().Be(HttpStatusCode.OK);
                
                var quizContent = await detailResponse.Content.ReadAsStringAsync();
                quizContent.Should().NotBeNullOrEmpty();
                
                Output.WriteLine($"Retrieved specific quiz by ID: {quizzes[0].Id}");
                return;
            }
        }
        
        // If no quizzes exist, test with a non-existent ID
        var notFoundResponse = await Client.GetAsync("/api/LessonQuiz/999999");
        notFoundResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        
        Output.WriteLine("No quizzes found in database, tested with non-existent ID");
    }

    [Fact]
    public async Task GetLessonQuizzesFromDatabase_Should_Return_Valid_JSON_Structure()
    {
        // Act
        var response = await Client.GetAsync("/api/LessonQuiz");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var quizzes = JsonSerializer.Deserialize<LessonQuiz[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        quizzes.Should().NotBeNull();
        // Note: May be empty if no quizzes seeded in test environment
        
        // If we have quizzes, validate structure of first quiz
        if (quizzes != null && quizzes.Length > 0)
        {
            var firstQuiz = quizzes[0];
            firstQuiz.Id.Should().BeGreaterThan(0);
            firstQuiz.Question.Should().NotBeNullOrEmpty();
            
            Output.WriteLine($"First quiz validation: ID={firstQuiz.Id}, Question length={firstQuiz.Question.Length}");
        }
        else
        {
            Output.WriteLine("No quizzes in database to validate structure");
        }
    }

    [Fact]
    public async Task GetLessonQuizzesFromDatabase_Should_Have_Correct_Content_Type()
    {
        // Act
        var response = await Client.GetAsync("/api/LessonQuiz");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
        
        Output.WriteLine($"Content-Type: {response.Content.Headers.ContentType}");
    }
}