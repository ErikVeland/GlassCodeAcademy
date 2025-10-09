namespace backend.Models {
    public class SecurityLesson {
        public string Id { get; set; } = string.Empty;
        public string? Topic { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CodeExample { get; set; } = string.Empty;
        public string Output { get; set; } = string.Empty;
    }
}