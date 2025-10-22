using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Course
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

        public string? ImageUrl { get; set; }

        public bool IsPublished { get; set; } = false;

        public int Order { get; set; }

        public string Difficulty { get; set; } = "Beginner"; // Beginner, Intermediate, Advanced

        public int EstimatedHours { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        public virtual ICollection<Module> Modules { get; set; } = new List<Module>();

        public virtual ICollection<UserProgress> UserProgress { get; set; } = new List<UserProgress>();
    }
}