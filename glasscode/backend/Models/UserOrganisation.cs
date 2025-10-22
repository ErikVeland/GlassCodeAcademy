using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class UserOrganisation
    {
        public int UserId { get; set; }
        public int OrganisationId { get; set; }
        
        [MaxLength(50)]
        public string? Role { get; set; } // e.g., "owner", "admin", "member"
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        
        [MaxLength(200)]
        public string? InvitedBy { get; set; }
        
        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual Organisation Organisation { get; set; } = null!;
    }
}