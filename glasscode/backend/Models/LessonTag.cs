namespace backend.Models
{
    public class LessonTag
    {
        public int LessonId { get; set; }

        public int TagId { get; set; }

        // Navigation properties
        public virtual Lesson Lesson { get; set; } = null!;

        public virtual ContentTag Tag { get; set; } = null!;
    }
}