using backend.Models;
using backend.Controllers;
using System.Text.Json;
using System.IO;

namespace backend.GraphQL;

public class GraphQLLessonType
{
    public string Id { get; set; } = string.Empty;
    public string? Topic { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CodeExample { get; set; } = string.Empty;
    public string Output { get; set; } = string.Empty;
}

public class GraphQLInterviewQuestionType
{
    public string Id { get; set; } = string.Empty;
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
        return GraphQLLessonsController.Lessons.Select(l => new GraphQLLessonType
        {
            Id = l.Id,
            Topic = l.Topic,
            Title = l.Title,
            Description = l.Description,
            CodeExample = l.CodeExample,
            Output = l.Output
        });
    }

    public static GraphQLLessonType? GetGraphQLLesson(string id)
    {
        var lesson = GraphQLLessonsController.Lessons.FirstOrDefault(l => l.Id == id);
        return lesson == null ? null : new GraphQLLessonType
        {
            Id = lesson.Id,
            Topic = lesson.Topic,
            Title = lesson.Title,
            Description = lesson.Description,
            CodeExample = lesson.CodeExample,
            Output = lesson.Output
        };
    }

    public static IEnumerable<GraphQLInterviewQuestionType> GetGraphQLQuestions()
    {
        return GraphQLInterviewQuestionsController.Questions.Select(q => new GraphQLInterviewQuestionType
        {
            Id = q.Id,
            Topic = q.Topic,
            Type = q.Type,
            Question = q.Question,
            Choices = q.Choices,
            CorrectAnswer = q.CorrectAnswer,
            Explanation = q.Explanation
        });
    }

    public static GraphQLInterviewQuestionType? GetGraphQLQuestion(string id)
    {
        var question = GraphQLInterviewQuestionsController.Questions.FirstOrDefault(q => q.Id == id);
        return question == null ? null : new GraphQLInterviewQuestionType
        {
            Id = question.Id,
            Topic = question.Topic,
            Type = question.Type,
            Question = question.Question,
            Choices = question.Choices,
            CorrectAnswer = question.CorrectAnswer,
            Explanation = question.Explanation
        };
    }
    
    // DotNet Lessons
    public static IEnumerable<GraphQLLessonType> GetDotNetLessons()
    {
        var jsonPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "content", "lessons", "dotnet_lessons.json");
        if (!System.IO.File.Exists(jsonPath))
        {
            return new List<GraphQLLessonType>();
        }

        var jsonContent = System.IO.File.ReadAllText(jsonPath);
        var lessons = System.Text.Json.JsonSerializer.Deserialize<List<DotNetLesson>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        });
        
        return lessons?.Select(l => new GraphQLLessonType
        {
            Id = l.Id,
            Topic = l.Topic,
            Title = l.Title,
            Description = l.Description,
            CodeExample = l.CodeExample,
            Output = l.Output
        }) ?? new List<GraphQLLessonType>();
    }

    public static GraphQLLessonType? GetDotNetLesson(string id)
    {
        var lessons = GetDotNetLessons();
        return lessons.FirstOrDefault(l => l.Id == id);
    }

    public static IEnumerable<GraphQLInterviewQuestionType> GetDotNetQuestions()
    {
        var jsonPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "content", "quizzes", "dotnet_questions.json");
        if (!System.IO.File.Exists(jsonPath))
        {
            return new List<GraphQLInterviewQuestionType>();
        }

        var jsonContent = System.IO.File.ReadAllText(jsonPath);
        var questions = System.Text.Json.JsonSerializer.Deserialize<List<DotNetInterviewQuestion>>(jsonContent, new JsonSerializerOptions
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
        var questions = GetDotNetQuestions();
        return questions.FirstOrDefault(q => q.Id == id);
    }

    // Programming Lessons
    public static IEnumerable<GraphQLLessonType> GetProgrammingLessons()
    {
        var jsonPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "content", "lessons", "programming-fundamentals.json");
        if (!System.IO.File.Exists(jsonPath))
        {
            return new List<GraphQLLessonType>();
        }

        var jsonContent = System.IO.File.ReadAllText(jsonPath);
        var lessons = System.Text.Json.JsonSerializer.Deserialize<List<ProgrammingLesson>>(jsonContent, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            PropertyNameCaseInsensitive = true
        });
        
        return lessons?.Select(l => new GraphQLLessonType
        {
            Id = l.Id,
            Topic = l.Topic,
            Title = l.Title,
            Description = l.Description,
            CodeExample = l.CodeExample,
            Output = l.Output
        }) ?? new List<GraphQLLessonType>();
    }

    public static GraphQLLessonType? GetProgrammingLesson(string id)
    {
        var lessons = GetProgrammingLessons();
        return lessons.FirstOrDefault(l => l.Id == id);
    }

    // Programming Questions
    public static IEnumerable<GraphQLInterviewQuestionType> GetProgrammingQuestions()
    {
        var jsonPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "content", "quizzes", "programming-fundamentals.json");
        if (!System.IO.File.Exists(jsonPath))
        {
            return new List<GraphQLInterviewQuestionType>();
        }

        var jsonContent = System.IO.File.ReadAllText(jsonPath);
        var questions = System.Text.Json.JsonSerializer.Deserialize<List<ProgrammingInterviewQuestion>>(jsonContent, new JsonSerializerOptions
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
        var questions = GetProgrammingQuestions();
        return questions.FirstOrDefault(q => q.Id == id);
    }
}