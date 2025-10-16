# Shared Component Architecture Developer Guide

## Overview

GlassCode Academy implements a **shared component architecture** that ensures consistency, maintainability, and type safety across all technology modules. This guide explains how to work with and extend the base classes for new modules.

## Base Classes

### BaseInterviewQuestion

Located: `glasscode/backend/Models/BaseInterviewQuestion.cs`

```csharp
public class BaseInterviewQuestion {
    public int? Id { get; set; }
    public string? Topic { get; set; }
    public string? Type { get; set; }
    public string? Question { get; set; }
    public string[]? Choices { get; set; }
    public int? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public string? Difficulty { get; set; }
    public string? IndustryContext { get; set; }
    public string[]? Tags { get; set; }
    public string? QuestionType { get; set; }
    public int? EstimatedTime { get; set; }
    public Source[]? Sources { get; set; }
}
```

**Key Features:**
- Standardizes interview question structure across all modules
- Supports multiple choice and open-ended questions
- Includes metadata for difficulty, timing, and industry context
- Provides source attribution capabilities

### BaseLesson

Located: `glasscode/backend/Models/BaseLesson.cs`

```csharp
public class BaseLesson {
    // Core lesson structure
    public int? Id { get; set; }
    public string ModuleSlug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int Order { get; set; }
    public List<string> Objectives { get; set; } = new List<string>();
    public string Intro { get; set; } = string.Empty;
    public CodeExample Code { get; set; } = new CodeExample();
    public List<Pitfall> Pitfalls { get; set; } = new List<Pitfall>();
    public List<Exercise> Exercises { get; set; } = new List<Exercise>();
    public List<string> Next { get; set; } = new List<string>();
    public int EstimatedMinutes { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new List<string>();
    public string? LastUpdated { get; set; }
    public string? Version { get; set; }
    public List<Source>? Sources { get; set; } = new List<Source>();
    
    // Simple lesson format support
    public string? Topic { get; set; }
    public string? Description { get; set; }
    public string? CodeExample { get; set; }
    public string? Output { get; set; }
}
```

**Key Features:**
- Supports both complex structured lessons and simple format lessons
- Includes learning objectives, exercises, and pitfalls
- Provides metadata for difficulty, timing, and versioning
- Extensible with additional properties for specific module needs

## Adding a New Technology Module

### Step 1: Data Collections in DataService

Add your module's data collections to `glasscode/backend/Services/DataService.cs`:

```csharp
// YourTech data collections
public IEnumerable<BaseLesson> YourTechLessons { get; private set; } = new List<BaseLesson>();
public IEnumerable<BaseInterviewQuestion> YourTechInterviewQuestions { get; private set; } = new List<BaseInterviewQuestion>();
```

### Step 2: JSON Loading Method

Add a loading method in `DataService.cs`:

```csharp
private void LoadYourTechData()
{
    try
    {
        // Load lessons
        var yourTechLessonsPath = Path.Combine(contentPath, "lessons", "yourtech-fundamentals.json");
        if (File.Exists(yourTechLessonsPath))
        {
            var yourTechLessonsJson = File.ReadAllText(yourTechLessonsPath);
            YourTechLessons = JsonSerializer.Deserialize<List<BaseLesson>>(yourTechLessonsJson, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List<BaseLesson>();
            
            Console.WriteLine($"Loaded {YourTechLessons.Count()} YourTech lessons");
        }

        // Load interview questions
        var yourTechQuestionsPath = Path.Combine(contentPath, "quizzes", "yourtech-fundamentals.json");
        if (File.Exists(yourTechQuestionsPath))
        {
            var yourTechQuestionsJson = File.ReadAllText(yourTechQuestionsPath);
            YourTechInterviewQuestions = JsonSerializer.Deserialize<List<BaseInterviewQuestion>>(yourTechQuestionsJson, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List<BaseInterviewQuestion>();
            
            Console.WriteLine($"Loaded {YourTechInterviewQuestions.Count()} YourTech interview questions");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error loading YourTech data: {ex.Message}");
        YourTechLessons = new List<BaseLesson>();
        YourTechInterviewQuestions = new List<BaseInterviewQuestion>();
    }
}
```

