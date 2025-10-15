namespace backend.Models {
    public class PerformanceInterviewQuestion {
        public int Id { get; set; }
        public string? Topic { get; set; }
        public string? Difficulty { get; set; }
        public string Question { get; set; } = string.Empty;
        public string[]? Choices { get; set; }
        public int CorrectIndex { get; set; }
        public int CorrectAnswer { get; set; }
        public string? Explanation { get; set; }
        public string? IndustryContext { get; set; }
        public string[]? Tags { get; set; }
        public string? QuestionType { get; set; }
        public int? EstimatedTime { get; set; }
    }
}