namespace backend.Models {
    public class PerformanceInterviewQuestion : BaseInterviewQuestion {
        public string? Difficulty { get; set; }
        public int CorrectIndex { get; set; }
        public string? IndustryContext { get; set; }
        public string[]? Tags { get; set; }
        public string? QuestionType { get; set; }
        public int? EstimatedTime { get; set; }
    }
}