namespace backend.Models
{
    public class BaseLesson
    {
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

        // Additional properties for simple lesson formats
        public string? Topic { get; set; }
        public string? Description { get; set; }
        public string? CodeExample { get; set; }
        public string? Output { get; set; }
    }

    public class CodeExample
    {
        public string Example { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
    }

    public class Pitfall
    {
        public string Mistake { get; set; } = string.Empty;
        public string Solution { get; set; } = string.Empty;
        public string Severity { get; set; } = string.Empty;
    }

    public class Exercise
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Checkpoints { get; set; } = new List<string>();
    }

    public class Source
    {
        public string Title { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
    }


}