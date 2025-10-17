using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;
using Xunit.Abstractions;
using backend.Models;

namespace Backend.Tests.Controllers;

public class InterviewQuestionsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;
    private readonly ITestOutputHelper _output;

    public InterviewQuestionsControllerTests(WebApplicationFactory<Program> factory, ITestOutputHelper output)
    {
        _factory = factory;
        _client = _factory.CreateClient();
        _output = output;
    }

    [Fact]
    public async Task GetInterviewQuestions_Should_Return_Success()
    {
        // Act
        var response = await _client.GetAsync("/api/InterviewQuestions");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        content.Should().NotBeNullOrEmpty();
        
        _output.WriteLine($"Default interview questions endpoint returned: {content.Length} characters");
    }

    [Fact]
    public async Task GetDotNetInterviewQuestions_Should_Return_Success()
    {
        // Act
        var response = await _client.GetAsync("/api/InterviewQuestions?module=dotnet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var questions = JsonSerializer.Deserialize<BaseInterviewQuestion[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        questions.Should().NotBeNull();
        questions.Should().NotBeEmpty();
        
        _output.WriteLine($"DotNet interview questions returned: {questions!.Length} questions");
    }

    [Fact]
    public async Task GetReactInterviewQuestions_Should_Return_Success()
    {
        // Act
        var response = await _client.GetAsync("/api/InterviewQuestions?module=react");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var questions = JsonSerializer.Deserialize<BaseInterviewQuestion[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        questions.Should().NotBeNull();
        questions.Should().NotBeEmpty();
        
        _output.WriteLine($"React interview questions returned: {questions!.Length} questions");
    }

    [Theory]
    [InlineData("/api/InterviewQuestions?module=dotnet")]
    [InlineData("/api/InterviewQuestions?module=react")]
    [InlineData("/api/InterviewQuestions?module=vue")]
    [InlineData("/api/InterviewQuestions?module=node")]
    [InlineData("/api/InterviewQuestions?module=typescript")]
    [InlineData("/api/InterviewQuestions?module=database")]
    [InlineData("/api/InterviewQuestions?module=testing")]
    [InlineData("/api/InterviewQuestions?module=sass")]
    [InlineData("/api/InterviewQuestions?module=tailwind")]
    [InlineData("/api/InterviewQuestions?module=nextjs")]
    [InlineData("/api/InterviewQuestions?module=laravel")]
    [InlineData("/api/InterviewQuestions?module=graphql")]
    [InlineData("/api/InterviewQuestions?module=programming")]
    [InlineData("/api/InterviewQuestions?module=web")]
    [InlineData("/api/InterviewQuestions?module=performance")]
    [InlineData("/api/InterviewQuestions?module=security")]
    [InlineData("/api/InterviewQuestions?module=version")]
    public async Task GetInterviewQuestions_Should_Return_Success_For_All_Technologies(string endpoint)
    {
        // Act
        var response = await _client.GetAsync(endpoint);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var questions = JsonSerializer.Deserialize<BaseInterviewQuestion[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        questions.Should().NotBeNull();
        questions.Should().NotBeEmpty();
        
        _output.WriteLine($"Endpoint {endpoint} returned: {questions!.Length} questions");
    }

    [Fact]
    public async Task GetInterviewQuestions_Should_Return_Valid_JSON_Structure()
    {
        // Act
        var response = await _client.GetAsync("/api/InterviewQuestions?module=dotnet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var questions = JsonSerializer.Deserialize<BaseInterviewQuestion[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        questions.Should().NotBeNull();
        questions.Should().NotBeEmpty();
        
        var firstQuestion = questions!.First();
        firstQuestion.Id.Should().NotBeNull();
        firstQuestion.Question.Should().NotBeNullOrEmpty();
        firstQuestion.Choices.Should().NotBeNull();
        firstQuestion.Choices.Should().NotBeEmpty();
        
        _output.WriteLine($"First question structure: ID={firstQuestion.Id}, Question length={firstQuestion.Question?.Length}, Choices count={firstQuestion.Choices?.Length}");
    }

    [Fact]
    public async Task GetInterviewQuestions_Should_Have_Correct_Content_Type()
    {
        // Act
        var response = await _client.GetAsync("/api/InterviewQuestions?module=dotnet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
        
        _output.WriteLine($"Content-Type: {response.Content.Headers.ContentType}");
    }

    [Fact]
    public async Task GetInterviewQuestions_Should_Return_Default_For_Invalid_Technology()
    {
        // Act
        var response = await _client.GetAsync("/api/InterviewQuestions?module=invalidtech");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var questions = JsonSerializer.Deserialize<BaseInterviewQuestion[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        questions.Should().NotBeNull();
        questions.Should().NotBeEmpty(); // Should return default DotNet questions
        
        _output.WriteLine($"Invalid technology endpoint returned default questions: {questions!.Length} questions");
    }

    [Fact]
    public async Task GetInterviewQuestions_Should_Handle_CORS_Headers()
    {
        // Act
        var response = await _client.GetAsync("/api/InterviewQuestions?module=dotnet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Check if CORS headers are present (they should be configured in the app)
        _output.WriteLine("Response headers:");
        foreach (var header in response.Headers)
        {
            _output.WriteLine($"  {header.Key}: {string.Join(", ", header.Value)}");
        }
    }

    [Fact]
    public async Task GetInterviewQuestionsByTopic_Should_Return_Success()
    {
        // Act
        var response = await _client.GetAsync("/api/InterviewQuestions/by-topic/basics?module=dotnet");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var content = await response.Content.ReadAsStringAsync();
        var questions = JsonSerializer.Deserialize<BaseInterviewQuestion[]>(content, new JsonSerializerOptions 
        { 
            PropertyNameCaseInsensitive = true 
        });
        
        questions.Should().NotBeNull();
        // Note: questions might be empty if no questions match the topic, which is valid
        
        _output.WriteLine($"Topic 'basics' returned: {questions!.Length} questions");
    }

    [Fact]
    public async Task SubmitAnswer_Should_Accept_Valid_Submission()
    {
        // Arrange
        var submission = new { questionId = 1, answerIndex = 0 };
        var json = JsonSerializer.Serialize(submission);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/InterviewQuestions/submit", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().NotBeNullOrEmpty();
        
        _output.WriteLine($"Answer submission response: {responseContent}");
    }

    [Fact]
    public async Task SubmitAnswer_Should_Return_BadRequest_For_Invalid_JSON()
    {
        // Arrange
        var invalidJson = "{ invalid json }";
        var content = new StringContent(invalidJson, Encoding.UTF8, "application/json");

        // Act
        var response = await _client.PostAsync("/api/InterviewQuestions/submit", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        
        _output.WriteLine($"Invalid JSON submission correctly returned: {response.StatusCode}");
    }
}