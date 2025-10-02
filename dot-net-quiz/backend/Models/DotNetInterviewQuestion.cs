using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class DotNetInterviewQuestion
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public List<string> Options { get; set; } = new List<string>();
        public int CorrectAnswer { get; set; }
        public string Difficulty { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;
    }
}