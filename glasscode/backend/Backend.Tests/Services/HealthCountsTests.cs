using System.Linq;
using backend.Services;
using FluentAssertions;
using Xunit;
using Xunit.Abstractions;
using Backend.Tests.Infrastructure;

namespace Backend.Tests.Services
{
    /// <summary>
    /// Health enforcement: ensures all categories have non-zero lessons and questions.
    /// Fails the build if any category drops to zero.
    /// </summary>
    public class HealthCountsTests : TestBase
    {
        public HealthCountsTests(ITestOutputHelper output) : base(output) {}

        [Fact]
        public void AllLessonCategories_Should_Be_NonEmpty()
        {
            var ds = DataService.Instance;

            var lessonSets = new[]
            {
                (Name: "DotNet", Items: ds.DotNetLessons),
                (Name: "GraphQL", Items: ds.GraphQLLessons),
                (Name: "Laravel", Items: ds.LaravelLessons),
                (Name: "React", Items: ds.ReactLessons),
                (Name: "Tailwind", Items: ds.TailwindLessons),
                (Name: "Node", Items: ds.NodeLessons),
                (Name: "Sass", Items: ds.SassLessons),
                (Name: "Vue", Items: ds.VueLessons),
                (Name: "TypeScript", Items: ds.TypescriptLessons),
                (Name: "Database", Items: ds.DatabaseLessons),
                (Name: "Testing", Items: ds.TestingLessons),
                (Name: "Programming", Items: ds.ProgrammingLessons),
                (Name: "Web", Items: ds.WebLessons),
                (Name: "NextJs", Items: ds.NextJsLessons),
                (Name: "Performance", Items: ds.PerformanceLessons),
                (Name: "Security", Items: ds.SecurityLessons),
                (Name: "Version", Items: ds.VersionLessons)
            };

            foreach (var (name, items) in lessonSets)
            {
                items.Should().NotBeNull($"{name} lessons should be loaded");
                items.Any().Should().BeTrue($"{name} lessons should not be empty");
                Output.WriteLine($"{name}: {items.Count()} lessons");
            }
        }

        [Fact]
        public void AllQuestionCategories_Should_Be_NonEmpty()
        {
            var ds = DataService.Instance;

            var questionSets = new[]
            {
                (Name: "DotNet", Items: ds.DotNetInterviewQuestions),
                (Name: "GraphQL", Items: ds.GraphQLInterviewQuestions),
                (Name: "Laravel", Items: ds.LaravelInterviewQuestions),
                (Name: "React", Items: ds.ReactInterviewQuestions),
                (Name: "Tailwind", Items: ds.TailwindInterviewQuestions),
                (Name: "Node", Items: ds.NodeInterviewQuestions),
                (Name: "Sass", Items: ds.SassInterviewQuestions),
                (Name: "Vue", Items: ds.VueInterviewQuestions),
                (Name: "TypeScript", Items: ds.TypescriptInterviewQuestions),
                (Name: "Database", Items: ds.DatabaseInterviewQuestions),
                (Name: "Testing", Items: ds.TestingInterviewQuestions),
                (Name: "Programming", Items: ds.ProgrammingInterviewQuestions),
                (Name: "Web", Items: ds.WebInterviewQuestions),
                (Name: "NextJs", Items: ds.NextJsInterviewQuestions),
                (Name: "Performance", Items: ds.PerformanceInterviewQuestions),
                (Name: "Security", Items: ds.SecurityInterviewQuestions),
                (Name: "Version", Items: ds.VersionInterviewQuestions)
            };

            foreach (var (name, items) in questionSets)
            {
                items.Should().NotBeNull($"{name} questions should be loaded");
                items.Any().Should().BeTrue($"{name} questions should not be empty");
                Output.WriteLine($"{name}: {items.Count()} questions");
            }
        }
    }
}