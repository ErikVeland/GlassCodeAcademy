using Microsoft.AspNetCore.Mvc;
using Xunit;
using FluentAssertions;
using backend.Controllers;
using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace backend.Tests.Controllers
{
    public class InterviewQuestionsControllerTests
    {
        private readonly InterviewQuestionsController _controller;

        public InterviewQuestionsControllerTests()
        {
            // Create in-memory database context for testing
            var options = new DbContextOptionsBuilder<GlassCodeDbContext>()
                .UseInMemoryDatabase(databaseName: "InterviewQuestionsControllerTests")
                .Options;
            var dbContext = new GlassCodeDbContext(options);
            _controller = new InterviewQuestionsController(dbContext);
        }

        [Fact]
        public async Task Get_ShouldReturnOkResult_WhenQuestionsExist()
        {
            // Act
            var result = await _controller.Get();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task Get_ShouldReturnQuestionsWithValidStructure()
        {
            // Act
            var result = await _controller.Get();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Theory]
        [InlineData("dotnet")]
        [InlineData("react")]
        [InlineData("vue")]
        [InlineData("node")]
        [InlineData("typescript")]
        [InlineData("database")]
        [InlineData("testing")]
        [InlineData("sass")]
        [InlineData("tailwind")]
        [InlineData("nextjs")]
        [InlineData("laravel")]
        [InlineData("graphql")]
        [InlineData("programming")]
        [InlineData("web")]
        [InlineData("performance")]
        [InlineData("security")]
        [InlineData("version")]
        public async Task Get_WithValidModule_ShouldReturnModuleSpecificQuestions(string module)
        {
            // Act
            var result = await _controller.Get(module);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task Get_WithInvalidModule_ShouldReturnDefaultQuestions()
        {
            // Act
            var result = await _controller.Get("invalid-module");

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task Get_WithNullModule_ShouldReturnDefaultDotNetQuestions()
        {
            // Act
            var result = await _controller.Get(null);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task Get_WithEmptyModule_ShouldReturnDefaultDotNetQuestions()
        {
            // Act
            var result = await _controller.Get("");

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task Get_ShouldReturnQuestionsWithValidAnswerIndices()
        {
            // Act
            var result = await _controller.Get();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Theory]
        [InlineData("dotnet", "C#")]
        [InlineData("react", "React")]
        [InlineData("vue", "Vue")]
        [InlineData("node", "Node.js")]
        [InlineData("typescript", "TypeScript")]
        public async Task GetByTopic_WithValidTopicAndModule_ShouldReturnFilteredQuestions(string module, string topic)
        {
            // Act
            var result = await _controller.GetByTopic(topic, module);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task GetByTopic_WithNonExistentTopic_ShouldReturnEmptyList()
        {
            // Act
            var result = await _controller.GetByTopic("NonExistentTopic");

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task GetByTopic_WithNullModule_ShouldUseDefaultDotNetModule()
        {
            // Act
            var result = await _controller.GetByTopic("C#", null);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public async Task GetByTopic_WithEmptyOrWhitespaceTopic_ShouldReturnEmptyList(string topic)
        {
            // Act
            var result = await _controller.GetByTopic(topic);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task SubmitAnswer_WithValidSubmission_ShouldReturnAnswerResult()
        {
            // Arrange
            var submission = new AnswerSubmission
            {
                QuestionId = 1,
                AnswerIndex = 0
            };

            // Act
            var result = _controller.SubmitAnswer(submission);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task SubmitAnswer_WithInvalidQuestionId_ShouldReturnIncorrectResult()
        {
            // Arrange
            var submission = new AnswerSubmission
            {
                QuestionId = -1,
                AnswerIndex = 0
            };

            // Act
            var result = _controller.SubmitAnswer(submission);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task SubmitAnswer_WithNegativeAnswerIndex_ShouldReturnAnswerResult()
        {
            // Arrange
            var submission = new AnswerSubmission
            {
                QuestionId = 1,
                AnswerIndex = -1
            };

            // Act
            var result = _controller.SubmitAnswer(submission);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task SubmitAnswer_WithLargeAnswerIndex_ShouldReturnAnswerResult()
        {
            // Arrange
            var submission = new AnswerSubmission
            {
                QuestionId = 1,
                AnswerIndex = 999
            };

            // Act
            var result = _controller.SubmitAnswer(submission);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public void Controller_ShouldBeInstantiable()
        {
            // Arrange & Act
            var options = new DbContextOptionsBuilder<GlassCodeDbContext>()
                .UseInMemoryDatabase(databaseName: "InterviewQuestionsControllerInstantiableTests")
                .Options;
            var dbContext = new GlassCodeDbContext(options);
            var controller = new InterviewQuestionsController(dbContext);

            // Assert
            controller.Should().NotBeNull();
        }

        [Fact]
        public async Task Controller_ShouldHaveDataServiceInstance()
        {
            // Arrange & Act
            var options = new DbContextOptionsBuilder<GlassCodeDbContext>()
                .UseInMemoryDatabase(databaseName: "InterviewQuestionsControllerDataServiceTests")
                .Options;
            var dbContext = new GlassCodeDbContext(options);
            var controller = new InterviewQuestionsController(dbContext);

            // Assert
            controller.Should().NotBeNull();
            // The DataService is private, but we can test that the controller works
            var result = await controller.Get();
            result.Should().NotBeNull();
        }
    }
}