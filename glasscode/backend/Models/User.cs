using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? Username { get; set; }

        [MaxLength(100)]
        public string? FirstName { get; set; }

        [MaxLength(100)]
        public string? LastName { get; set; }

        public string? ProfileImageUrl { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public DateTime? LastLoginAt { get; set; }

        // Navigation properties
        public virtual ICollection<UserProgress> UserProgress { get; set; } = new List<UserProgress>();

        public virtual ICollection<UserLessonProgress> UserLessonProgress { get; set; } = new List<UserLessonProgress>();

        public virtual ICollection<UserQuestionAttempt> UserQuestionAttempts { get; set; } = new List<UserQuestionAttempt>();

        // RBAC navigation properties
        public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

        // Organisation and team navigation properties
        public virtual ICollection<UserOrganisation> UserOrganisations { get; set; } = new List<UserOrganisation>();
        public virtual ICollection<UserTeam> UserTeams { get; set; } = new List<UserTeam>();
    }
}