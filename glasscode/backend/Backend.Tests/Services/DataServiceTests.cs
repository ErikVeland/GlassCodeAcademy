using backend.Services;
using backend.Models;
using FluentAssertions;
using Xunit;
using Xunit.Abstractions;
using Backend.Tests.Infrastructure;

namespace Backend.Tests.Services;

/// <summary>
/// Unit tests for DataService functionality
/// </summary>
public class DataServiceTests : TestBase
{
    public DataServiceTests(ITestOutputHelper output) : base(output)
    {
    }

    [Fact]
    public void DataService_Should_Be_Singleton()
    {
        // Arrange & Act
        var instance1 = DataService.Instance;
        var instance2 = DataService.Instance;

        // Assert
        instance1.Should().BeSameAs(instance2, "DataService should be a singleton");
    }

    [Fact]
    public void DataService_Should_Load_DotNet_Lessons()
    {
        // Arrange
        var dataService = DataService.Instance;

        // Act
        var dotNetLessons = dataService.DotNetLessons;

        // Assert
        dotNetLessons.Should().NotBeNull("DotNet lessons should be loaded");
        dotNetLessons.Should().NotBeEmpty("DotNet lessons should contain data");
        
        Output.WriteLine($"Loaded {dotNetLessons.Count()} DotNet lessons");
    }

    [Fact]
    public void DataService_Should_Load_React_Lessons()
    {
        // Arrange
        var dataService = DataService.Instance;

        // Act
        var reactLessons = dataService.ReactLessons;

        // Assert
        reactLessons.Should().NotBeNull("React lessons should be loaded");
        reactLessons.Should().NotBeEmpty("React lessons should contain data");
        
        Output.WriteLine($"Loaded {reactLessons.Count()} React lessons");
    }

    [Fact]
    public void DataService_Should_Load_Interview_Questions()
    {
        // Arrange
        var dataService = DataService.Instance;

        // Act
        var dotNetQuestions = dataService.DotNetInterviewQuestions;
        var reactQuestions = dataService.ReactInterviewQuestions;

        // Assert
        dotNetQuestions.Should().NotBeNull("DotNet interview questions should be loaded");
        reactQuestions.Should().NotBeNull("React interview questions should be loaded");
        
        Output.WriteLine($"Loaded {dotNetQuestions.Count()} DotNet interview questions");
        Output.WriteLine($"Loaded {reactQuestions.Count()} React interview questions");
    }

    [Fact]
    public void DataService_Lessons_Should_Have_Valid_Structure()
    {
        // Arrange
        var dataService = DataService.Instance;

        // Act
        var dotNetLessons = dataService.DotNetLessons;

        // Assert
        dotNetLessons.Should().NotBeEmpty();
        
        foreach (var lesson in dotNetLessons.Take(5)) // Test first 5 lessons
        {
            lesson.Should().NotBeNull();
            lesson.Id.Should().NotBeNull("Lesson should have an ID");
            lesson.Title.Should().NotBeNullOrEmpty("Lesson should have a title");
            // Check for content in various possible fields
            var hasContent = !string.IsNullOrEmpty(lesson.Intro) || 
                           !string.IsNullOrEmpty(lesson.Description) || 
                           !string.IsNullOrEmpty(lesson.CodeExample);
            hasContent.Should().BeTrue("Lesson should have some form of content");
            
            Output.WriteLine($"Validated lesson: {lesson.Id} - {lesson.Title}");
        }
    }

    [Fact]
    public void DataService_Interview_Questions_Should_Have_Valid_Structure()
    {
        // Arrange
        var dataService = DataService.Instance;

        // Act
        var dotNetQuestions = dataService.DotNetInterviewQuestions;

        // Assert
        dotNetQuestions.Should().NotBeEmpty();
        
        foreach (var question in dotNetQuestions.Take(5)) // Test first 5 questions
        {
            question.Should().NotBeNull();
            question.Id.Should().NotBeNull("Question should have an ID");
            question.Question.Should().NotBeNullOrEmpty("Question should have question text");
            question.Explanation.Should().NotBeNullOrEmpty("Question should have an explanation");
            
            Output.WriteLine($"Validated question: {question.Id} - {question.Question?.Substring(0, Math.Min(50, question.Question.Length))}...");
        }
    }

    [Theory]
    [InlineData("dotnet")]
    [InlineData("react")]
    [InlineData("tailwind")]
    [InlineData("node")]
    public void DataService_Should_Load_All_Technology_Lessons(string technology)
    {
        // Arrange
        var dataService = DataService.Instance;

        // Act & Assert
        var lessons = technology.ToLower() switch
        {
            "dotnet" => dataService.DotNetLessons,
            "react" => dataService.ReactLessons,
            "tailwind" => dataService.TailwindLessons,
            "node" => dataService.NodeLessons,
            _ => throw new ArgumentException($"Unknown technology: {technology}")
        };

        lessons.Should().NotBeNull($"{technology} lessons should be loaded");
        Output.WriteLine($"{technology}: {lessons.Count()} lessons loaded");
    }

    [Fact]
    public void DataService_ContentPath_Should_Be_Valid()
    {
        // Act
        var contentPath = DataService.ContentPath;

        // Assert
        contentPath.Should().NotBeNullOrEmpty("Content path should be set");
        Directory.Exists(contentPath).Should().BeTrue($"Content path should exist: {contentPath}");
        
        Output.WriteLine($"Content path: {contentPath}");
    }
}