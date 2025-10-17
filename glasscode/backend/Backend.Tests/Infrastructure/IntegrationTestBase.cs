using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Xunit;
using System.Net.Http;
using Xunit.Abstractions;

namespace Backend.Tests.Infrastructure;

/// <summary>
/// Base class for integration tests that need the full application context
/// </summary>
public abstract class IntegrationTestBase : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    protected readonly WebApplicationFactory<Program> Factory;
    protected readonly HttpClient Client;
    protected readonly ITestOutputHelper Output;

    protected IntegrationTestBase(WebApplicationFactory<Program> factory, ITestOutputHelper output)
    {
        Output = output;
        Factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Override services for testing
                ConfigureTestServices(services);
            });
            
            builder.UseEnvironment("Testing");
            
            // Configure logging to output to test console
            builder.ConfigureLogging(logging =>
            {
                logging.ClearProviders();
                logging.AddXUnit(output);
            });
        });

        Client = Factory.CreateClient();
    }

    /// <summary>
    /// Override this method to configure test-specific services
    /// </summary>
    protected virtual void ConfigureTestServices(IServiceCollection services)
    {
        // Override in derived classes to customize services for specific tests
    }

    /// <summary>
    /// Get a service from the application's service provider
    /// </summary>
    protected T GetService<T>() where T : notnull
    {
        return Factory.Services.GetRequiredService<T>();
    }

    /// <summary>
    /// Create a new scope and get a service from it
    /// </summary>
    protected T GetScopedService<T>() where T : notnull
    {
        using var scope = Factory.Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<T>();
    }

    public virtual void Dispose()
    {
        Client?.Dispose();
        Factory?.Dispose();
        GC.SuppressFinalize(this);
    }
}