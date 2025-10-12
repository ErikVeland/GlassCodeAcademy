using backend.Models;
using backend.Controllers;
using backend.Services;
using System.Text.Json;
using System.IO;
using System.Collections.Generic;

var builder = WebApplication.CreateBuilder(args);

// Use default Kestrel configuration; ports are controlled via ASPNETCORE_URLS or appsettings.json
// Force binding to localhost to avoid macOS wildcard binding aborts
builder.WebHost.UseUrls(Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? "http://127.0.0.1:5024");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://192.168.6.238:3000", "http://192.168.6.238:3001", "https://glasscode.academy")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

// Add authorization services
builder.Services.AddAuthorization();

// Removed REST controllers and Swagger in favor of GraphQL

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
app.UseCors("AllowFrontend");
app.UseAuthorization();
// Removed REST controller mapping
app.MapGraphQL("/api"); // Map GraphQL to /api for backward compatibility
app.MapGraphQL("/graphql"); // Keep original GraphQL endpoint

// Configure Banana Cake Pop with a default query
app.MapBananaCakePop("/graphql-ui");

// Health check endpoint
app.MapGet("/api/health", () => {
    var dataService = backend.Services.DataService.Instance;
    var dataStats = new Dictionary<string, int>
    {
        { "LaravelLessons", dataService.LaravelLessons.Count() },
        { "LaravelQuestions", dataService.LaravelInterviewQuestions.Count() },
        { "ReactLessons", dataService.ReactLessons.Count() },
        { "ReactQuestions", dataService.ReactInterviewQuestions.Count() },
        { "NextJsLessons", dataService.NextJsLessons.Count() },
        { "NextJsQuestions", dataService.NextJsInterviewQuestions.Count() },
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

    public IEnumerable<Lesson> DotNetLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
        => backend.Services.DataService.ApplyQuery(_dataService.DotNetLessons, topic, sortBy, sortOrder, limit, offset);
    
    public IEnumerable<Lesson> GraphQLLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
        => backend.Services.DataService.ApplyQuery(_dataService.GraphQLLessons, topic, sortBy, sortOrder, limit, offset);
    
    public IEnumerable<InterviewQuestion> DotNetInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
        => backend.Services.DataService.ApplyQuery(_dataService.DotNetInterviewQuestions, topic, sortBy, sortOrder, limit, offset);
    
    public IEnumerable<InterviewQuestion> GraphQLInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
        => backend.Services.DataService.ApplyQuery(_dataService.GraphQLInterviewQuestions, topic, sortBy, sortOrder, limit, offset);
    
    // Laravel content queries - loading from JSON files
    public IEnumerable<LaravelLesson> LaravelLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.LaravelLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<LaravelLesson>("Laravel");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<LaravelInterviewQuestion> LaravelInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.LaravelInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<LaravelInterviewQuestion>("Laravel");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // React content queries
    public IEnumerable<ReactLesson> ReactLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.ReactLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<ReactLesson>("React");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<ReactInterviewQuestion> ReactInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.ReactInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<ReactInterviewQuestion>("React");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Tailwind content queries
    public IEnumerable<TailwindLesson> TailwindLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.TailwindLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<TailwindLesson>("Tailwind");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<TailwindInterviewQuestion> TailwindInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.TailwindInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<TailwindInterviewQuestion>("Tailwind");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Node.js content queries
    public IEnumerable<NodeLesson> NodeLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.NodeLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<NodeLesson>("Node.js");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<NodeInterviewQuestion> NodeInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.NodeInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<NodeInterviewQuestion>("Node.js");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // SASS content queries
    public IEnumerable<SassLesson> SassLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.SassLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<SassLesson>("SASS");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<SassInterviewQuestion> SassInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.SassInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<SassInterviewQuestion>("SASS");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Vue content queries
    public IEnumerable<VueLesson> VueLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.VueLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<VueLesson>("Vue");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<VueInterviewQuestion> VueInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.VueInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<VueInterviewQuestion>("Vue");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // TypeScript content queries
    public IEnumerable<TypescriptLesson> TypescriptLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.TypescriptLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<TypescriptLesson>("TypeScript");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<TypescriptInterviewQuestion> TypescriptInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.TypescriptInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<TypescriptInterviewQuestion>("TypeScript");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Database content queries
    public IEnumerable<DatabaseLesson> DatabaseLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.DatabaseLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<DatabaseLesson>("Database");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<DatabaseInterviewQuestion> DatabaseInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.DatabaseInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<DatabaseInterviewQuestion>("Database");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Testing content queries
    public IEnumerable<TestingLesson> TestingLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.TestingLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<TestingLesson>("Testing");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<TestingInterviewQuestion> TestingInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.TestingInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<TestingInterviewQuestion>("Testing");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Programming Fundamentals content queries
    public IEnumerable<ProgrammingLesson> ProgrammingLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.ProgrammingLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<ProgrammingLesson>("Programming");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<ProgrammingInterviewQuestion> ProgrammingInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.ProgrammingInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<ProgrammingInterviewQuestion>("Programming");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Next.js content queries
    public IEnumerable<NextJsLesson> NextJsLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.NextJsLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<NextJsLesson>("Next.js");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<NextJsInterviewQuestion> NextJsInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.NextJsInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<NextJsInterviewQuestion>("Next.js");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Performance Optimization content queries
    public IEnumerable<PerformanceLesson> PerformanceLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.PerformanceLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<PerformanceLesson>("Performance");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<PerformanceInterviewQuestion> PerformanceInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.PerformanceInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<PerformanceInterviewQuestion>("Performance");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Security Fundamentals content queries
    public IEnumerable<SecurityLesson> SecurityLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.SecurityLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<SecurityLesson>("Security");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<SecurityInterviewQuestion> SecurityInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.SecurityInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<SecurityInterviewQuestion>("Security");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Version Control content queries
    public IEnumerable<VersionLesson> VersionLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.VersionLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<VersionLesson>("Version Control");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<VersionInterviewQuestion> VersionInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.VersionInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<VersionInterviewQuestion>("Version Control");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
    
    // Web Fundamentals content queries
    public IEnumerable<WebLesson> WebLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var lessons = _dataService.WebLessons;
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            lessons = TestDataGenerator.GenerateTestLessons<WebLesson>("Web Fundamentals");
        }
        return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
    }
    
    public IEnumerable<WebInterviewQuestion> WebInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        // Use cached data from DataService instead of loading JSON file on every request
        var questions = _dataService.WebInterviewQuestions;
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            questions = TestDataGenerator.GenerateTestQuestions<WebInterviewQuestion>("Web Fundamentals");
        }
        return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
    }
}

