using FluentAssertions;
using Xunit;
using backend.Services;
using Backend.Tests.Infrastructure;

namespace Backend.Tests.Services;

/// <summary>
/// Unit tests for AutomatedMigrationService
/// </summary>
public class AutomatedMigrationServiceTests : TestBase
{
    [Fact]
    public void MigrationResult_Should_Initialize_Correctly()
    {
        // Act
        var result = new MigrationResult();

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().BeEmpty();
        result.Timestamp.Should().Be(default(DateTime));
    }

    [Fact]
    public void MigrationResult_Properties_Should_Be_Settable()
    {
        // Arrange
        var result = new MigrationResult();
        var message = "Test message";
        var timestamp = DateTime.UtcNow;

        // Act
        result.Success = true;
        result.Message = message;
        result.Timestamp = timestamp;

        // Assert
        result.Success.Should().BeTrue();
        result.Message.Should().Be(message);
        result.Timestamp.Should().Be(timestamp);
    }

    [Fact]
    public void MigrationStatus_Should_Initialize_Correctly()
    {
        // Act
        var status = new MigrationStatus();

        // Assert
        status.IsDatabaseConnected.Should().BeFalse();
        status.LastMigration.Should().Be(default(DateTime));
        status.Status.Should().BeEmpty();
    }

    [Fact]
    public void MigrationStatus_Properties_Should_Be_Settable()
    {
        // Arrange
        var status = new MigrationStatus();
        var lastMigration = DateTime.UtcNow;
        var statusMessage = "Test status";

        // Act
        status.IsDatabaseConnected = true;
        status.LastMigration = lastMigration;
        status.Status = statusMessage;

        // Assert
        status.IsDatabaseConnected.Should().BeTrue();
        status.LastMigration.Should().Be(lastMigration);
        status.Status.Should().Be(statusMessage);
    }

    [Fact]
    public void LessonData_Should_Initialize_Correctly()
    {
        // Act
        var lessonData = new LessonData();

        // Assert
        lessonData.Id.Should().BeNull();
        lessonData.Title.Should().BeNull();
        lessonData.Slug.Should().BeNull();
        lessonData.Order.Should().BeNull();
        lessonData.Difficulty.Should().BeNull();
        lessonData.EstimatedMinutes.Should().BeNull();
        lessonData.Intro.Should().BeNull();
        lessonData.Objectives.Should().BeNull();
        lessonData.Code.Should().BeNull();
        lessonData.Pitfalls.Should().BeNull();
        lessonData.Exercises.Should().BeNull();
        lessonData.Next.Should().BeNull();
        lessonData.Sources.Should().BeNull();
        lessonData.Tags.Should().BeNull();
        lessonData.Topic.Should().BeNull();
        lessonData.Description.Should().BeNull();
        lessonData.CodeExample.Should().BeNull();
        lessonData.Output.Should().BeNull();
        lessonData.Version.Should().BeNull();
        lessonData.LastUpdated.Should().BeNull();
    }

    [Fact]
    public void LessonData_Properties_Should_Be_Settable()
    {
        // Arrange
        var lessonData = new LessonData();
        var title = "Test Lesson";
        var slug = "test-lesson";
        var order = 1;
        var difficulty = "Beginner";

        // Act
        lessonData.Title = title;
        lessonData.Slug = slug;
        lessonData.Order = order;
        lessonData.Difficulty = difficulty;

        // Assert
        lessonData.Title.Should().Be(title);
        lessonData.Slug.Should().Be(slug);
        lessonData.Order.Should().Be(order);
        lessonData.Difficulty.Should().Be(difficulty);
    }
}