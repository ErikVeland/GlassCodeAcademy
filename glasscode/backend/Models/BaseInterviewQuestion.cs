using System.Text.Json.Serialization;

namespace backend.Models
{
    public class BaseInterviewQuestion
    {
        public int Id { get; set; }
        public string Topic { get; set; } = string.Empty;
        public string? Type { get; set; }
        public string Question { get; set; } = string.Empty;
        public string[]? Choices { get; set; }
        public int? CorrectAnswer { get; set; }
        public string? Explanation { get; set; }
        public string? Difficulty { get; set; }
        public string? IndustryContext { get; set; }
        public string[]? Tags { get; set; }
        public string? QuestionType { get; set; }
        public int? EstimatedTime { get; set; }
        public string[]? Sources { get; set; }
        // New fields to support fixed choice order and accepted free-text answers
        public bool? FixedChoiceOrder { get; set; }
        [JsonConverter(typeof(StringArrayFlexibleConverter))]
        public string[]? ChoiceLabels { get; set; }
        [JsonConverter(typeof(StringArrayFlexibleConverter))]
        public string[]? AcceptedAnswers { get; set; }
    }
}