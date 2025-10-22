using backend.Models;
using backend.Controllers;
using backend.Services;
using backend.Services.Auth;
using backend.Data;
using backend.Extensions;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.IO;
using System.Collections.Generic;
using Serilog;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;

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
            .WithOrigins("http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://192.168.6.238:3000", "http://192.168.6.238:3001", "https://glasscode.academy")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

// Add Entity Framework Core with PostgreSQL
// Compute connection string with environment-aware fallback
string? connStr = builder.Configuration.GetConnectionString("DefaultConnection");
var envConnStr = Environment.GetEnvironmentVariable("CONNECTION_STRING");
if (!string.IsNullOrWhiteSpace(envConnStr))
    connStr = envConnStr;
var dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (string.IsNullOrWhiteSpace(connStr) && !string.IsNullOrWhiteSpace(dbUrl))
{
    try
    {
        var uri = new Uri(dbUrl);
        var userInfo = uri.UserInfo.Split(':');
        var dbUser = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "postgres";
        var dbPass = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var dbHost = uri.Host;
        var dbPort = uri.Port > 0 ? uri.Port : 5432;
        var dbName = uri.AbsolutePath.Trim('/');

        connStr = $"Host={dbHost};Database={dbName};Username={dbUser};Password={dbPass};Port={dbPort}";
    }
    catch (Exception ex)
    {
        Log.Warning("Failed to parse DATABASE_URL: {Message}", ex.Message);
    }
}
if (string.IsNullOrWhiteSpace(connStr))
{
    var host = Environment.GetEnvironmentVariable("DB_HOST") ?? "localhost";
    var name = Environment.GetEnvironmentVariable("DB_NAME") ?? "glasscode_dev";
    var user = Environment.GetEnvironmentVariable("DB_USER") ?? "postgres";
    var pwd = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "postgres";
    var port = Environment.GetEnvironmentVariable("DB_PORT") ?? "5432";
    connStr = $"Host={host};Database={name};Username={user};Password={pwd};Port={port}";
}
// Use computed connection string
builder.Services.AddDbContext<GlassCodeDbContext>(options => options.UseNpgsql(connStr));

// Add authorization services
builder.Services.AddAuthorization(options =>
{
    // Define role-based policies
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("InstructorOnly", policy => policy.RequireRole("Instructor"));
    options.AddPolicy("StudentOnly", policy => policy.RequireRole("Student"));
    options.AddPolicy("AdminOrInstructor", policy => policy.RequireRole("Admin", "Instructor"));
    options.AddPolicy("AuthenticatedUser", policy => policy.RequireAuthenticatedUser());

    // Define claim-based policies
    options.AddPolicy("CanManageContent", policy =>
        policy.RequireRole("Admin", "Instructor")
              .RequireClaim("permissions", "manage-content"));

    options.AddPolicy("CanManageUsers", policy =>
        policy.RequireRole("Admin")
              .RequireClaim("permissions", "manage-users"));

    options.AddPolicy("CanViewReports", policy =>
        policy.RequireRole("Admin", "Instructor")
              .RequireClaim("permissions", "view-reports"));

    // Define custom role hierarchy policies
    options.AddPolicy("RequireAdminRole", policy => policy.Requirements.Add(new RoleRequirement("Admin")));
    options.AddPolicy("RequireInstructorRole", policy => policy.Requirements.Add(new RoleRequirement("Instructor")));
    options.AddPolicy("RequireStudentRole", policy => policy.Requirements.Add(new RoleRequirement("Student")));
});

// Register custom authorization handlers
builder.Services.AddScoped<IAuthorizationHandler, RoleAuthorizationHandler>();

// Register custom services
builder.Services.AddScoped<backend.Services.ModuleSeedingService>();
builder.Services.AddScoped<backend.Services.LessonSeedingService>();
builder.Services.AddScoped<backend.Services.LessonMappingService>();
builder.Services.AddScoped<backend.Services.QuizSeedingService>();
// Ensure DataService is available via DI for services/controllers that depend on it
builder.Services.AddSingleton<backend.Services.DataService>(sp => backend.Services.DataService.Instance);
builder.Services.AddScoped<backend.Services.ContentValidationService>();
builder.Services.AddScoped<backend.Services.AutomatedMigrationService>();
builder.Services.AddSingleton<backend.Services.ReadinessService>();

