using FluentAssertions;
using Xunit;
using backend.Services;
using Backend.Tests.Infrastructure;
using Xunit.Abstractions;

namespace Backend.Tests.Services;

/// <summary>
/// Unit tests for ContentValidationService
/// </summary>
public class ContentValidationServiceTests : TestBase
{
    public ContentValidationServiceTests(ITestOutputHelper output) : base(output) {}
    [Fact]
    public void GenerateContentHash_Should_Return_Valid_Hash()
    {
        // Arrange
        var service = new ContentValidationService(null!, null!);
        var content = "Test content for hashing";

        // Act
        var hash = service.GenerateContentHash(content);

        // Assert
        hash.Should().NotBeNullOrEmpty();
        hash.Should().HaveLength(64); // SHA256 produces 64-character hex string
        hash.Should().Be("dc0cc3920cd8d2a633fded073be0082554297fde2f0cf15af5e5c2563e49d5de"); // Known SHA-256 for "Test content for hashing"
    }

    [Fact]
    public void GenerateContentHash_Should_Produce_Consistent_Results()
    {
        // Arrange
        var service = new ContentValidationService(null!, null!);
        var content = "Consistent test content";

        // Act
        var hash1 = service.GenerateContentHash(content);
        var hash2 = service.GenerateContentHash(content);

        // Assert
        hash1.Should().Be(hash2);
    }

    [Fact]
    public void GenerateContentHash_Different_Content_Should_Produce_Different_Hashes()
    {
        // Arrange
        var service = new ContentValidationService(null!, null!);
        var content1 = "Content A";
        var content2 = "Content B";

        // Act
        var hash1 = service.GenerateContentHash(content1);
        var hash2 = service.GenerateContentHash(content2);

        // Assert
        hash1.Should().NotBe(hash2);
    }

    [Fact]
    public void ValidationSummary_Should_Initialize_Correctly()
    {
        // Act
        var summary = new ValidationSummary();

        // Assert
        summary.DatabaseCount.Should().Be(0);
        summary.JsonCount.Should().Be(0);
        summary.IsConsistent.Should().BeFalse();
    }

    [Fact]
    public void ContentValidationResult_Should_Initialize_Correctly()
    {
        // Act
        var result = new ContentValidationResult();

        // Assert
        result.IsOverallConsistent.Should().BeFalse();
        result.ModulesValidation.Should().NotBeNull();
        result.LessonsValidation.Should().NotBeNull();
        result.QuizzesValidation.Should().NotBeNull();
        result.Error.Should().BeNull();
    }

    [Fact]
    public void ModuleData_Should_Initialize_Correctly()
    {
        // Act
        var moduleData = new ModuleData();

        // Assert
        moduleData.Slug.Should().BeEmpty();
        moduleData.Title.Should().BeEmpty();
        moduleData.Description.Should().BeEmpty();
        moduleData.Tier.Should().BeEmpty();
        moduleData.Track.Should().BeEmpty();
        moduleData.Prerequisites.Should().NotBeNull();
        moduleData.Prerequisites.Should().BeEmpty();
    }

    [Fact]
    public void ModuleRegistryData_Should_Initialize_Correctly()
    {
        // Act
        var registryData = new ModuleRegistryData();

        // Assert
        registryData.Modules.Should().NotBeNull();
        registryData.Modules.Should().BeEmpty();
    }
}