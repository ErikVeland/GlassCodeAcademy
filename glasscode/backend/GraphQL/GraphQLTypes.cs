using backend.Models;
using backend.Controllers;
using System.Text.Json;
using System.IO;

namespace backend.GraphQL;

public class GraphQLLessonType
{
    public int? Id { get; set; }
    public string? Topic { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CodeExample { get; set; } = string.Empty;
    public string Output { get; set; } = string.Empty;
}

public class GraphQLInterviewQuestionType
{
    public int? Id { get; set; }
    public string? Topic { get; set; }
    public string? Type { get; set; }
    public string? Question { get; set; }
    public string[]? Choices { get; set; }
    public int? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
}

public class GraphQLQuery
{
    public static IEnumerable<GraphQLLessonType> GetGraphQLLessons()
    {
        var jsonPath = System.IO.Path.Combine(backend.Services.DataService.ContentPath, "lessons", "graphql_lessons.json");
        if (!System.IO.File.Exists(jsonPath))
        {
            return new List<GraphQLLessonType>();
        }

        var jsonContent = System.IO.File.ReadAllText(jsonPath);
        var lessons = System.Text.Json.JsonSerializer.Deserialize<List<BaseLesson>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        });
        
        return lessons?.Select(l => new GraphQLLessonType
        {
            Id = l.Id,
            Topic = l.Topic,
            Title = l.Title ?? string.Empty,
            Description = l.Description ?? string.Empty,
            CodeExample = l.CodeExample ?? string.Empty,
            Output = l.Output ?? string.Empty
        }) ?? new List<GraphQLLessonType>();
    }

    public static GraphQLLessonType? GetGraphQLLesson(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var lessons = GetGraphQLLessons();
        var lesson = lessons.FirstOrDefault(l => l.Id == parsedId);
        return lesson;
    }

    public static IEnumerable<GraphQLInterviewQuestionType> GetGraphQLQuestions()
    {
        var jsonPath = System.IO.Path.Combine(backend.Services.DataService.ContentPath, "quizzes", "graphql_questions.json");
        if (!System.IO.File.Exists(jsonPath))
        {
            return new List<GraphQLInterviewQuestionType>();
        }

        var jsonContent = System.IO.File.ReadAllText(jsonPath);
        var questions = System.Text.Json.JsonSerializer.Deserialize<List<BaseInterviewQuestion>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        });
        
        return questions?.Select(q => new GraphQLInterviewQuestionType
        {
            Id = q.Id,
            Topic = q.Topic,
            Type = q.Type,
            Question = q.Question,
            Choices = q.Choices,
            CorrectAnswer = q.CorrectAnswer,
            Explanation = q.Explanation
        }) ?? new List<GraphQLInterviewQuestionType>();
    }

    public static GraphQLInterviewQuestionType? GetGraphQLQuestion(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var questions = GetGraphQLQuestions();
        var question = questions.FirstOrDefault(q => q.Id == parsedId);
        return question;
    }
    
    // DotNet Lessons
    public static IEnumerable<GraphQLLessonType> GetDotNetLessons()
    {
        var jsonPath = System.IO.Path.Combine(backend.Services.DataService.ContentPath, "lessons", "dotnet_lessons.json");
        if (!System.IO.File.Exists(jsonPath))
        {
            return new List<GraphQLLessonType>();
        }

        var jsonContent = System.IO.File.ReadAllText(jsonPath);
        var lessons = System.Text.Json.JsonSerializer.Deserialize<List<BaseLesson>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        });
        
        return lessons?.Select(l => new GraphQLLessonType
        {
            Id = l.Id,
            Topic = l.Topic,
            Title = l.Title ?? string.Empty,
            Description = l.Description ?? string.Empty,
            CodeExample = l.CodeExample ?? string.Empty,
            Output = l.Output ?? string.Empty
        }) ?? new List<GraphQLLessonType>();
    }

    public static GraphQLLessonType? GetDotNetLesson(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var lessons = GetDotNetLessons();
        return lessons.FirstOrDefault(l => l.Id == parsedId);
    }

    public static IEnumerable<GraphQLInterviewQuestionType> GetDotNetQuestions()
    {
        var jsonPath = System.IO.Path.Combine(backend.Services.DataService.ContentPath, "quizzes", "dotnet_questions.json");
        if (!System.IO.File.Exists(jsonPath))
        {
            return new List<GraphQLInterviewQuestionType>();
        }

        var jsonContent = System.IO.File.ReadAllText(jsonPath);
        var questions = System.Text.Json.JsonSerializer.Deserialize<List<BaseInterviewQuestion>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        });
        
        return questions?.Select(q => new GraphQLInterviewQuestionType
        {
            Id = q.Id,
            Topic = q.Topic,
            Type = q.Type,
            Question = q.Question,
            Choices = q.Choices,
            CorrectAnswer = q.CorrectAnswer,
            Explanation = q.Explanation
        }) ?? new List<GraphQLInterviewQuestionType>();
    }

    public static GraphQLInterviewQuestionType? GetDotNetQuestion(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var questions = GetDotNetQuestions();
        return questions.FirstOrDefault(q => q.Id == parsedId);
    }

    // Programming Lessons
    public static IEnumerable<GraphQLLessonType> GetProgrammingLessons()
    {
        var jsonPath = System.IO.Path.Combine(backend.Services.DataService.ContentPath, "lessons", "programming-fundamentals.json");
        if (!System.IO.File.Exists(jsonPath))
        {
            return new List<GraphQLLessonType>();
        }

        var jsonContent = System.IO.File.ReadAllText(jsonPath);
        var lessons = System.Text.Json.JsonSerializer.Deserialize<List<BaseLesson>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        });
        
        return lessons?.Select(l => new GraphQLLessonType
        {
            Id = l.Id,
            Topic = l.Topic,
            Title = l.Title ?? string.Empty,
            Description = l.Description ?? string.Empty,
            CodeExample = l.CodeExample ?? string.Empty,
            Output = l.Output ?? string.Empty
        }) ?? new List<GraphQLLessonType>();
    }

    public static GraphQLLessonType? GetProgrammingLesson(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var lessons = GetProgrammingLessons();
        return lessons.FirstOrDefault(l => l.Id == parsedId);
    }

    // Programming Questions
    public static IEnumerable<GraphQLInterviewQuestionType> GetProgrammingQuestions()
    {
        var jsonPath = System.IO.Path.Combine(backend.Services.DataService.ContentPath, "quizzes", "programming-fundamentals.json");
        if (!System.IO.File.Exists(jsonPath))
        {
            return new List<GraphQLInterviewQuestionType>();
        }

        var jsonContent = System.IO.File.ReadAllText(jsonPath);
        var questions = System.Text.Json.JsonSerializer.Deserialize<List<BaseInterviewQuestion>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        });
        
        return questions?.Select(q => new GraphQLInterviewQuestionType
        {
            Id = q.Id,
            Topic = q.Topic,
            Type = q.Type,
            Question = q.Question,
            Choices = q.Choices,
            CorrectAnswer = q.CorrectAnswer,
            Explanation = q.Explanation
        }) ?? new List<GraphQLInterviewQuestionType>();
    }

    public static GraphQLInterviewQuestionType? GetProgrammingQuestion(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var questions = GetProgrammingQuestions();
        return questions.FirstOrDefault(q => q.Id == parsedId);
    }
}