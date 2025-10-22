using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Team
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string? Description { get; set; }
        
        public int OrganisationId { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual Organisation Organisation { get; set; } = null!;
        public virtual ICollection<UserTeam> UserTeams { get; set; } = new List<UserTeam>();
    }
}