### Step 3: Call Loading Method in Constructor

Add the call to your loading method in the `DataService` constructor:

```csharp
public DataService()
{
    // ... existing loading calls ...
    LoadYourTechData();
    
    VerifyDataIntegrity();
}
```

### Step 4: Add to Data Integrity Verification

Update the `VerifyDataIntegrity()` method:

```csharp
private void VerifyDataIntegrity()
{
    // ... existing checks ...
    
    Console.WriteLine($"YourTech: {YourTechLessons.Count()} lessons, {YourTechInterviewQuestions.Count()} questions");
    if (YourTechLessons.Count() == 0) PerformDetailedFileCheck("yourtech-fundamentals.json", "lessons");
    if (YourTechInterviewQuestions.Count() == 0) PerformDetailedFileCheck("yourtech-fundamentals.json", "quizzes");
}
```

### Step 5: Create GraphQL Types

Create `glasscode/backend/GraphQL/YourTechTypes.cs`:

```csharp
using HotChocolate.Types;
using backend.Models;

namespace backend.GraphQL
{
    public class YourTechLessonType : ObjectType<BaseLesson>
    {
        protected override void Configure(IObjectTypeDescriptor<BaseLesson> descriptor)
        {
            descriptor.Name("YourTechLesson");
            descriptor.Description("Represents a YourTech learning lesson with code examples");

            descriptor.Field(l => l.Id).Description("The unique identifier of the lesson");
            descriptor.Field(l => l.Topic).Description("The topic category of the lesson");
            descriptor.Field(l => l.Title).Description("The title of the lesson");
            descriptor.Field(l => l.Description).Description("A detailed description of the lesson");
            descriptor.Field(l => l.CodeExample).Description("Code example demonstrating the lesson concept");
            descriptor.Field(l => l.Output).Description("Expected output of the code example");
        }
    }

    public class YourTechInterviewQuestionType : ObjectType<BaseInterviewQuestion>
    {
        protected override void Configure(IObjectTypeDescriptor<BaseInterviewQuestion> descriptor)
        {
            descriptor.Name("YourTechInterviewQuestion");
            descriptor.Description("Represents a YourTech interview question with multiple choice or open-ended format");

            descriptor.Field(q => q.Id).Description("The unique identifier of the question");
            descriptor.Field(q => q.Topic).Description("The topic category of the question");
            descriptor.Field(q => q.Type).Description("The type of question (multiple-choice or open-ended)");
            descriptor.Field(q => q.Question).Description("The question text");
            descriptor.Field(q => q.Choices).Description("Available choices for multiple-choice questions");
            descriptor.Field(q => q.CorrectAnswer).Description("The index of the correct answer for multiple-choice questions");
            descriptor.Field(q => q.Explanation).Description("Explanation of the correct answer");
        }
    }
}
```

### Step 6: Add GraphQL Queries

Add queries to `glasscode/backend/Program.cs`:

```csharp
// YourTech content queries
public IEnumerable<BaseLesson> YourTechLessons(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
{
    var lessons = _dataService.YourTechLessons;
    if (AppState.IsUnlocked && (!lessons.Any() || lessons.Count() == 0))
    {
        lessons = TestDataGenerator.GenerateTestLessons<BaseLesson>("YourTech");
    }
    return backend.Services.DataService.ApplyQuery(lessons, topic, sortBy, sortOrder, limit, offset);
}

public IEnumerable<BaseInterviewQuestion> YourTechInterviewQuestions(string? topic = null, string? sortBy = null, string? sortOrder = null, int? limit = null, int? offset = null)
{
    var questions = _dataService.YourTechInterviewQuestions;
    if (AppState.IsUnlocked && (!questions.Any() || questions.Count() == 0))
    {
        questions = TestDataGenerator.GenerateTestQuestions<BaseInterviewQuestion>("YourTech");
    }
    return backend.Services.DataService.ApplyQuery(questions, topic, sortBy, sortOrder, limit, offset);
}
```

