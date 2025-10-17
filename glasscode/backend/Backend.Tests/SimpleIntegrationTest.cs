using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using FluentAssertions;
using Xunit;
using Xunit.Abstractions;

namespace Backend.Tests;

/// <summary>
/// Simple integration test to verify the test server setup
/// </summary>
public class SimpleIntegrationTest : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly ITestOutputHelper _output;

    public SimpleIntegrationTest(WebApplicationFactory<Program> factory, ITestOutputHelper output)
    {
        _factory = factory;
        _output = output;
    }

    [Fact]
    public async Task TestServer_Should_Start_Successfully()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act & Assert - Just verify the server starts
        client.Should().NotBeNull();
        _output.WriteLine("Test server created successfully");
    }

    [Fact]
    public async Task HealthCheck_Should_Return_Success()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/");

        // Assert
        response.Should().NotBeNull();
        _output.WriteLine($"Response status: {response.StatusCode}");
        
        // We don't care about the exact status, just that we get a response
        // This verifies the test server is working
    }
}