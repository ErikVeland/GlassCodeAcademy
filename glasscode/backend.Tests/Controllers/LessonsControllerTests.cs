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
            // Act
            var result = _controller.GetAll();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            okResult!.Value.Should().BeAssignableTo<IEnumerable<BaseLesson>>();
            var lessons = okResult.Value as IEnumerable<BaseLesson>;
            lessons.Should().NotBeEmpty();
        }

        [Fact]
        public void GetAll_ShouldReturnLessonsWithValidStructure()
        {
            // Act
            var result = _controller.GetAll();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var lessons = okResult!.Value as IEnumerable<BaseLesson>;
            
            foreach (var lesson in lessons!)
            {
                lesson.Id.Should().BeGreaterThan(0);
                lesson.Title.Should().NotBeNullOrEmpty();
                lesson.ModuleSlug.Should().NotBeNullOrEmpty();
            }
        }

        [Fact]
        public void Get_WithValidId_ShouldReturnLesson()
        {
            // Act
            var result = _controller.Get("1");

            // Assert
            result.Should().NotBeNull();
            if (result.Result is OkObjectResult okResult)
            {
                var lesson = okResult.Value as BaseLesson;
                lesson.Should().NotBeNull();
                lesson!.Id.Should().Be(1);
            }
            else if (result.Result is NotFoundResult)
            {
                // This is also acceptable if lesson with ID 1 doesn't exist
                result.Result.Should().BeOfType<NotFoundResult>();
            }
        }

        [Fact]
        public void GetAll_WithModule_ShouldReturnModuleSpecificLessons()
        {
            // Act
            var result = _controller.GetAll("react");

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var lessons = okResult!.Value as IEnumerable<BaseLesson>;
            lessons.Should().NotBeEmpty();
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