namespace backend.Models
{
    public class QuestionTag
    {
        public int QuestionId { get; set; }
        
        public int TagId { get; set; }
        
        // Navigation properties
        public virtual InterviewQuestion Question { get; set; } = null!;
        
        public virtual ContentTag Tag { get; set; } = null!;
    }
}