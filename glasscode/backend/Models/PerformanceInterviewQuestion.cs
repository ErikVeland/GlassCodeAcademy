namespace backend.Models {
    public class PerformanceInterviewQuestion {
        public string Id { get; set; } = string.Empty;
        public string? Topic { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Question { get; set; } = string.Empty;
        public string[]? Choices { get; set; }
        public int? CorrectAnswer { get; set; }
        public string? Explanation { get; set; }
    }
}