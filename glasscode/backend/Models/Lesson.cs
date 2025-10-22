using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Lesson
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Slug { get; set; } = string.Empty;

        public int Order { get; set; }

        public string? Content { get; set; } // JSON content

        public string? Metadata { get; set; } // JSON metadata (objectives, tags, etc.)

        public bool IsPublished { get; set; } = false;

        public string Difficulty { get; set; } = "Beginner"; // Beginner, Intermediate, Advanced

        public int EstimatedMinutes { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Foreign key
        public int ModuleId { get; set; }

        // Navigation properties
        public virtual Module Module { get; set; } = null!;

        public virtual ICollection<LessonTag> LessonTags { get; set; } = new List<LessonTag>();

        public virtual ICollection<UserLessonProgress> UserLessonProgress { get; set; } = new List<UserLessonProgress>();

        public virtual ICollection<LessonQuiz> LessonQuizzes { get; set; } = new List<LessonQuiz>();
    }
}