// Register JWT validation service
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "GlassCodeAcademy";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "GlassCodeAcademyUsers";
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "GlassCodeAcademySecretKey12345";
builder.Services.AddSingleton<JwtValidationService>(new JwtValidationService(jwtIssuer, jwtAudience, jwtSecret));

// Register GraphQL Query and Mutation services
builder.Services.AddScoped<Query>();
builder.Services.AddScoped<Mutation>();
builder.Services.AddScoped<backend.GraphQL.GraphQLQuery>();
// Register DatabaseContentService
builder.Services.AddScoped<backend.Services.DatabaseContentService>();

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
    .ModifyRequestOptions(opt => opt.IncludeExceptionDetails = builder.Environment.IsDevelopment());

var app = builder.Build();

// >>> Added: Migration-only mode for CLI fallback
if (Environment.GetEnvironmentVariable("RUN_AUTOMATED_MIGRATION_ONLY") == "1")
{
    Log.Information("RUN_AUTOMATED_MIGRATION_ONLY=1 set; performing full migration and exiting.");
    using (var scope = app.Services.CreateScope())
    {
        var migrationService = scope.ServiceProvider.GetRequiredService<backend.Services.AutomatedMigrationService>();
        var ok = await migrationService.PerformFullMigrationAsync();
        if (ok)
        {
            Log.Information("✅ Automated migration completed. Exiting.");
            Environment.Exit(0);
        }
        else
        {
            Log.Error("❌ Automated migration failed. Exiting with code 1.");
            Environment.Exit(1);
        }
    }
}

// Global exception handler
app.UseMiddleware<backend.Middleware.ErrorHandlingMiddleware>();

// Initialize DataService to load all data during startup
Log.Information("Initializing DataService...");
var dataService = backend.Services.DataService.Instance;
Log.Information("DataService initialized with {DotNetLessons} DotNet lessons", dataService.DotNetLessons.Count());

