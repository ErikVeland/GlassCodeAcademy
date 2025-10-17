using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit.Abstractions;

namespace Backend.Tests.Infrastructure;

/// <summary>
/// Base class for all unit tests providing common setup and utilities
/// </summary>
public abstract class TestBase : IDisposable
{
    protected readonly ITestOutputHelper Output;
    protected readonly ServiceProvider ServiceProvider;
    protected readonly Mock<ILogger> MockLogger;

    protected TestBase(ITestOutputHelper output)
    {
        Output = output;
        MockLogger = new Mock<ILogger>();
        
        var services = new ServiceCollection();
        ConfigureServices(services);
        ServiceProvider = services.BuildServiceProvider();
    }

    /// <summary>
    /// Override this method to configure additional services for specific test classes
    /// </summary>
    protected virtual void ConfigureServices(IServiceCollection services)
    {
        // Add common test services
        services.AddLogging(builder => builder.AddXUnit(Output));
        services.AddSingleton(MockLogger.Object);
    }

    /// <summary>
    /// Get a service from the test service provider
    /// </summary>
    protected T GetService<T>() where T : notnull
    {
        return ServiceProvider.GetRequiredService<T>();
    }

    /// <summary>
    /// Create a mock of the specified type
    /// </summary>
    protected Mock<T> CreateMock<T>() where T : class
    {
        return new Mock<T>();
    }

    public virtual void Dispose()
    {
        ServiceProvider?.Dispose();
        GC.SuppressFinalize(this);
    }
}

/// <summary>
/// Extension methods for ILoggingBuilder to support xUnit output
/// </summary>
public static class LoggingBuilderExtensions
{
    public static ILoggingBuilder AddXUnit(this ILoggingBuilder builder, ITestOutputHelper output)
    {
        builder.AddProvider(new XUnitLoggerProvider(output));
        return builder;
    }
}

/// <summary>
/// xUnit logger provider for test output
/// </summary>
public class XUnitLoggerProvider : ILoggerProvider
{
    private readonly ITestOutputHelper _output;

    public XUnitLoggerProvider(ITestOutputHelper output)
    {
        _output = output;
    }

    public ILogger CreateLogger(string categoryName)
    {
        return new XUnitLogger(_output, categoryName);
    }

    public void Dispose() { }
}

/// <summary>
/// xUnit logger implementation
/// </summary>
public class XUnitLogger : ILogger
{
    private readonly ITestOutputHelper _output;
    private readonly string _categoryName;

    public XUnitLogger(ITestOutputHelper output, string categoryName)
    {
        _output = output;
        _categoryName = categoryName;
    }

    public IDisposable BeginScope<TState>(TState state) => new NoOpDisposable();

    public bool IsEnabled(LogLevel logLevel) => true;

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
    {
        try
        {
            _output.WriteLine($"[{logLevel}] {_categoryName}: {formatter(state, exception)}");
            if (exception != null)
            {
                _output.WriteLine(exception.ToString());
            }
        }
        catch
        {
            // Ignore logging errors in tests
        }
    }

    private class NoOpDisposable : IDisposable
    {
        public void Dispose() { }
    }
}