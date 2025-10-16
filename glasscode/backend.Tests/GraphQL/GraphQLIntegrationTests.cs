using FluentAssertions;
using HotChocolate.Execution;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Text;
using System.Text.Json;
using Xunit;

namespace backend.Tests.GraphQL;

public class GraphQLIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public GraphQLIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task GraphQL_Schema_ShouldBeValid()
    {
        // Arrange
        var introspectionQuery = @"
        {
            __schema {
                queryType {
                    name
                    fields {
                        name
                        type {
                            name
                        }
                    }
                }
                mutationType {
                    name
                    fields {
                        name
                        type {
                            name
                        }
                    }
                }
            }
        }";

        var request = new
        {
            query = introspectionQuery
        };

        // Act
        var response = await PostGraphQLQuery(request);

        // Assert
        response.Should().NotBeNull();
        response.Should().Contain("queryType");
        response.Should().Contain("mutationType");
    }

    [Fact]
    public async Task DotNetLessons_Query_ShouldReturnData()
    {
        // Arrange
        var query = @"
        {
            dotNetLessons {
                id
                title
                description
                topic
                codeExample
            }
        }";

        var request = new { query };

        // Act
        var response = await PostGraphQLQuery(request);

        // Assert
        response.Should().NotBeNull();
        response.Should().Contain("dotNetLessons");
        response.Should().Contain("id");
        response.Should().Contain("title");
    }

    [Fact]
    public async Task DotNetInterviewQuestions_Query_ShouldReturnData()
    {
        // Arrange
        var query = @"
        {
            dotNetInterviewQuestions {
                id
                topic
                question
                choices
                correctAnswer
            }
        }";

        var request = new { query };

        // Act
        var response = await PostGraphQLQuery(request);

        // Assert
        response.Should().NotBeNull();
        response.Should().Contain("dotNetInterviewQuestions");
        response.Should().Contain("id");
        response.Should().Contain("question");
    }

    [Fact]
    public async Task ReactLessons_Query_ShouldReturnData()
    {
        // Arrange
        var query = @"
        {
            reactLessons {
                id
                title
                intro
                difficulty
                estimatedMinutes
            }
        }";

        var request = new { query };

        // Act
        var response = await PostGraphQLQuery(request);

        // Assert
        response.Should().NotBeNull();
        response.Should().Contain("reactLessons");
        response.Should().Contain("id");
        response.Should().Contain("title");
    }

    [Fact]
    public async Task ReactInterviewQuestions_Query_ShouldReturnData()
    {
        // Arrange
        var query = @"
        {
            reactInterviewQuestions {
                id
                topic
                question
                choices
                correctAnswer
            }
        }";

        var request = new { query };

        // Act
        var response = await PostGraphQLQuery(request);

        // Assert
        response.Should().NotBeNull();
        response.Should().Contain("reactInterviewQuestions");
        response.Should().Contain("id");
        response.Should().Contain("question");
    }

    [Theory]
    [InlineData("1", 0)]
    [InlineData("2", 1)]
    public async Task SubmitAnswer_Mutation_ShouldReturnValidation(string questionId, int answerIndex)
    {
        // Arrange
        var mutation = @"
        mutation($questionId: String!, $answerIndex: Int!) {
            submitAnswer(questionId: $questionId, answerIndex: $answerIndex) {
                isCorrect
                explanation
            }
        }";

        var request = new
        {
            query = mutation,
            variables = new { questionId, answerIndex }
        };

        // Act
        var response = await PostGraphQLQuery(request);

        // Assert
        response.Should().NotBeNull();
        response.Should().Contain("submitAnswer");
        response.Should().Contain("isCorrect");
        response.Should().Contain("explanation");
    }

    [Theory]
    [InlineData("1", 0)]
    [InlineData("2", 1)]
    public async Task SubmitDotNetAnswer_Mutation_ShouldReturnValidation(string questionId, int answerIndex)
    {
        // Arrange
        var mutation = @"
        mutation($questionId: String!, $answerIndex: Int!) {
            submitAnswer(questionId: $questionId, answerIndex: $answerIndex) {
                isCorrect
                explanation
            }
        }";

        var request = new
        {
            query = mutation,
            variables = new { questionId, answerIndex }
        };

        // Act
        var response = await PostGraphQLQuery(request);

        // Assert
        response.Should().NotBeNull();
        response.Should().Contain("submitAnswer");
        response.Should().Contain("isCorrect");
        response.Should().Contain("explanation");
    }

    [Theory]
    [InlineData("1", 0)]
    [InlineData("2", 1)]
    public async Task SubmitReactAnswer_Mutation_ShouldReturnValidation(string questionId, int answerIndex)
    {
        // Arrange
        var mutation = @"
        mutation($questionId: String!, $answerIndex: Int!) {
            submitReactAnswer(questionId: $questionId, answerIndex: $answerIndex) {
                isCorrect
                explanation
            }
        }";

        var request = new
        {
            query = mutation,
            variables = new { questionId, answerIndex }
        };

        // Act
        var response = await PostGraphQLQuery(request);

        // Assert
        response.Should().NotBeNull();
        response.Should().Contain("submitReactAnswer");
        response.Should().Contain("isCorrect");
        response.Should().Contain("explanation");
    }

    [Fact]
    public async Task TrackProgress_Mutation_ShouldAcceptData()
    {
        // Arrange
        var mutation = @"
        mutation($userId: Int!, $lessonId: Int!, $module: String!) {
            trackProgress(userId: $userId, lessonId: $lessonId, module: $module) {
                userId
                lessonId
                moduleSlug
                status
            }
        }";

        var request = new
        {
            query = mutation,
            variables = new { userId = 1, lessonId = 1, module = "react" }
        };

        // Act
        var response = await PostGraphQLQuery(request);

        // Assert
        response.Should().NotBeNull();
        response.Should().Contain("trackProgress");
    }

    [Fact]
    public async Task AllTechnologyLessons_Queries_ShouldReturnData()
    {
        // Arrange
        var query = @"
        {
            laravelLessons { id title }
            nodeLessons { id title }
            tailwindLessons { id title }
            sassLessons { id title }
            vueLessons { id title }
            nextJsLessons { id title }
            programmingLessons { id title }
            versionLessons { id title }
        }";

        var request = new { query };

        // Act
        var response = await PostGraphQLQuery(request);

        // Assert
        response.Should().NotBeNull();
        response.Should().Contain("laravelLessons");
        response.Should().Contain("nodeLessons");
        response.Should().Contain("tailwindLessons");
        response.Should().Contain("sassLessons");
        response.Should().Contain("vueLessons");
        response.Should().Contain("nextJsLessons");
        response.Should().Contain("programmingLessons");
        response.Should().Contain("versionLessons");
    }

    [Fact]
    public async Task AllTechnologyInterviewQuestions_Queries_ShouldReturnData()
    {
        // Arrange
        var query = @"
        {
            laravelInterviewQuestions { id question }
            nodeInterviewQuestions { id question }
            tailwindInterviewQuestions { id question }
            sassInterviewQuestions { id question }
            vueInterviewQuestions { id question }
            nextJsInterviewQuestions { id question }
            programmingInterviewQuestions { id question }
            versionInterviewQuestions { id question }
        }";

        var request = new { query };

        // Act
        var response = await PostGraphQLQuery(request);

        // Assert
        response.Should().NotBeNull();
        response.Should().Contain("laravelInterviewQuestions");
        response.Should().Contain("nodeInterviewQuestions");
        response.Should().Contain("tailwindInterviewQuestions");
        response.Should().Contain("sassInterviewQuestions");
        response.Should().Contain("vueInterviewQuestions");
        response.Should().Contain("nextJsInterviewQuestions");
        response.Should().Contain("programmingInterviewQuestions");
        response.Should().Contain("versionInterviewQuestions");
    }

    private async Task<string> PostGraphQLQuery(object request)
    {
        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _client.PostAsync("/graphql", content);
        
        var responseContent = await response.Content.ReadAsStringAsync();
        
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"GraphQL request failed with status {response.StatusCode}. Response: {responseContent}");
        }
        
        return responseContent;
    }
}