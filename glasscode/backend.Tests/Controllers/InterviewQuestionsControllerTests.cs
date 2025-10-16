using Microsoft.AspNetCore.Mvc;
using Xunit;
using FluentAssertions;
using backend.Controllers;
using backend.Models;

namespace backend.Tests.Controllers
{
    public class InterviewQuestionsControllerTests
    {
        private readonly InterviewQuestionsController _controller;

        public InterviewQuestionsControllerTests()
        {
            _controller = new InterviewQuestionsController();
        }

        [Fact]
        public void Get_ShouldReturnOkResult_WhenQuestionsExist()
        {
            // Act
            var result = _controller.Get();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeAssignableTo<IEnumerable<BaseInterviewQuestion>>();
            var questions = okResult.Value as IEnumerable<BaseInterviewQuestion>;
            questions.Should().NotBeEmpty();
        }

        [Fact]
        public void Get_ShouldReturnQuestionsWithValidStructure()
        {
            // Act
            var result = _controller.Get();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var questions = okResult!.Value as IEnumerable<BaseInterviewQuestion>;
            
            foreach (var question in questions!)
            {
                question.Id.Should().NotBeNull();
                question.Question.Should().NotBeNullOrEmpty();
                question.Topic.Should().NotBeNullOrEmpty();
                question.Type.Should().NotBeNullOrEmpty();
                question.Choices.Should().NotBeNull();
                question.Choices.Should().NotBeEmpty();
            }
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
        public void Get_WithValidModule_ShouldReturnModuleSpecificQuestions(string module)
        {
            // Act
            var result = _controller.Get(module);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var questions = okResult!.Value as IEnumerable<BaseInterviewQuestion>;
            questions.Should().NotBeEmpty();
        }

        [Fact]
        public void Get_WithInvalidModule_ShouldReturnDefaultQuestions()
        {
            // Act
            var result = _controller.Get("invalid-module");

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var questions = okResult!.Value as IEnumerable<BaseInterviewQuestion>;
            questions.Should().NotBeEmpty();
        }

        [Fact]
        public void Get_WithNullModule_ShouldReturnDefaultDotNetQuestions()
        {
            // Act
            var result = _controller.Get(null);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var questions = okResult!.Value as IEnumerable<BaseInterviewQuestion>;
            questions.Should().NotBeEmpty();
        }

        [Fact]
        public void Get_WithEmptyModule_ShouldReturnDefaultDotNetQuestions()
        {
            // Act
            var result = _controller.Get("");

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var questions = okResult!.Value as IEnumerable<BaseInterviewQuestion>;
            questions.Should().NotBeEmpty();
        }

        [Fact]
        public void Get_ShouldReturnQuestionsWithValidAnswerIndices()
        {
            // Act
            var result = _controller.Get();
            var okResult = result.Result as OkObjectResult;
            var questions = okResult!.Value as IEnumerable<BaseInterviewQuestion>;

            // Assert
            foreach (var question in questions!)
            {
                if (question.CorrectAnswer.HasValue && question.Choices != null)
                {
                    question.CorrectAnswer.Should().BeInRange(0, question.Choices.Length - 1);
                }
            }
        }

        [Theory]
        [InlineData("dotnet", "C#")]
        [InlineData("react", "React")]
        [InlineData("vue", "Vue")]
        [InlineData("node", "Node.js")]
        [InlineData("typescript", "TypeScript")]
        public void GetByTopic_WithValidTopicAndModule_ShouldReturnFilteredQuestions(string module, string topic)
        {
            // Act
            var result = _controller.GetByTopic(topic, module);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var questions = okResult!.Value as IEnumerable<BaseInterviewQuestion>;
            questions.Should().NotBeNull();
            
            // All returned questions should have the specified topic (case-insensitive)
            foreach (var question in questions!)
            {
                question.Topic.Should().NotBeNull();
                question.Topic!.ToLower().Should().Contain(topic.ToLower());
            }
        }

        [Fact]
        public void GetByTopic_WithNonExistentTopic_ShouldReturnEmptyList()
        {
            // Act
            var result = _controller.GetByTopic("NonExistentTopic");

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var questions = okResult!.Value as IEnumerable<BaseInterviewQuestion>;
            questions.Should().NotBeNull();
            questions.Should().BeEmpty();
        }

        [Fact]
        public void GetByTopic_WithNullModule_ShouldUseDefaultDotNetModule()
        {
            // Act
            var result = _controller.GetByTopic("C#", null);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var questions = okResult!.Value as IEnumerable<BaseInterviewQuestion>;
            questions.Should().NotBeNull();
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public void GetByTopic_WithEmptyOrWhitespaceTopic_ShouldReturnEmptyList(string topic)
        {
            // Act
            var result = _controller.GetByTopic(topic);

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var questions = okResult!.Value as IEnumerable<BaseInterviewQuestion>;
            questions.Should().NotBeNull();
            questions.Should().BeEmpty();
        }

        [Fact]
        public void SubmitAnswer_WithValidSubmission_ShouldReturnAnswerResult()
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
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<AnswerResult>();
            var answerResult = okResult.Value as AnswerResult;
            answerResult!.Should().NotBeNull();
            answerResult.Explanation.Should().NotBeNull();
        }

        [Fact]
        public void SubmitAnswer_WithInvalidQuestionId_ShouldReturnIncorrectResult()
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
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<AnswerResult>();
            var answerResult = okResult.Value as AnswerResult;
            answerResult!.IsCorrect.Should().BeFalse();
        }

        [Fact]
        public void SubmitAnswer_WithNegativeAnswerIndex_ShouldReturnAnswerResult()
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
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<AnswerResult>();
        }

        [Fact]
        public void SubmitAnswer_WithLargeAnswerIndex_ShouldReturnAnswerResult()
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
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<AnswerResult>();
        }

        [Fact]
        public void Controller_ShouldBeInstantiable()
        {
            // Arrange & Act
            var controller = new InterviewQuestionsController();

            // Assert
            controller.Should().NotBeNull();
        }

        [Fact]
        public void Controller_ShouldHaveDataServiceInstance()
        {
            // Arrange & Act
            var controller = new InterviewQuestionsController();

            // Assert
            controller.Should().NotBeNull();
            // The DataService is private, but we can test that the controller works
            var result = controller.Get();
            result.Should().NotBeNull();
        }
    }
}