// Run full automated content migration on startup
Log.Information("Checking whether automated migration is needed...");
var skipAutoMigration = Environment.GetEnvironmentVariable("SKIP_AUTOMATED_MIGRATION") == "1";
if (skipAutoMigration)
{
    Log.Information("SKIP_AUTOMATED_MIGRATION=1; skipping startup migration and DB checks.");
}
else
{
    using (var scope = app.Services.CreateScope())
    {
        try
        {
            var ctx = scope.ServiceProvider.GetRequiredService<backend.Data.GlassCodeDbContext>();
            var hasAnyModules = await ctx.Modules.AnyAsync();
            var hasAnyLessons = await ctx.Lessons.AnyAsync();
            var hasAnyQuizzes = await ctx.LessonQuizzes.AnyAsync();
            if (!hasAnyModules || !hasAnyLessons || !hasAnyQuizzes)
            {
                Log.Information("Running AutomatedMigrationService migration (database not fully populated)...");
                var migrationService = scope.ServiceProvider.GetRequiredService<backend.Services.AutomatedMigrationService>();
                await migrationService.PerformFullMigrationAsync();
            }
            else
            {
                Log.Information("Skipping AutomatedMigrationService migration; data already present.");

                // Backfill quizzes for ALL modules missing published quizzes
                var modules = await ctx.Modules
                    .Include(m => m.Lessons)
                    .ThenInclude(l => l.LessonQuizzes)
                    .ToListAsync();

                var migrationService = scope.ServiceProvider.GetRequiredService<backend.Services.AutomatedMigrationService>();
                foreach (var mod in modules)
                {
                    var hasQuizzes = mod.Lessons.SelectMany(l => l.LessonQuizzes).Any(q => q.IsPublished);
                    if (!hasQuizzes)
                    {
                        Log.Information("Backfilling quizzes for module '{ModuleSlug}'...", mod.Slug);
                        await migrationService.SeedQuizzesForModuleSlugAsync(mod.Slug);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Log.Warning("Skipping automated migration due to DB connectivity issue: {Message}", ex.Message);
        }
    }
}

// Ensure content is ready before accepting requests
using (var scope = app.Services.CreateScope())
{
    var readinessService = scope.ServiceProvider.GetRequiredService<backend.Services.ReadinessService>();
    var cancellationTokenSource = new CancellationTokenSource(TimeSpan.FromSeconds(60)); // 60 second timeout

    Log.Information("Waiting for content to be ready...");
    var isReady = await readinessService.CheckAndSetReadinessAsync();

    if (!isReady)
    {
        Log.Information("Content not ready, waiting for readiness...");
        isReady = await readinessService.WaitForReadinessAsync(cancellationTokenSource.Token);
    }

    if (isReady)
    {
        Log.Information("✅ Content is ready, proceeding to accept HTTP requests");
    }
    else
    {
        Log.Warning("⚠️ Content is not ready after timeout, but proceeding to accept HTTP requests");
    }
}

// Add JWT authentication middleware
app.UseJwtAuthentication(jwtIssuer, jwtAudience, jwtSecret);

// Add role-based authorization middleware
app.UseRoleBasedAuthorization();

// Middleware to check for unlock parameter
app.Use(async (context, next) =>
{
    if (context.Request.Query.ContainsKey("unlock"))
    {
        AppState.IsUnlocked = true;
    }
    await next();
});

// Enable HTTPS redirection only when HTTPS is configured to avoid warnings
var httpsUrlsConfigured = (Environment.GetEnvironmentVariable("ASPNETCORE_URLS") ?? string.Empty)
    .Contains("https://", StringComparison.OrdinalIgnoreCase);
var httpsPortConfigured =
    builder.Configuration.GetValue<int?>("ASPNETCORE_HTTPS_PORT") ??
    builder.Configuration.GetValue<int?>("HttpsPort");

if (!app.Environment.IsDevelopment() && (httpsUrlsConfigured || httpsPortConfigured.HasValue))
{
    app.UseHttpsRedirection();
}
else
{
    Log.Warning("HTTPS redirection disabled: no HTTPS URL/port configured.");
}

// Ensure endpoint routing is set up before applying CORS
app.UseRouting();

// Add Serilog request logging
app.UseSerilogRequestLogging(opts =>
{
    opts.MessageTemplate = "Handled {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
    opts.IncludeQueryInRequestPath = true;
    opts.GetLevel = (httpContext, elapsed, ex) =>
    {
        if (httpContext.Request.Path.StartsWithSegments("/api/health"))
            return Serilog.Events.LogEventLevel.Debug;
        return ex != null
            ? Serilog.Events.LogEventLevel.Error
            : Serilog.Events.LogEventLevel.Information;
    };
});

app.UseCors("AllowFrontend");
app.UseAuthorization();
// Map REST controllers for API endpoints
app.MapControllers();
app.MapGraphQL("/api"); // Map GraphQL to /api for backward compatibility
app.MapGraphQL("/graphql"); // Keep original GraphQL endpoint

// Protect write operations on database-backed endpoints with an admin token
app.Use(async (context, next) =>
{
    var method = context.Request.Method;
    if (method != HttpMethods.Get && method != HttpMethods.Head && method != HttpMethods.Options)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (path.StartsWith("/api/lessons-db") || path.StartsWith("/api/modules-db") || path.StartsWith("/api/LessonQuiz"))
        {
            var token = app.Configuration["AdminApiToken"] ?? Environment.GetEnvironmentVariable("ADMIN_API_TOKEN");
            var authHeader = context.Request.Headers.Authorization.ToString();
            var headerToken = context.Request.Headers["X-Admin-Token"].ToString();
            var bearerToken = authHeader.StartsWith("Bearer ") ? authHeader.Substring("Bearer ".Length) : string.Empty;

            if (string.IsNullOrEmpty(token) || (bearerToken != token && headerToken != token))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Unauthorized");
                return;
            }
        }
    }
    await next();
});
// Configure Banana Cake Pop with a default query (development only)
if (app.Environment.IsDevelopment())
{
    app.MapBananaCakePop("/graphql-ui");
}

// Health check endpoint
app.MapGet("/api/health", async (backend.Services.ReadinessService readinessService) =>
{
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

    // In CI or test environments, we can be more lenient
    var isCiEnvironment = Environment.GetEnvironmentVariable("CI") == "true" ||
                         Environment.GetEnvironmentVariable("GITHUB_ACTIONS") == "true";

    var isHealthy = isCiEnvironment ?
        (dataStats.Values.Sum() > 0) : // At least some content
        dataStats.All(stat => stat.Value > 0); // All content in production

    // Check readiness status
    var isReady = readinessService.IsReady;

    return Results.Ok(new
    {
        status = isHealthy ? "healthy" : "degraded",
        ready = isReady,
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

// GraphQL Query type using DatabaseContentService
public class Query
{
    private readonly backend.Services.DatabaseContentService _databaseContentService;
    private readonly backend.GraphQL.GraphQLQuery _graphQLQuery;

    public Query(backend.Services.DatabaseContentService databaseContentService, backend.GraphQL.GraphQLQuery graphQLQuery)
    {
        _databaseContentService = databaseContentService;
        _graphQLQuery = graphQLQuery;
    }

    // Helper method to apply query parameters
    private IEnumerable<T> ApplyQuery<T>(IEnumerable<T> source, string? topic, string? sortBy, string? sortOrder, int? limit, int? offset)
    {
        // Topic filtering would need to be done at the database level for efficiency
        // For now, we'll just apply pagination
        if (offset.HasValue)
        {
            source = source.Skip(offset.Value);
        }

        if (limit.HasValue)
        {
            source = source.Take(limit.Value);
        }

        return source;
    }

    public async Task<IEnumerable<BaseLesson>> DotNetLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("dotnet-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>(".NET");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseLesson>> GraphQLLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("graphql-advanced", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("GraphQL");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> DotNetInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("dotnet-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>(".NET");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> GraphQLInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("graphql-advanced", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("GraphQL");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Laravel content queries
    public async Task<IEnumerable<BaseLesson>> LaravelLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("laravel-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Laravel");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> LaravelInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("laravel-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Laravel");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // React content queries
    public async Task<IEnumerable<BaseLesson>> ReactLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("react-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("React");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> ReactInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("react-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("React");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Tailwind content queries
    public async Task<IEnumerable<BaseLesson>> TailwindLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("tailwind-advanced", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Tailwind");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> TailwindInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("tailwind-advanced", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Tailwind");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Node content queries
    public async Task<IEnumerable<BaseLesson>> NodeLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("node-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Node");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> NodeInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("node-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Node");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Sass content queries
    public async Task<IEnumerable<BaseLesson>> SassLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("sass-advanced", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Sass");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> SassInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("sass-advanced", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Sass");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Vue content queries
    public async Task<IEnumerable<BaseLesson>> VueLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("vue-advanced", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Vue");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> VueInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("vue-advanced", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Vue");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // TypeScript content queries
    public async Task<IEnumerable<BaseLesson>> TypescriptLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("typescript-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("TypeScript");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> TypescriptInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("typescript-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("TypeScript");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Database content queries
    public async Task<IEnumerable<BaseLesson>> DatabaseLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("database-systems", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Database");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> DatabaseInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("database-systems", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Database");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Testing content queries
    public async Task<IEnumerable<BaseLesson>> TestingLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("testing-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Testing");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> TestingInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("testing-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Testing");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Programming content queries
    public async Task<IEnumerable<BaseLesson>> ProgrammingLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("programming-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Programming");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> ProgrammingInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("programming-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Programming");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Next.js content queries
    public async Task<IEnumerable<BaseLesson>> NextJsLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("nextjs-advanced", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Next.js");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> NextJsInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("nextjs-advanced", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Next.js");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Performance content queries
    public async Task<IEnumerable<BaseLesson>> PerformanceLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("performance-optimization", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Performance");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> PerformanceInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("performance-optimization", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Performance");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Security content queries
    public async Task<IEnumerable<BaseLesson>> SecurityLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("security-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Security");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> SecurityInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("security-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Security");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Version Control content queries
    public async Task<IEnumerable<BaseLesson>> VersionLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("version-control", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Version Control");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> VersionInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("version-control", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Version Control");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

    // Web content queries
    public async Task<IEnumerable<BaseLesson>> WebLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("web-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
        {
            var testLessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("Web");
            return ApplyQuery(testLessons, topic, sortBy, sortOrder, limit, offset);
        }
        return lessons;
    }

    public async Task<IEnumerable<BaseInterviewQuestion>> WebInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
    {
        var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("web-fundamentals", topic, sortBy, sortOrder, limit, offset);
        if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
        {
            var testQuestions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("Web");
            return ApplyQuery(testQuestions, topic, sortBy, sortOrder, limit, offset);
        }
        return questions;
    }

}

public class Mutation
{
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
}

// Make Program class accessible for testing
public partial class Program { }