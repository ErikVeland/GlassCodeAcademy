using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class ModuleCreateDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Slug { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        public int Order { get; set; }

        public bool IsPublished { get; set; } = false;

        [Required]
        public int CourseId { get; set; }
    }
}