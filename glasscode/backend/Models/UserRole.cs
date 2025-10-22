using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class UserRole
    {
        public int UserId { get; set; }
        public int RoleId { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual Role Role { get; set; } = null!;

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(200)]
        public string? AssignedBy { get; set; }
    }
}