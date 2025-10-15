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
        public void GetAll_ShouldReturnOkResult_WhenQuestionsExist()
        {
            // Arrange
            var controller = new InterviewQuestionsController();

            // Act
            var result = controller.GetAll();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeAssignableTo<IEnumerable<InterviewQuestion>>();
            var questions = okResult.Value as IEnumerable<InterviewQuestion>;
            questions.Should().NotBeEmpty();
        }

        [Fact]
        public void GetAll_ShouldReturnQuestionsWithValidStructure()
        {
            // Arrange
            var controller = new InterviewQuestionsController();

            // Act
            var result = controller.GetAll();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var questions = okResult!.Value as IEnumerable<InterviewQuestion>;
            
            foreach (var question in questions!)
            {
                question.Id.Should().NotBeNullOrEmpty();
                question.Question.Should().NotBeNullOrEmpty();
                question.Topic.Should().NotBeNullOrEmpty();
                question.Type.Should().NotBeNullOrEmpty();
                question.Choices.Should().NotBeNull();
                question.Choices.Should().NotBeEmpty();
            }
        }

        [Fact]
        public void StaticQuestions_ShouldContainExpectedTopics()
        {
            // Act
            var questions = InterviewQuestionsController.Questions;

            // Assert
            var topics = questions.Select(q => q.Topic).Distinct().ToList();
            topics.Should().Contain("OOP");
        }

        [Fact]
        public void StaticQuestions_ShouldHaveUniqueIds()
        {
            // Act
            var questions = InterviewQuestionsController.Questions;

            // Assert
            var ids = questions.Select(q => q.Id).ToList();
            ids.Should().OnlyHaveUniqueItems();
        }

        [Fact]
        public void StaticQuestions_ShouldHaveValidAnswerIndices()
        {
            // Act
            var questions = InterviewQuestionsController.Questions;

            // Assert
            foreach (var question in questions)
            {
                if (question.CorrectAnswer.HasValue)
                {
                    question.CorrectAnswer.Should().BeInRange(0, question.Choices?.Length - 1 ?? 0);
                }
            }
        }

        [Fact]
        public void Controller_ShouldBeInstantiable()
        {
            // Arrange & Act
            var controller = new InterviewQuestionsController();

            // Assert
            controller.Should().NotBeNull();
        }
    }
}