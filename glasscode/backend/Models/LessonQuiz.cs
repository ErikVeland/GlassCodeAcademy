using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class LessonQuiz
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(2000)]
        public string Question { get; set; } = string.Empty;
        
        public string? Topic { get; set; }
        
        public string Difficulty { get; set; } = "Beginner"; // Beginner, Intermediate, Advanced
        
        public string? Choices { get; set; } // JSON array for multiple choice questions
        
        public string? Explanation { get; set; }
        
        public string? IndustryContext { get; set; }
        
        public string? Tags { get; set; } // JSON array of tags
        
        public string QuestionType { get; set; } = "multiple-choice"; // multiple-choice, coding, open-ended
        
        public int EstimatedTime { get; set; } // in seconds
        
        public int? CorrectAnswer { get; set; } // Index of correct answer for multiple choice
        
        public string QuizType { get; set; } = "multiple-choice"; // Type field from JSON
        
        public string? Sources { get; set; } // JSON array of sources
        
        public int SortOrder { get; set; } // Order within the lesson quiz
        
        public bool IsPublished { get; set; } = false;
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime UpdatedAt { get; set; }
        
        // Foreign key
        public int LessonId { get; set; }
        
        // Navigation properties
        public virtual Lesson Lesson { get; set; } = null!;
        
        public virtual ICollection<UserLessonQuizAttempt> UserLessonQuizAttempts { get; set; } = new List<UserLessonQuizAttempt>();
    }
}