namespace backend.Models {
    public class Lesson {
        public int Id { get; set; }
        public string? Topic { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string CodeExample { get; set; }
        public string Output { get; set; }
    }
} 