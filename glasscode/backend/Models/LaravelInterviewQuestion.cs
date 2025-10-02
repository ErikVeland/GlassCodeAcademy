namespace backend.Models {
    public class LaravelInterviewQuestion {
        public int Id { get; set; }
        public string? Topic { get; set; }
        public string? Type { get; set; }
        public string? Question { get; set; }
        public string[]? Choices { get; set; }
        public int? CorrectAnswer { get; set; }
        public string? Explanation { get; set; }
    }
}