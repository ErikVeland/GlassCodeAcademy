using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class UserTeam
    {
        public int UserId { get; set; }
        public int TeamId { get; set; }
        
        [MaxLength(50)]
        public string? Role { get; set; } // e.g., "lead", "member"
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        
        [MaxLength(200)]
        public string? AssignedBy { get; set; }
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual Team Team { get; set; } = null!;
    }
}