namespace backend.Models
{
    public class UserLessonProgress
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int LessonId { get; set; }

        public bool IsCompleted { get; set; } = false;

        public int TimeSpentMinutes { get; set; } = 0;

        public DateTime? StartedAt { get; set; }

        public DateTime? CompletedAt { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;

        public virtual Lesson Lesson { get; set; } = null!;
    }
}