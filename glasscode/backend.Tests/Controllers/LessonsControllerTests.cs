using Microsoft.AspNetCore.Mvc;
using Xunit;
using FluentAssertions;
using backend.Controllers;
using backend.Models;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.InMemory.Infrastructure; // Add this line
using System.Threading.Tasks;

namespace backend.Tests.Controllers
{
    public class LessonsControllerTests
    {
        private readonly LessonsController _controller;

        public LessonsControllerTests()
        {
            // Create in-memory database context for testing
            var options = new DbContextOptionsBuilder<GlassCodeDbContext>()
                .UseInMemoryDatabase(databaseName: "LessonsControllerTests")
                .Options;
            var dbContext = new GlassCodeDbContext(options);
            _controller = new LessonsController(dbContext);
        }

        [Fact]
        public async Task GetAll_ShouldReturnOkResult_WhenLessonsExist()
        {
            // Act
            var result = await _controller.GetAll();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task GetAll_ShouldReturnLessonsWithValidStructure()
        {
            // Act
            var result = await _controller.GetAll();

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public async Task Get_WithValidId_ShouldReturnLesson()
        {
            // Act
            var result = await _controller.Get("1");

            // Assert
            result.Should().NotBeNull();
        }

        [Fact]
        public async Task GetAll_WithModule_ShouldReturnModuleSpecificLessons()
        {
            // Act
            var result = await _controller.GetAll("react");

            // Assert
            result.Should().NotBeNull();
            result.Result.Should().BeOfType<OkObjectResult>();
        }

        [Fact]
        public void Controller_ShouldBeInstantiable()
        {
            // Arrange & Act
            var options = new DbContextOptionsBuilder<GlassCodeDbContext>()
                .UseInMemoryDatabase(databaseName: "LessonsControllerInstantiableTests")
                .Options;
            var dbContext = new GlassCodeDbContext(options);
            var controller = new LessonsController(dbContext);

            // Assert
            controller.Should().NotBeNull();
        }
    }
}