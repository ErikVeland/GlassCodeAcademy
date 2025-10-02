using HotChocolate.Types;
using backend.Models;

namespace backend.GraphQL
{
    // LaravelLesson type definition for GraphQL
    public class LaravelLessonType : ObjectType<LaravelLesson>
    {
        protected override void Configure(IObjectTypeDescriptor<LaravelLesson> descriptor)
        {
            descriptor.Name("LaravelLesson");
            descriptor.Description("Represents a Laravel learning lesson with code examples");

            descriptor.Field(l => l.Id).Description("The unique identifier of the lesson");
            descriptor.Field(l => l.Topic).Description("The topic category of the lesson");
            descriptor.Field(l => l.Title).Description("The title of the lesson");
            descriptor.Field(l => l.Description).Description("A detailed description of the lesson");
            descriptor.Field(l => l.CodeExample).Description("Code example demonstrating the lesson concept");
            descriptor.Field(l => l.Output).Description("Expected output of the code example");
        }
    }

    // LaravelInterviewQuestion type definition for GraphQL
    public class LaravelInterviewQuestionType : ObjectType<LaravelInterviewQuestion>
    {
        protected override void Configure(IObjectTypeDescriptor<LaravelInterviewQuestion> descriptor)
        {
            descriptor.Name("LaravelInterviewQuestion");
            descriptor.Description("Represents a Laravel interview question with multiple choice or open-ended format");

            descriptor.Field(q => q.Id).Description("The unique identifier of the question");
            descriptor.Field(q => q.Topic).Description("The topic category of the question");
            descriptor.Field(q => q.Type).Description("The type of question (multiple-choice or open-ended)");
            descriptor.Field(q => q.Question).Description("The question text");
            descriptor.Field(q => q.Choices).Description("Available choices for multiple-choice questions");
            descriptor.Field(q => q.CorrectAnswer).Description("The index of the correct answer for multiple-choice questions");
            descriptor.Field(q => q.Explanation).Description("Explanation of the correct answer");
        }
    }
}