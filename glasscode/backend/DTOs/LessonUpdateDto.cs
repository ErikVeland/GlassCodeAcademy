using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace backend.DTOs
{
    public class LessonUpdateDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Slug { get; set; } = string.Empty;

        [Required]
        public int Order { get; set; }

        public JsonElement? Content { get; set; }

        public JsonElement? Metadata { get; set; }

        public bool IsPublished { get; set; } = false;

        [Required]
        public string Difficulty { get; set; } = string.Empty;

        public int? EstimatedMinutes { get; set; }

        [Required]
        public int ModuleId { get; set; }
    }
}