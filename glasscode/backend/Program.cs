using backend.Models;
using backend.Controllers;
using backend.Services;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.IO;
using System.Collections.Generic;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog from appsettings and DI
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog((ctx, services, cfg) =>
    cfg.ReadFrom.Configuration(ctx.Configuration)
       .ReadFrom.Services(services)
       .Enrich.FromLogContext());

// Ensure logs directory exists for file sink
Directory.CreateDirectory("logs");

// Use default Kestrel configuration; prefer 8080 unless overridden by ASPNETCORE_URLS
// Force binding to localhost to avoid macOS wildcard binding aborts
builder.WebHost.UseUrls(Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://127.0.0.1:8080");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "http://192.168.6.238:3000", "http://192.168.6.238:3001", "https://glasscode.academy")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

// Add Entity Framework Core with PostgreSQL
builder.Services.AddDbContext<GlassCodeDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add authorization services
builder.Services.AddAuthorization();

// Register custom services
builder.Services.AddScoped<backend.Services.ModuleSeedingService>();
builder.Services.AddScoped<backend.Services.LessonSeedingService>();
builder.Services.AddScoped<backend.Services.LessonMappingService>();
builder.Services.AddScoped<backend.Services.QuizSeedingService>();
builder.Services.AddScoped<backend.Services.ContentValidationService>();
builder.Services.AddScoped<backend.Services.AutomatedMigrationService>();

// Register GraphQL Query and Mutation services
builder.Services.AddScoped<Query>();
builder.Services.AddScoped<Mutation>();

// Add REST controllers back for API endpoints
builder.Services.AddControllers();

// Enhanced GraphQL server configuration
builder.Services.AddGraphQLServer()
    .AddQueryType<Query>()
    .AddMutationType<Mutation>()
    .AddType<backend.GraphQL.LessonType>()
    .AddType<backend.GraphQL.InterviewQuestionType>()
    .AddType<backend.GraphQL.AnswerResultType>()
    .AddType<backend.GraphQL.ProgressResultType>()
    .AddType<backend.GraphQL.LaravelLessonType>()
    .AddType<backend.GraphQL.LaravelInterviewQuestionType>()
    // React GraphQL types
    .AddType<backend.GraphQL.ReactLessonType>()
    .AddType<backend.GraphQL.ReactInterviewQuestionType>()
    // Tailwind GraphQL types
    .AddType<backend.GraphQL.TailwindLessonType>()
    .AddType<backend.GraphQL.TailwindInterviewQuestionType>()
    // Node.js GraphQL types
    .AddType<backend.GraphQL.NodeLessonType>()
    .AddType<backend.GraphQL.NodeInterviewQuestionType>()
    // SASS GraphQL types
    .AddType<backend.GraphQL.SassLessonType>()
    .AddType<backend.GraphQL.SassInterviewQuestionType>()
    // Vue GraphQL types
    .AddType<backend.GraphQL.VueLessonType>()
    .AddType<backend.GraphQL.VueInterviewQuestionType>()
    // TypeScript GraphQL types
    .AddType<backend.GraphQL.TypescriptLessonType>()
    .AddType<backend.GraphQL.TypescriptInterviewQuestionType>()
    // Database GraphQL types
    .AddType<backend.GraphQL.DatabaseLessonType>()
    .AddType<backend.GraphQL.DatabaseInterviewQuestionType>()
    // Testing GraphQL types
    .AddType<backend.GraphQL.TestingLessonType>()
    .AddType<backend.GraphQL.TestingInterviewQuestionType>()
    // DotNet GraphQL types
    .AddType<backend.GraphQL.DotNetLessonType>()
    .AddType<backend.GraphQL.DotNetInterviewQuestionType>()
    // GraphQL Advanced GraphQL types
    .AddType<backend.GraphQL.GraphQLLessonType>()
    .AddType<backend.GraphQL.GraphQLInterviewQuestionType>()
    // Programming Fundamentals GraphQL types
    .AddType<backend.GraphQL.ProgrammingLessonType>()
    .AddType<backend.GraphQL.ProgrammingInterviewQuestionType>()
    // Next.js GraphQL types
    .AddType<backend.GraphQL.NextJsLessonType>()
    .AddType<backend.GraphQL.NextJsInterviewQuestionType>()
    // Performance Optimization GraphQL types
    .AddType<backend.GraphQL.PerformanceLessonType>()
    .AddType<backend.GraphQL.PerformanceInterviewQuestionType>()
    // Security Fundamentals GraphQL types
    .AddType<backend.GraphQL.SecurityLessonType>()
    .AddType<backend.GraphQL.SecurityInterviewQuestionType>()
    // Version Control GraphQL types
    .AddType<backend.GraphQL.VersionLessonType>()
    .AddType<backend.GraphQL.VersionInterviewQuestionType>()
    .ModifyRequestOptions(opt => opt.IncludeExceptionDetails = true);

var app = builder.Build();

// Global exception handler
app.UseMiddleware<backend.Middleware.ErrorHandlingMiddleware>();

// Initialize DataService to load all data during startup
Log.Information("Initializing DataService...");
var dataService = backend.Services.DataService.Instance;
Log.Information("DataService initialized with {DotNetLessons} DotNet lessons", dataService.DotNetLessons.Count());

// Run full automated content migration on startup
Log.Information("Running full AutomatedMigrationService migration...");
using (var scope = app.Services.CreateScope())
{
    var migrationService = scope.ServiceProvider.GetRequiredService<backend.Services.AutomatedMigrationService>();
    await migrationService.PerformFullMigrationAsync();
}

// Middleware to check for unlock parameter
app.Use(async (context, next) =>
{
    if (context.Request.Query.ContainsKey("unlock"))
    {
        AppState.IsUnlocked = true;
    }
    await next();
});

// Enable HTTPS redirection only outside development to avoid local fetch failures
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// Ensure endpoint routing is set up before applying CORS
app.UseRouting();

// Add Serilog request logging
app.UseSerilogRequestLogging(opts =>
{
    opts.MessageTemplate = "Handled {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    opts.IncludeQueryInRequestPath = true;
});

app.UseCors("AllowFrontend");
app.UseAuthorization();
// Map REST controllers for API endpoints
app.MapControllers();
app.MapGraphQL("/api"); // Map GraphQL to /api for backward compatibility
app.MapGraphQL("/graphql"); // Keep original GraphQL endpoint

// Configure Banana Cake Pop with a default query
app.MapBananaCakePop("/graphql-ui");

// Health check endpoint
app.MapGet("/api/health", () => {
    var dataService = backend.Services.DataService.Instance;
    var dataStats = new Dictionary<string, int>
    {
        // Core lessons and questions
        { "DotNetLessons", dataService.DotNetLessons.Count() },
        { "DotNetQuestions", dataService.DotNetInterviewQuestions.Count() },
        { "GraphQLLessons", dataService.GraphQLLessons.Count() },
        { "GraphQLQuestions", dataService.GraphQLInterviewQuestions.Count() },
        { "LaravelLessons", dataService.LaravelLessons.Count() },
        { "LaravelQuestions", dataService.LaravelInterviewQuestions.Count() },
        { "ReactLessons", dataService.ReactLessons.Count() },
        { "ReactQuestions", dataService.ReactInterviewQuestions.Count() },
        { "NextJsLessons", dataService.NextJsLessons.Count() },
        { "NextJsQuestions", dataService.NextJsInterviewQuestions.Count() },
        
        // Frontend technologies
        { "TailwindLessons", dataService.TailwindLessons.Count() },
        { "TailwindQuestions", dataService.TailwindInterviewQuestions.Count() },
        { "SassLessons", dataService.SassLessons.Count() },
        { "SassQuestions", dataService.SassInterviewQuestions.Count() },
        { "VueLessons", dataService.VueLessons.Count() },
        { "VueQuestions", dataService.VueInterviewQuestions.Count() },
        { "TypeScriptLessons", dataService.TypescriptLessons.Count() },
        { "TypeScriptQuestions", dataService.TypescriptInterviewQuestions.Count() },
        
        // Backend and fundamentals
        { "NodeLessons", dataService.NodeLessons.Count() },
        { "NodeQuestions", dataService.NodeInterviewQuestions.Count() },
        { "DatabaseLessons", dataService.DatabaseLessons.Count() },
        { "DatabaseQuestions", dataService.DatabaseInterviewQuestions.Count() },
        { "TestingLessons", dataService.TestingLessons.Count() },
        { "TestingQuestions", dataService.TestingInterviewQuestions.Count() },
        { "ProgrammingLessons", dataService.ProgrammingLessons.Count() },
        { "ProgrammingQuestions", dataService.ProgrammingInterviewQuestions.Count() },
        { "WebLessons", dataService.WebLessons.Count() },
        { "WebQuestions", dataService.WebInterviewQuestions.Count() },
        { "VersionLessons", dataService.VersionLessons.Count() },
        { "VersionQuestions", dataService.VersionInterviewQuestions.Count() },
        
        // Performance and security
        { "PerformanceLessons", dataService.PerformanceLessons.Count() },
        { "PerformanceQuestions", dataService.PerformanceInterviewQuestions.Count() },
        { "SecurityLessons", dataService.SecurityLessons.Count() },
        { "SecurityQuestions", dataService.SecurityInterviewQuestions.Count() }
    };

    var isHealthy = dataStats.All(stat => stat.Value > 0);
    
    return Results.Ok(new { 
        status = isHealthy ? "healthy" : "degraded", 
        timestamp = DateTime.UtcNow, 
        unlocked = AppState.IsUnlocked,
        dataStats = dataStats
    });
});

app.Run();

// Application state management
public static class AppState
{
    public static bool IsUnlocked { get; set; } = false;
}

// Helper methods for generating test data when unlocked
public static class TestDataGenerator
{
    public static List<T> GenerateTestLessons<T>(string moduleName) where T : new()
    {
        var lessons = new List<T>();
        var properties = typeof(T).GetProperties();
        
        for (int i = 1; i <= 5; i++)
        {
            var lesson = new T();
            foreach (var prop in properties)
            {
                if (prop.Name == "Id")
                    prop.SetValue(lesson, i);
                else if (prop.Name == "Title")
                    prop.SetValue(lesson, $"{moduleName} Test Lesson {i}");
                else if (prop.Name == "Topic")
                    prop.SetValue(lesson, "Test Topic");
                else if (prop.Name == "Description")
                    prop.SetValue(lesson, $"This is a test lesson for {moduleName} module.");
                else if (prop.Name == "CodeExample")
                    prop.SetValue(lesson, "console.log('Hello World');");
                else if (prop.Name == "Output")
                    prop.SetValue(lesson, "Hello World");
            }
            lessons.Add(lesson);
        }
        return lessons;
    }
    
    public static List<T> GenerateTestQuestions<T>(string moduleName) where T : new()
    {
        var questions = new List<T>();
        var properties = typeof(T).GetProperties();
        
        for (int i = 1; i <= 5; i++)
        {
            var question = new T();
            foreach (var prop in properties)
            {
                if (prop.Name == "Id")
                    prop.SetValue(question, i);
                else if (prop.Name == "Question")
                    prop.SetValue(question, $"What is {moduleName} feature #{i}?");
                else if (prop.Name == "Topic")
                    prop.SetValue(question, "Test Topic");
                else if (prop.Name == "Type")
                    prop.SetValue(question, "multiple-choice");
                else if (prop.Name == "Choices")
                    prop.SetValue(question, new string[] { "Option A", "Option B", "Option C", "Option D" });
                else if (prop.Name == "CorrectAnswer")
                    prop.SetValue(question, 0);
                else if (prop.Name == "Explanation")
                    prop.SetValue(question, $"This is a test explanation for {moduleName} question #{i}.");
            }
            questions.Add(question);
        }
        return questions;
    }
}

// GraphQL Query type using DataService
public class Query {
    private readonly backend.Services.DataService _dataService = backend.Services.DataService.Instance;

    public IEnumerable<BaseLesson> DotNetLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
        => backend.Services.DataService.ApplyQuery(_dataService.DotNetLessons, topic, sortBy, sortOrder, limit, offset);
    
    public IEnumerable<BaseLesson> GraphQLLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
        => backend.Services.DataService.ApplyQuery(_dataService.GraphQLLessons, topic, sortBy, sortOrder, limit, offset);
    
    public IEnumerable<BaseInterviewQuestion> DotNetInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.DotNetInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>(".NET");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> GraphQLInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.GraphQLInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("GraphQL");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Laravel content queries
    public IEnumerable<BaseLesson> LaravelLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.LaravelLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Laravel");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> LaravelInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.LaravelInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Laravel");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // React content queries
    public IEnumerable<BaseLesson> ReactLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.ReactLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("React");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> ReactInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.ReactInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("React");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Tailwind content queries
    public IEnumerable<BaseLesson> TailwindLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.TailwindLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Tailwind");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> TailwindInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.TailwindInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Tailwind");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Node content queries
    public IEnumerable<BaseLesson> NodeLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.NodeLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Node");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> NodeInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.NodeInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Node");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Sass content queries
    public IEnumerable<BaseLesson> SassLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.SassLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Sass");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> SassInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.SassInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Sass");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Vue content queries
    public IEnumerable<BaseLesson> VueLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.VueLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Vue");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> VueInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.VueInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Vue");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // TypeScript content queries
    public IEnumerable<BaseLesson> TypescriptLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.TypescriptLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("TypeScript");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> TypescriptInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.TypescriptInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("TypeScript");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Database content queries
    public IEnumerable<BaseLesson> DatabaseLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.DatabaseLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Database");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> DatabaseInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.DatabaseInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Database");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Testing content queries
    public IEnumerable<BaseLesson> TestingLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.TestingLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Testing");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> TestingInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.TestingInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Testing");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Programming content queries
    public IEnumerable<BaseLesson> ProgrammingLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.ProgrammingLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Programming");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> ProgrammingInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.ProgrammingInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Programming");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Next.js content queries
    public IEnumerable<BaseLesson> NextJsLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.NextJsLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Next.js");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> NextJsInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.NextJsInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Next.js");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Performance content queries
    public IEnumerable<BaseLesson> PerformanceLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.PerformanceLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Performance");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> PerformanceInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.PerformanceInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Performance");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Security content queries
    public IEnumerable<BaseLesson> SecurityLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.SecurityLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Security");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> SecurityInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.SecurityInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Security");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Version Control content queries
    public IEnumerable<BaseLesson> VersionLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.VersionLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Version Control");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> VersionInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.VersionInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Version Control");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }

    // Web content queries
    public IEnumerable<BaseLesson> WebLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.WebLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Web");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<BaseInterviewQuestion> WebInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.WebInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Web");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
}

