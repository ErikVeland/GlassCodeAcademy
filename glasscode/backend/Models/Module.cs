using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Module
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(100)]
        public string Slug { get; set; } = string.Empty;

        public int Order { get; set; }

        public bool IsPublished { get; set; } = false;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Foreign key
        public int CourseId { get; set; }

        // Navigation properties
        public virtual Course Course { get; set; } = null!;

        public virtual ICollection<Lesson> Lessons { get; set; } = new List<Lesson>();
    }
}