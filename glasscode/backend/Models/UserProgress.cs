namespace backend.Models
{
    public class UserProgress
    {
        public int Id { get; set; }
        
        public int UserId { get; set; }
        
        public int CourseId { get; set; }
        
        public int CompletedLessons { get; set; } = 0;
        
        public int TotalLessons { get; set; } = 0;
        
        public decimal ProgressPercentage { get; set; } = 0;
        
        public DateTime? StartedAt { get; set; }
        
        public DateTime? CompletedAt { get; set; }
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        
        public virtual Course Course { get; set; } = null!;
    }
}