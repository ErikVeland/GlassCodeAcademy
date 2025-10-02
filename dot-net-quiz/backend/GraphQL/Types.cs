using backend.Models;
using HotChocolate.Types;

namespace backend.GraphQL
{
    // Lesson type definition for GraphQL
    public class LessonType : ObjectType<Lesson>
    {
        protected override void Configure(IObjectTypeDescriptor<Lesson> descriptor)
        {
            descriptor.Description("Represents a learning lesson with code examples");

            descriptor.Field(l => l.Id).Description("The unique identifier of the lesson");
            descriptor.Field(l => l.Topic).Description("The topic category of the lesson");
            descriptor.Field(l => l.Title).Description("The title of the lesson");
            descriptor.Field(l => l.Description).Description("A detailed description of the lesson");
            descriptor.Field(l => l.CodeExample).Description("Code example demonstrating the lesson concept");
            descriptor.Field(l => l.Output).Description("Expected output of the code example");
        }
    }

    // InterviewQuestion type definition for GraphQL
    public class InterviewQuestionType : ObjectType<InterviewQuestion>
    {
        protected override void Configure(IObjectTypeDescriptor<InterviewQuestion> descriptor)
        {
            descriptor.Description("Represents an interview question with multiple choice or open-ended format");

            descriptor.Field(q => q.Id).Description("The unique identifier of the question");
            descriptor.Field(q => q.Topic).Description("The topic category of the question");
            descriptor.Field(q => q.Type).Description("The type of question (multiple-choice or open-ended)");
            descriptor.Field(q => q.Question).Description("The question text");
            descriptor.Field(q => q.Choices).Description("Available choices for multiple-choice questions");
            descriptor.Field(q => q.CorrectAnswer).Description("The index of the correct answer for multiple-choice questions");
            descriptor.Field(q => q.Explanation).Description("Explanation of the correct answer");
        }
    }

    // AnswerResult type definition for GraphQL
    public class AnswerResultType : ObjectType<AnswerResult>
    {
        protected override void Configure(IObjectTypeDescriptor<AnswerResult> descriptor)
        {
            descriptor.Description("Represents the result of answering a question");

            descriptor.Field(r => r.IsCorrect).Description("Whether the answer is correct");
            descriptor.Field(r => r.Explanation).Description("Explanation of the correct answer");
        }
    }

    // ProgressResult type definition for GraphQL
    public class ProgressResultType : ObjectType<ProgressResult>
    {
        protected override void Configure(IObjectTypeDescriptor<ProgressResult> descriptor)
        {
            descriptor.Description("Represents a user's progress on a lesson");

            descriptor.Field(p => p.UserId).Description("The user's identifier");
            descriptor.Field(p => p.LessonId).Description("The lesson's identifier");
            descriptor.Field(p => p.Module).Description("The module name");
            descriptor.Field(p => p.Status).Description("The status of the lesson (e.g., completed)");
        }
    }
}