### Step 7: Register GraphQL Types

Add your types to the GraphQL configuration in `Program.cs`:

```csharp
builder.Services
    .AddGraphQLServer()
    .AddQueryType<Query>()
    .AddMutationType<Mutation>()
    // ... existing types ...
    .AddType<YourTechLessonType>()
    .AddType<YourTechInterviewQuestionType>()
    .AddFiltering()
    .AddSorting();
```

### Step 8: Create Controllers (Optional)

Create REST API controllers if needed:

```csharp
// glasscode/backend/Controllers/YourTechLessonsController.cs
[ApiController]
[Route("api/[controller]")]
public class YourTechLessonsController : ControllerBase
{
    private readonly backend.Services.DataService _dataService = backend.Services.DataService.Instance;

    [HttpGet]
    public IEnumerable<BaseLesson> Get()
    {
        return _dataService.YourTechLessons;
    }
}
```

## JSON File Structure

### Lessons File Format

Create `content/lessons/yourtech-fundamentals.json`:

```json
[
  {
    "id": 1,
    "topic": "YourTech Basics",
    "title": "Introduction to YourTech",
    "description": "Learn the fundamentals of YourTech",
    "codeExample": "// Your code example here",
    "output": "Expected output",
    "difficulty": "beginner",
    "estimatedMinutes": 15,
    "tags": ["basics", "introduction"]
  }
]
```

### Questions File Format

Create `content/quizzes/yourtech-fundamentals.json`:

```json
[
  {
    "id": 1,
    "topic": "YourTech Basics",
    "type": "multiple-choice",
    "question": "What is YourTech?",
    "choices": [
      "Option A",
      "Option B", 
      "Option C",
      "Option D"
    ],
    "correctAnswer": 0,
    "explanation": "Explanation of the correct answer",
    "difficulty": "beginner"
  }
]
```

## Benefits of This Architecture

### Consistency
- All modules follow the same data structure
- Uniform validation rules across all content
- Consistent GraphQL schema generation

### Maintainability
- Changes to base classes automatically apply to all modules
- Centralized data loading and validation logic
- Single source of truth for data structures

### Type Safety
- Strong typing prevents runtime errors
- Compile-time validation of data structures
- IntelliSense support for all properties

### Scalability
- Adding new modules requires minimal boilerplate
- Existing validation and loading infrastructure works automatically
- Easy to extend base classes with new features

### Validation
- Centralized data integrity checks during startup
- Automatic detection of missing or malformed content
- Consistent error reporting across all modules

## Validation Architecture

The validation system works at multiple levels:

1. **JSON Schema Validation**: Content files are validated against the base class structure
2. **Runtime Validation**: `DataService.VerifyDataIntegrity()` checks data loading
3. **Type Safety**: C# compiler ensures type consistency
4. **GraphQL Schema**: Automatic schema generation ensures API consistency

## Best Practices

1. **Always extend base classes**: Never create custom data structures
2. **Use consistent naming**: Follow the pattern `{Technology}Lessons` and `{Technology}InterviewQuestions`
3. **Include proper error handling**: Always wrap data loading in try-catch blocks
4. **Add logging**: Include console output for successful loading and error cases
5. **Test thoroughly**: Verify both lessons and questions load correctly
6. **Follow JSON conventions**: Use camelCase for JSON properties
7. **Include metadata**: Always populate difficulty, tags, and timing information

## Troubleshooting

### Common Issues

1. **Data not loading**: Check file paths and JSON structure
2. **GraphQL errors**: Ensure types are registered in Program.cs
3. **Validation failures**: Verify JSON matches base class properties
4. **Missing fields**: Check that all required base class properties are present

### Debugging Tips

1. Check console output during application startup
2. Verify file existence and permissions
3. Validate JSON syntax using online tools
4. Test GraphQL queries in the GraphQL UI at `/graphql-ui`
5. Use the data integrity verification logs to identify issues