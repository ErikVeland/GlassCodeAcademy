using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace backend.DTOs
{
    public class LessonCreateDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string Slug { get; set; } = string.Empty;
        
        public int Order { get; set; }
        
        public JsonElement? Content { get; set; } // JSON content
        
        public JsonElement? Metadata { get; set; } // JSON metadata (objectives, tags, etc.)
        
        public bool IsPublished { get; set; } = false;
        
        public string Difficulty { get; set; } = "Beginner"; // Beginner, Intermediate, Advanced
        
        public int EstimatedMinutes { get; set; }
        
        [Required]
        public int ModuleId { get; set; }
    }
}