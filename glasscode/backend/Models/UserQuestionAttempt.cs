namespace backend.Models
{
    public class UserQuestionAttempt
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        
        public int QuestionId { get; set; }
        
        public string? UserAnswer { get; set; } // JSON for complex answers
        
        public bool IsCorrect { get; set; } = false;
        
        public int TimeSpentSeconds { get; set; } = 0;
        
        public DateTime CreatedAt { get; set; }
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        
        public virtual InterviewQuestion Question { get; set; } = null!;
    }
}