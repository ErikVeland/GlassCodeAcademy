using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class DotNetInterviewQuestion : BaseInterviewQuestion
    {
        // Inherits all properties from BaseInterviewQuestion
        // Note: BaseInterviewQuestion uses Choices (string[]) instead of Options (List<string>)
        // and CorrectIndex (int) instead of CorrectAnswer (int)
    }
}