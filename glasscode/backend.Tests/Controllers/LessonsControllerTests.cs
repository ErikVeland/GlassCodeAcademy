using Microsoft.AspNetCore.Mvc;
using Xunit;
using FluentAssertions;
using backend.Controllers;
using backend.Models;

namespace backend.Tests.Controllers
{
    public class LessonsControllerTests
    {
        private readonly LessonsController _controller;

        public LessonsControllerTests()
        {
            _controller = new LessonsController();
        }

        [Fact]
        public void GetAll_ShouldReturnOkResult_WhenLessonsExist()
        {
            // Arrange
            var controller = new LessonsController();

            // Act
            var result = controller.GetAll();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeAssignableTo<IEnumerable<Lesson>>();
            var lessons = okResult.Value as IEnumerable<Lesson>;
            lessons.Should().NotBeEmpty();
            lessons.Should().Contain(l => l.Topic == "OOP");
            lessons.Should().Contain(l => l.Topic == "C# Basics");
        }

        [Fact]
        public void Get_ShouldReturnOkResult_WhenLessonExists()
        {
            // Arrange
            var controller = new LessonsController();

            // Act
            var result = controller.Get("1");

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeOfType<Lesson>();
            var lesson = okResult.Value as Lesson;
            lesson.Should().NotBeNull();
            lesson!.Id.Should().Be("1");
        }

        [Fact]
        public void GetAll_ShouldReturnLessonsWithValidStructure()
        {
            // Arrange
            var controller = new LessonsController();

            // Act
            var result = controller.GetAll();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var lessons = okResult!.Value as IEnumerable<Lesson>;
            
            foreach (var lesson in lessons!)
            {
                lesson.Id.Should().NotBeNullOrEmpty();
                lesson.Title.Should().NotBeNullOrEmpty();
                lesson.Topic.Should().NotBeNullOrEmpty();
                lesson.Description.Should().NotBeNullOrEmpty();
            }
        }

        [Fact]
        public void StaticLessons_ShouldContainExpectedTopics()
        {
            // Act
            var lessons = LessonsController.Lessons;

            // Assert
            var topics = lessons.Select(l => l.Topic).Distinct().ToList();
            topics.Should().Contain("OOP");
            topics.Should().Contain("C# Basics");
            topics.Should().Contain("C# Syntax");
            topics.Should().Contain("LINQ");
            topics.Should().Contain("Entity Framework");
            topics.Should().Contain("ASP.NET Core");
        }

        [Fact]
        public void StaticLessons_ShouldHaveUniqueIds()
        {
            // Act
            var lessons = LessonsController.Lessons;

            // Assert
            var ids = lessons.Select(l => l.Id).ToList();
            ids.Should().OnlyHaveUniqueItems();
        }

        [Fact]
        public void Controller_ShouldBeInstantiable()
        {
            // Arrange & Act
            var controller = new LessonsController();

            // Assert
            controller.Should().NotBeNull();
        }
    }
}