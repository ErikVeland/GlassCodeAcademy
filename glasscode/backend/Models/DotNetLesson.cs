using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class DotNetLesson
    {
        public int Id { get; set; }
        public string Topic { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CodeExample { get; set; } = string.Empty;
        public string Output { get; set; } = string.Empty;
    }
}