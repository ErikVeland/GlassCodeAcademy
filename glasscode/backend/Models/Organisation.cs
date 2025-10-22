using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Organisation
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Slug { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Team> Teams { get; set; } = new List<Team>();
        public virtual ICollection<UserOrganisation> UserOrganisations { get; set; } = new List<UserOrganisation>();
    }
}