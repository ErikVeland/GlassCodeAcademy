namespace backend.Models
{
    /// <summary>
    /// Represents a user's progress on a lesson
    /// </summary>
    public class ProgressResult
    {
        /// <summary>
        /// The user's identifier
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// The lesson's identifier
        /// </summary>
        public int LessonId { get; set; }

        /// <summary>
        /// The module name (e.g., "dotnet", "nextjs", "graphql")
        /// </summary>
        public string Module { get; set; } = string.Empty;

        /// <summary>
        /// The status of the lesson (e.g., "completed", "in-progress")
        /// </summary>
        public string Status { get; set; } = string.Empty;
    }
}