public class Mutation {
    private readonly backend.Services.DataService _dataService = backend.Services.DataService.Instance;

    public AnswerResult SubmitAnswer(string questionId, int answerIndex)
    {
        return _dataService.ValidateAnswer(int.Parse(questionId), answerIndex);
    }

    public ProgressResult TrackProgress(int userId, int lessonId, string module)
    {
        return _dataService.TrackProgress(userId, lessonId, module);
    }
    
    // Laravel answer submission - using DataService validation
    public AnswerResult SubmitLaravelAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateLaravelAnswer(int.Parse(questionId), answerIndex);
    }
    
    // React answer submission
    public AnswerResult SubmitReactAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateReactAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Tailwind answer submission
    public AnswerResult SubmitTailwindAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateTailwindAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Node.js answer submission
    public AnswerResult SubmitNodeAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateNodeAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Sass answer submission
    public AnswerResult SubmitSassAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateSassAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Vue answer submission
    public AnswerResult SubmitVueAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateVueAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Web Fundamentals answer submission
    public AnswerResult SubmitWebAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateWebAnswer(int.Parse(questionId), answerIndex);
    }
    
    // TypeScript answer submission
    public AnswerResult SubmitTypescriptAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateTypescriptAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Database answer submission
    public AnswerResult SubmitDatabaseAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateDatabaseAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Testing answer submission
    public AnswerResult SubmitTestingAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateTestingAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Programming answer submission
    public AnswerResult SubmitProgrammingAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        // Use the specific programming validation method
        return _dataService.ValidateProgrammingAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Next.js answer submission
    public AnswerResult SubmitNextJsAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateNextJsAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Performance Optimization answer submission
    public AnswerResult SubmitPerformanceAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidatePerformanceAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Security Fundamentals answer submission
    public AnswerResult SubmitSecurityAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateSecurityAnswer(int.Parse(questionId), answerIndex);
    }
    
    // Version Control answer submission
    public AnswerResult SubmitVersionAnswer(string questionId, int answerIndex)
    {
        // If unlocked, accept any answer as correct for testing
        if (AppState.IsUnlocked)
        {
            return new AnswerResult 
            { 
                IsCorrect = true, 
                Explanation = "Test mode: All answers are correct!" 
            };
        }
        return _dataService.ValidateVersionAnswer(int.Parse(questionId), answerIndex);
    }
}

// Make Program class accessible for testing
public partial class Program { }