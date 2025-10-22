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
    private readonly backend.Services.DatabaseContentService _databaseContentService;

    public GraphQLQuery(backend.Services.DatabaseContentService databaseContentService)
    {
        _databaseContentService = databaseContentService;
    }

    public async Task<IEnumerable<GraphQLLessonType>> GetGraphQLLessons()
    {
        try
        {
            var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("graphql-advanced");
            return lessons.Select(l => new GraphQLLessonType
            {
                Id = l.Id,
                Topic = l.Topic,
                Title = l.Title ?? string.Empty,
                Description = l.Description ?? string.Empty,
                CodeExample = l.CodeExample ?? string.Empty,
                Output = l.Output ?? string.Empty
            });
        }
        catch (Exception ex)
        {
            // Log the error and return empty collection
            Console.WriteLine($"Error fetching GraphQL lessons: {ex.Message}");
            return new List<GraphQLLessonType>();
        }
    }

    public async Task<GraphQLLessonType?> GetGraphQLLesson(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var lessons = await GetGraphQLLessons();
        var lesson = lessons.FirstOrDefault(l => l.Id == parsedId);
        return lesson;
    }

    public async Task<IEnumerable<GraphQLInterviewQuestionType>> GetGraphQLQuestions()
    {
        try
        {
            var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("graphql-advanced");
            return questions.Select(q => new GraphQLInterviewQuestionType
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
        catch (Exception ex)
        {
            // Log the error and return empty collection
            Console.WriteLine($"Error fetching GraphQL questions: {ex.Message}");
            return new List<GraphQLInterviewQuestionType>();
        }
    }

    public async Task<GraphQLInterviewQuestionType?> GetGraphQLQuestion(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var questions = await GetGraphQLQuestions();
        var question = questions.FirstOrDefault(q => q.Id == parsedId);
        return question;
    }
    
    // DotNet Lessons
    public async Task<IEnumerable<GraphQLLessonType>> GetDotNetLessons()
    {
        try
        {
            var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("dotnet-fundamentals");
            return lessons.Select(l => new GraphQLLessonType
            {
                Id = l.Id,
                Topic = l.Topic,
                Title = l.Title ?? string.Empty,
                Description = l.Description ?? string.Empty,
                CodeExample = l.CodeExample ?? string.Empty,
                Output = l.Output ?? string.Empty
            });
        }
        catch (Exception ex)
        {
            // Log the error and return empty collection
            Console.WriteLine($"Error fetching DotNet lessons: {ex.Message}");
            return new List<GraphQLLessonType>();
        }
    }

    public async Task<GraphQLLessonType?> GetDotNetLesson(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var lessons = await GetDotNetLessons();
        return lessons.FirstOrDefault(l => l.Id == parsedId);
    }

    public async Task<IEnumerable<GraphQLInterviewQuestionType>> GetDotNetQuestions()
    {
        try
        {
            var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("dotnet-fundamentals");
            return questions.Select(q => new GraphQLInterviewQuestionType
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
        catch (Exception ex)
        {
            // Log the error and return empty collection
            Console.WriteLine($"Error fetching DotNet questions: {ex.Message}");
            return new List<GraphQLInterviewQuestionType>();
        }
    }

    public async Task<GraphQLInterviewQuestionType?> GetDotNetQuestion(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var questions = await GetDotNetQuestions();
        return questions.FirstOrDefault(q => q.Id == parsedId);
    }

    // Programming Lessons
    public async Task<IEnumerable<GraphQLLessonType>> GetProgrammingLessons()
    {
        try
        {
            var lessons = await _databaseContentService.GetLessonsByModuleSlugAsync("programming-fundamentals");
            return lessons.Select(l => new GraphQLLessonType
            {
                Id = l.Id,
                Topic = l.Topic,
                Title = l.Title ?? string.Empty,
                Description = l.Description ?? string.Empty,
                CodeExample = l.CodeExample ?? string.Empty,
                Output = l.Output ?? string.Empty
            });
        }
        catch (Exception ex)
        {
            // Log the error and return empty collection
            Console.WriteLine($"Error fetching Programming lessons: {ex.Message}");
            return new List<GraphQLLessonType>();
        }
    }

    public async Task<GraphQLLessonType?> GetProgrammingLesson(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var lessons = await GetProgrammingLessons();
        return lessons.FirstOrDefault(l => l.Id == parsedId);
    }

    // Programming Questions
    public async Task<IEnumerable<GraphQLInterviewQuestionType>> GetProgrammingQuestions()
    {
        try
        {
            var questions = await _databaseContentService.GetInterviewQuestionsByModuleSlugAsync("programming-fundamentals");
            return questions.Select(q => new GraphQLInterviewQuestionType
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
        catch (Exception ex)
        {
            // Log the error and return empty collection
            Console.WriteLine($"Error fetching Programming questions: {ex.Message}");
            return new List<GraphQLInterviewQuestionType>();
        }
    }

    public async Task<GraphQLInterviewQuestionType?> GetProgrammingQuestion(string id)
    {
        if (!int.TryParse(id, out int parsedId)) return null;
        var questions = await GetProgrammingQuestions();
        return questions.FirstOrDefault(q => q.Id == parsedId);
    }
}