using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class LessonQuizUpdateDto
    {
        [Required]
        [MaxLength(2000)]
        public string Question { get; set; } = string.Empty;

        public string? Topic { get; set; }

        public string Difficulty { get; set; } = "Beginner";

        public string? Choices { get; set; } // JSON array for multiple choice questions

        public bool FixedChoiceOrder { get; set; } = false;
        public string? ChoiceLabels { get; set; } // JSON array of labels
        public string? AcceptedAnswers { get; set; } // JSON array of accepted open-ended answers

        public string? Explanation { get; set; }

        public string? IndustryContext { get; set; }

        public string? Tags { get; set; } // JSON array of tags

        public string QuestionType { get; set; } = "multiple-choice";

        public int EstimatedTime { get; set; } = 90; // in seconds

        public int? CorrectAnswer { get; set; }

        public string QuizType { get; set; } = "multiple-choice";

        public string? Sources { get; set; } // JSON array of sources

        public int SortOrder { get; set; }

        public bool IsPublished { get; set; } = false;
    }
}