using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class ContentTag
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? Color { get; set; } // Hex color for UI

        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<LessonTag> LessonTags { get; set; } = new List<LessonTag>();

        public virtual ICollection<QuestionTag> QuestionTags { get; set; } = new List<QuestionTag>();
    }
}