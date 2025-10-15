namespace backend.Models {
    public class Lesson {
        public string Id { get; set; } = string.Empty;
        public string? Topic { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? CodeExample { get; set; }
        public string? Output { get; set; }
    }
}