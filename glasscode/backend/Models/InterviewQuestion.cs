using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class InterviewQuestion
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(2000)]
        public string Question { get; set; } = string.Empty;
        
        public string? Choices { get; set; } // JSON array for multiple choice questions
        
        public int? CorrectAnswer { get; set; } // Index of correct answer for multiple choice
        
        public string? Explanation { get; set; }
        
        public string Type { get; set; } = "multiple-choice"; // multiple-choice, coding, open-ended
        
        public string Difficulty { get; set; } = "Beginner"; // Beginner, Intermediate, Advanced
        
        public string? Topic { get; set; }
        
        public string? IndustryContext { get; set; }
        
        public int EstimatedTime { get; set; } // in minutes
        
        public string? Metadata { get; set; } // JSON metadata
        
        public bool IsPublished { get; set; } = false;
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual ICollection<QuestionTag> QuestionTags { get; set; } = new List<QuestionTag>();
        
        public virtual ICollection<UserQuestionAttempt> UserQuestionAttempts { get; set; } = new List<UserQuestionAttempt>();
    }
}