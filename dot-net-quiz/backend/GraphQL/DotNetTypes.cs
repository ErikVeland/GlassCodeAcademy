using backend.Models;

namespace backend.GraphQL;

public class DotNetLessonType
{
    public int Id { get; set; }
    public string? Topic { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string CodeExample { get; set; } = string.Empty;
    public string Output { get; set; } = string.Empty;
}

public class DotNetInterviewQuestionType
{
    public int Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new List<string>();
    public int CorrectAnswer { get; set; }
    public string Difficulty { get; set; } = string.Empty;
    public string Explanation { get; set; } = string.Empty;
}