public class Mutation {
    private readonly backend.Services.DataService _dataService = backend.Services.DataService.Instance;

    public AnswerResult SubmitAnswer(string questionId, int answerIndex)
    {
        return _dataService.ValidateAnswer(questionId, answerIndex);
    }

    public ProgressResult TrackProgress(int userId, int lessonId, string module)
    {
        return _dataService.TrackProgress(userId, lessonId, module);
    }
    
    // Laravel answer submission - using DataService validation
    public AnswerResult SubmitLaravelAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateLaravelAnswer(questionId, answerIndex);
    }
    
    // React answer submission
    public AnswerResult SubmitReactAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateReactAnswer(questionId, answerIndex);
    }
    
    // Tailwind answer submission
    public AnswerResult SubmitTailwindAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateTailwindAnswer(questionId, answerIndex);
    }
    
    // Node.js answer submission
    public AnswerResult SubmitNodeAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateNodeAnswer(questionId, answerIndex);
    }
    
    // SASS answer submission
    public AnswerResult SubmitSassAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateSassAnswer(questionId, answerIndex);
    }
    
    // Vue answer submission
    public AnswerResult SubmitVueAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateVueAnswer(questionId, answerIndex);
    }
    
    // Web Fundamentals answer submission
    public AnswerResult SubmitWebAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateWebAnswer(questionId, answerIndex);
    }
    
    // TypeScript answer submission
    public AnswerResult SubmitTypescriptAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateTypescriptAnswer(questionId, answerIndex);
    }
    
    // Database answer submission
    public AnswerResult SubmitDatabaseAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateDatabaseAnswer(questionId, answerIndex);
    }
    
    // Testing answer submission
    public AnswerResult SubmitTestingAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateTestingAnswer(questionId, answerIndex);
    }
    
    // Programming Fundamentals answer submission
    public AnswerResult SubmitProgrammingAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateProgrammingAnswer(questionId, answerIndex);
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
        return _dataService.ValidateNextJsAnswer(questionId, answerIndex);
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
        return _dataService.ValidatePerformanceAnswer(questionId, answerIndex);
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
        return _dataService.ValidateSecurityAnswer(questionId, answerIndex);
    }
    
    // Version Control answer submission
    public AnswerResult SubmitVersionAnswer(int questionId, int answerIndex)
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
        return _dataService.ValidateVersionAnswer(questionId, answerIndex);
    }
}