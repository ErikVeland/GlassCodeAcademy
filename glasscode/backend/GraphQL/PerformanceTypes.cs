using HotChocolate.Types;
using backend.Models;

namespace backend.GraphQL
{
    public class PerformanceLessonType : ObjectType<PerformanceLesson>
    {
        protected override void Configure(IObjectTypeDescriptor<PerformanceLesson> descriptor)
        {
            descriptor.Name("PerformanceLesson");
            descriptor.Description("Represents a Performance Optimization learning lesson with code examples");

            descriptor.Field(l => l.Id).Description("The unique identifier of the lesson");
            descriptor.Field(l => l.Topic).Description("The topic category of the lesson");
            descriptor.Field(l => l.Title).Description("The title of the lesson");
            descriptor.Field(l => l.Description).Description("A detailed description of the lesson");
            descriptor.Field(l => l.CodeExample).Description("Code example demonstrating the lesson concept");
            descriptor.Field(l => l.Output).Description("Expected output of the code example");
        }
    }

    public class PerformanceInterviewQuestionType : ObjectType<PerformanceInterviewQuestion>
    {
        protected override void Configure(IObjectTypeDescriptor<PerformanceInterviewQuestion> descriptor)
        {
            descriptor.Name("PerformanceInterviewQuestion");
            descriptor.Description("Represents a Performance Optimization interview question with multiple choice or open-ended format");

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