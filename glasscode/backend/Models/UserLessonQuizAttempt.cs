using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class UserLessonQuizAttempt
    {
        public int Id { get; set; }
        
        public int? SelectedAnswer { get; set; } // Index of selected answer for multiple choice
        
        public string? UserAnswer { get; set; } // Text answer for open-ended questions
        
        public bool IsCorrect { get; set; }
        
        public int TimeSpent { get; set; } // in seconds
        
        public DateTime AttemptedAt { get; set; }
        
        // Foreign keys
        public int UserId { get; set; }
        public int LessonQuizId { get; set; }
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual LessonQuiz LessonQuiz { get; set; } = null!;
    }
}