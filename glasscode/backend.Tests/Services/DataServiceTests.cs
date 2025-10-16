using Xunit;
using FluentAssertions;
using backend.Services;

namespace backend.Tests.Services
{
    public class DataServiceTests
    {
        private readonly DataService _dataService;

        public DataServiceTests()
        {
            _dataService = DataService.Instance;
        }

        [Fact]
        public void DataService_ShouldBeInstantiable()
        {
            // Assert
            _dataService.Should().NotBeNull();
        }

        [Fact]
        public void ReactLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.ReactLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void ReactInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.ReactInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void TailwindLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.TailwindLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void TailwindInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.TailwindInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void NodeLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.NodeLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void NodeInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.NodeInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void SassLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.SassLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void SassInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.SassInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void VueLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.VueLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void VueInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.VueInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void TypescriptLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.TypescriptLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void TypescriptInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.TypescriptInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void DatabaseLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.DatabaseLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void DatabaseInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.DatabaseInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void TestingLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.TestingLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void TestingInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.TestingInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void ProgrammingLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.ProgrammingLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void ProgrammingInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.ProgrammingInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void WebLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.WebLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void WebInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.WebInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void NextJsLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.NextJsLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void NextJsInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.NextJsInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void PerformanceLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.PerformanceLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void PerformanceInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.PerformanceInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void SecurityLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.SecurityLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void SecurityInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.SecurityInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void VersionLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.VersionLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void VersionInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.VersionInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void LaravelLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.LaravelLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void LaravelInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.LaravelInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }

        [Fact]
        public void GraphQLLessons_ShouldNotBeNull()
        {
            // Act
            var lessons = _dataService.GraphQLLessons;

            // Assert
            lessons.Should().NotBeNull();
        }

        [Fact]
        public void GraphQLInterviewQuestions_ShouldNotBeNull()
        {
            // Act
            var questions = _dataService.GraphQLInterviewQuestions;

            // Assert
            questions.Should().NotBeNull();
        }
    }
}