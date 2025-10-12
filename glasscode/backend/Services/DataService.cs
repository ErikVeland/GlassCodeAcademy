using backend.Models;
using backend.Controllers;
using System.Text.Json;
using System.IO;
using System.Collections.Generic;
using System.Linq;

namespace backend.Services
{
    public class DataService
    {
        // Singleton instance to hold all data
        private static readonly DataService _instance = new DataService();
        public static DataService Instance => _instance;

        public DataService()
        {
            LoadReactData();
            LoadTailwindData();
            LoadNodeData();
            LoadSassData();
            LoadVueData();
            LoadTypescriptData();
            LoadDatabaseData();
            LoadTestingData();
            LoadProgrammingData();
            LoadWebData();
            LoadNextJsData();
            LoadPerformanceData();
            LoadSecurityData();
            LoadVersionData();
            LoadLaravelData();
            
            // Verify data integrity after loading
            VerifyDataIntegrity();
        }

        // Verify that all data was loaded correctly
        private void VerifyDataIntegrity()
        {
            Console.WriteLine("🔍 Verifying data integrity...");
            
            var dataStats = new Dictionary<string, int>
            {
                { "DotNet Lessons", DotNetLessons.Count() },
                { "GraphQL Lessons", GraphQLLessons.Count() },
                { "DotNet Questions", DotNetInterviewQuestions.Count() },
                { "GraphQL Questions", GraphQLInterviewQuestions.Count() },
                { "Laravel Lessons", LaravelLessons.Count() },
                { "Laravel Questions", LaravelInterviewQuestions.Count() },
                { "React Lessons", ReactLessons.Count() },
                { "React Questions", ReactInterviewQuestions.Count() },
                { "Tailwind Lessons", TailwindLessons.Count() },
                { "Tailwind Questions", TailwindInterviewQuestions.Count() },
                { "Node Lessons", NodeLessons.Count() },
                { "Node Questions", NodeInterviewQuestions.Count() },
                { "Sass Lessons", SassLessons.Count() },
                { "Sass Questions", SassInterviewQuestions.Count() },
                { "Vue Lessons", VueLessons.Count() },
                { "Vue Questions", VueInterviewQuestions.Count() },
                { "TypeScript Lessons", TypescriptLessons.Count() },
                { "TypeScript Questions", TypescriptInterviewQuestions.Count() },
                { "Database Lessons", DatabaseLessons.Count() },
                { "Database Questions", DatabaseInterviewQuestions.Count() },
                { "Testing Lessons", TestingLessons.Count() },
                { "Testing Questions", TestingInterviewQuestions.Count() },
                { "Programming Lessons", ProgrammingLessons.Count() },
                { "Programming Questions", ProgrammingInterviewQuestions.Count() },
                { "Web Lessons", WebLessons.Count() },
                { "Web Questions", WebInterviewQuestions.Count() },
                { "Next.js Lessons", NextJsLessons.Count() },
                { "Next.js Questions", NextJsInterviewQuestions.Count() },
                { "Performance Lessons", PerformanceLessons.Count() },
                { "Performance Questions", PerformanceInterviewQuestions.Count() },
                { "Security Lessons", SecurityLessons.Count() },
                { "Security Questions", SecurityInterviewQuestions.Count() },
                { "Version Lessons", VersionLessons.Count() },
                { "Version Questions", VersionInterviewQuestions.Count() }
            };

            foreach (var stat in dataStats)
            {
                if (stat.Value == 0)
                {
                    Console.WriteLine($"⚠️  WARNING: {stat.Key} has 0 items loaded");
                }
                else
                {
                    Console.WriteLine($"✅ {stat.Key}: {stat.Value} items");
                }
            }

            Console.WriteLine("✅ Data integrity verification completed");
        }

        // Data collections
        public IEnumerable<Lesson> DotNetLessons => LessonsController.Lessons;
        public IEnumerable<Lesson> GraphQLLessons => GraphQLLessonsController.Lessons.Select(gl => new Lesson 
        {
            Id = gl.Id,
            Topic = gl.Topic,
            Title = gl.Title,
            Description = gl.Description,
            CodeExample = gl.CodeExample,
            Output = gl.Output
        });
        public IEnumerable<InterviewQuestion> DotNetInterviewQuestions => InterviewQuestionsController.Questions;
        public IEnumerable<InterviewQuestion> GraphQLInterviewQuestions => GraphQLInterviewQuestionsController.Questions.Select(gq => new InterviewQuestion
        {
            Id = gq.Id,
            Topic = gq.Topic,
            Type = gq.Type,
            Question = gq.Question,
            Choices = gq.Choices,
            CorrectAnswer = gq.CorrectAnswer,
            Explanation = gq.Explanation
        });
        
        // Laravel data collections
        public IEnumerable<LaravelLesson> LaravelLessons { get; private set; } = new List<LaravelLesson>();
        public IEnumerable<LaravelInterviewQuestion> LaravelInterviewQuestions { get; private set; } = new List<LaravelInterviewQuestion>();
        
        // React data collections
        public IEnumerable<ReactLesson> ReactLessons { get; private set; } = new List<ReactLesson>();
        public IEnumerable<ReactInterviewQuestion> ReactInterviewQuestions { get; private set; } = new List<ReactInterviewQuestion>();
        
        // Tailwind data collections
        public IEnumerable<TailwindLesson> TailwindLessons { get; private set; } = new List<TailwindLesson>();
        public IEnumerable<TailwindInterviewQuestion> TailwindInterviewQuestions { get; private set; } = new List<TailwindInterviewQuestion>();
        
        // Node.js data collections
        public IEnumerable<NodeLesson> NodeLessons { get; private set; } = new List<NodeLesson>();
        public IEnumerable<NodeInterviewQuestion> NodeInterviewQuestions { get; private set; } = new List<NodeInterviewQuestion>();
        
        // SASS data collections
        public IEnumerable<SassLesson> SassLessons { get; private set; } = new List<SassLesson>();
        public IEnumerable<SassInterviewQuestion> SassInterviewQuestions { get; private set; } = new List<SassInterviewQuestion>();
        
        // Vue data collections
        public IEnumerable<VueLesson> VueLessons { get; private set; } = new List<VueLesson>();
        public IEnumerable<VueInterviewQuestion> VueInterviewQuestions { get; private set; } = new List<VueInterviewQuestion>();
        
        // TypeScript data collections
        public IEnumerable<TypescriptLesson> TypescriptLessons { get; private set; } = new List<TypescriptLesson>();
        public IEnumerable<TypescriptInterviewQuestion> TypescriptInterviewQuestions { get; private set; } = new List<TypescriptInterviewQuestion>();
        
        // Database data collections
        public IEnumerable<DatabaseLesson> DatabaseLessons { get; private set; } = new List<DatabaseLesson>();
        public IEnumerable<DatabaseInterviewQuestion> DatabaseInterviewQuestions { get; private set; } = new List<DatabaseInterviewQuestion>();
        
        // Testing data collections
        public IEnumerable<TestingLesson> TestingLessons { get; private set; } = new List<TestingLesson>();
        public IEnumerable<TestingInterviewQuestion> TestingInterviewQuestions { get; private set; } = new List<TestingInterviewQuestion>();

        // Programming data collections
        public IEnumerable<ProgrammingLesson> ProgrammingLessons { get; private set; } = new List<ProgrammingLesson>();
        public IEnumerable<ProgrammingInterviewQuestion> ProgrammingInterviewQuestions { get; private set; } = new List<ProgrammingInterviewQuestion>();

        // Web Fundamentals data collections
        public IEnumerable<WebLesson> WebLessons { get; private set; } = new List<WebLesson>();
        public IEnumerable<WebInterviewQuestion> WebInterviewQuestions { get; private set; } = new List<WebInterviewQuestion>();

        // Next.js data collections
        public IEnumerable<NextJsLesson> NextJsLessons { get; private set; } = new List<NextJsLesson>();
        public IEnumerable<NextJsInterviewQuestion> NextJsInterviewQuestions { get; private set; } = new List<NextJsInterviewQuestion>();

        // Performance Optimization data collections
        public IEnumerable<PerformanceLesson> PerformanceLessons { get; private set; } = new List<PerformanceLesson>();
        public IEnumerable<PerformanceInterviewQuestion> PerformanceInterviewQuestions { get; private set; } = new List<PerformanceInterviewQuestion>();

        // Security Fundamentals data collections
        public IEnumerable<SecurityLesson> SecurityLessons { get; private set; } = new List<SecurityLesson>();
        public IEnumerable<SecurityInterviewQuestion> SecurityInterviewQuestions { get; private set; } = new List<SecurityInterviewQuestion>();

        // Version Control data collections
        public IEnumerable<VersionLesson> VersionLessons { get; private set; } = new List<VersionLesson>();
        public IEnumerable<VersionInterviewQuestion> VersionInterviewQuestions { get; private set; } = new List<VersionInterviewQuestion>();

        // Helper method to validate JSON format
        private void ValidateJsonFormat(string json, string dataType)
        {
            try
            {
                // Try to parse the JSON to validate its format
                using var document = System.Text.Json.JsonDocument.Parse(json, new JsonDocumentOptions { AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip });
                Console.WriteLine($"✅ {dataType} JSON format validated successfully");
            }
            catch (System.Text.Json.JsonException ex)
            {
                Console.WriteLine($"❌ Invalid JSON format in {dataType}: {ex.Message}");
                Console.WriteLine($"JSON snippet: {json.Substring(0, Math.Min(100, json.Length))}...");
                throw; // Re-throw to handle in the calling method
            }
        }

        // Helper methods
        public static IEnumerable<T> ApplyQuery<T>(IEnumerable<T> items, string? topic, string? sortBy, string? sortOrder, int? limit, int? offset)
        {
            var query = items;
            if (!string.IsNullOrEmpty(topic))
            {
                var prop = typeof(T).GetProperty("Topic");
                if (prop != null)
                    query = query.Where(x => (prop.GetValue(x)?.ToString() ?? "").Equals(topic, StringComparison.OrdinalIgnoreCase));
            }
            if (!string.IsNullOrEmpty(sortBy))
            {
                var prop = typeof(T).GetProperty(sortBy);
                if (prop != null)
                {
                    query = (sortOrder?.ToLower() == "desc")
                        ? query.OrderByDescending(x => prop.GetValue(x))
                        : query.OrderBy(x => prop.GetValue(x));
                }
            }
            if (offset.HasValue) query = query.Skip(offset.Value);
            if (limit.HasValue) query = query.Take(limit.Value);
            return query;
        }

        // Answer validation
        public AnswerResult ValidateAnswer(string questionId, int answerIndex)
        {
            // Try to find the question in any collection
            InterviewQuestion? question = null;
            
            // Check DotNet questions first
            if (int.TryParse(questionId, out int dotNetQuestionId))
            {
                question = DotNetInterviewQuestions.FirstOrDefault(q => q.Id == dotNetQuestionId);
                if (question != null)
                {
                    bool isCorrect = question.Type == "open-ended" || 
                                    (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

                    return new AnswerResult
                    {
                        IsCorrect = isCorrect,
                        Explanation = question.Explanation
                    };
                }
            }
            
            // Check NextJs questions
            var nextJsQuestion = NextJsInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (nextJsQuestion != null)
            {
                bool isCorrect = nextJsQuestion.Type == "open-ended" || 
                                (nextJsQuestion.CorrectAnswer.HasValue && answerIndex == nextJsQuestion.CorrectAnswer.Value);

                return new AnswerResult
                {
                    IsCorrect = isCorrect,
                    Explanation = nextJsQuestion.Explanation
                };
            }
            
            // Check GraphQL questions
            if (int.TryParse(questionId, out int graphqlQuestionId))
            {
                var graphqlQuestion = GraphQLInterviewQuestions.FirstOrDefault(q => q.Id == graphqlQuestionId);
                if (graphqlQuestion != null)
                {
                    bool isCorrect = graphqlQuestion.Type == "open-ended" || 
                                    (graphqlQuestion.CorrectAnswer.HasValue && answerIndex == graphqlQuestion.CorrectAnswer.Value);

                    return new AnswerResult
                    {
                        IsCorrect = isCorrect,
                        Explanation = graphqlQuestion.Explanation
                    };
                }
            }

            return new AnswerResult { IsCorrect = false, Explanation = "Question not found." };
        }

        // Laravel answer validation
        public AnswerResult ValidateLaravelAnswer(int questionId, int answerIndex)
        {
            var question = LaravelInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Progress tracking
        public ProgressResult TrackProgress(int userId, int lessonId, string module)
        {
            // In-memory demo: just echo back the input
            return new ProgressResult { UserId = userId, LessonId = lessonId, Module = module, Status = "completed" };
        }

        // Load React data from JSON files
        private void LoadReactData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "react_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    // Validate JSON before deserialization
                    ValidateJsonFormat(lessonsJson, "React Lessons");
                    ReactLessons = System.Text.Json.JsonSerializer.Deserialize<List<ReactLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<ReactLesson>();
                }
                else
                {
                    Console.WriteLine($"React lessons file not found at {lessonsPath}");
                    ReactLessons = new List<ReactLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "react_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    // Validate JSON before deserialization
                    ValidateJsonFormat(questionsJson, "React Questions");
                    ReactInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<ReactInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<ReactInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"React questions file not found at {questionsPath}");
                    ReactInterviewQuestions = new List<ReactInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing React data: {jsonEx.Message}");
                ReactLessons = new List<ReactLesson>();
                ReactInterviewQuestions = new List<ReactInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading React data: {ex.Message}");
                ReactLessons = new List<ReactLesson>();
                ReactInterviewQuestions = new List<ReactInterviewQuestion>();
            }
        }

        // Load Tailwind data from JSON files
        private void LoadTailwindData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "tailwind_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    TailwindLessons = System.Text.Json.JsonSerializer.Deserialize<List<TailwindLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<TailwindLesson>();
                }
                else
                {
                    Console.WriteLine($"Tailwind lessons file not found at {lessonsPath}");
                    TailwindLessons = new List<TailwindLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "tailwind_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    TailwindInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<TailwindInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<TailwindInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"Tailwind questions file not found at {questionsPath}");
                    TailwindInterviewQuestions = new List<TailwindInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing Tailwind data: {jsonEx.Message}");
                TailwindLessons = new List<TailwindLesson>();
                TailwindInterviewQuestions = new List<TailwindInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading Tailwind data: {ex.Message}");
                TailwindLessons = new List<TailwindLesson>();
                TailwindInterviewQuestions = new List<TailwindInterviewQuestion>();
            }
        }

        // Load Node.js data from JSON files
        private void LoadNodeData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "node_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    NodeLessons = System.Text.Json.JsonSerializer.Deserialize<List<NodeLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<NodeLesson>();
                }
                else
                {
                    Console.WriteLine($"Node.js lessons file not found at {lessonsPath}");
                    NodeLessons = new List<NodeLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "node_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    NodeInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<NodeInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<NodeInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"Node.js questions file not found at {questionsPath}");
                    NodeInterviewQuestions = new List<NodeInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing Node.js data: {jsonEx.Message}");
                NodeLessons = new List<NodeLesson>();
                NodeInterviewQuestions = new List<NodeInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading Node.js data: {ex.Message}");
                NodeLessons = new List<NodeLesson>();
                NodeInterviewQuestions = new List<NodeInterviewQuestion>();
            }
        }

        // Load SASS data from JSON files
        private void LoadSassData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "sass_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    SassLessons = System.Text.Json.JsonSerializer.Deserialize<List<SassLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<SassLesson>();
                }
                else
                {
                    Console.WriteLine($"SASS lessons file not found at {lessonsPath}");
                    SassLessons = new List<SassLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "sass_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    SassInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<SassInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<SassInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"SASS questions file not found at {questionsPath}");
                    SassInterviewQuestions = new List<SassInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing SASS data: {jsonEx.Message}");
                SassLessons = new List<SassLesson>();
                SassInterviewQuestions = new List<SassInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading SASS data: {ex.Message}");
                SassLessons = new List<SassLesson>();
                SassInterviewQuestions = new List<SassInterviewQuestion>();
            }
        }

        // Load Vue data from JSON files
        private void LoadVueData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "vue_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    VueLessons = System.Text.Json.JsonSerializer.Deserialize<List<VueLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<VueLesson>();
                }
                else
                {
                    Console.WriteLine($"Vue lessons file not found at {lessonsPath}");
                    VueLessons = new List<VueLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "vue_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    VueInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<VueInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<VueInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"Vue questions file not found at {questionsPath}");
                    VueInterviewQuestions = new List<VueInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing Vue data: {jsonEx.Message}");
                VueLessons = new List<VueLesson>();
                VueInterviewQuestions = new List<VueInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading Vue data: {ex.Message}");
                VueLessons = new List<VueLesson>();
                VueInterviewQuestions = new List<VueInterviewQuestion>();
            }
        }

        // Load TypeScript data from JSON files
        private void LoadTypescriptData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "typescript_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    TypescriptLessons = System.Text.Json.JsonSerializer.Deserialize<List<TypescriptLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<TypescriptLesson>();
                }
                else
                {
                    Console.WriteLine($"TypeScript lessons file not found at {lessonsPath}");
                    TypescriptLessons = new List<TypescriptLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "typescript_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    TypescriptInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<TypescriptInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<TypescriptInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"TypeScript questions file not found at {questionsPath}");
                    TypescriptInterviewQuestions = new List<TypescriptInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing TypeScript data: {jsonEx.Message}");
                TypescriptLessons = new List<TypescriptLesson>();
                TypescriptInterviewQuestions = new List<TypescriptInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading TypeScript data: {ex.Message}");
                TypescriptLessons = new List<TypescriptLesson>();
                TypescriptInterviewQuestions = new List<TypescriptInterviewQuestion>();
            }
        }

        // Load Database data from JSON files
        private void LoadDatabaseData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "database_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    DatabaseLessons = System.Text.Json.JsonSerializer.Deserialize<List<DatabaseLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<DatabaseLesson>();
                }
                else
                {
                    Console.WriteLine($"Database lessons file not found at {lessonsPath}");
                    DatabaseLessons = new List<DatabaseLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "database_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    DatabaseInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<DatabaseInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<DatabaseInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"Database questions file not found at {questionsPath}");
                    DatabaseInterviewQuestions = new List<DatabaseInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing Database data: {jsonEx.Message}");
                DatabaseLessons = new List<DatabaseLesson>();
                DatabaseInterviewQuestions = new List<DatabaseInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading Database data: {ex.Message}");
                DatabaseLessons = new List<DatabaseLesson>();
                DatabaseInterviewQuestions = new List<DatabaseInterviewQuestion>();
            }
        }

        // Load Testing data from JSON files
        private void LoadTestingData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "testing_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    TestingLessons = System.Text.Json.JsonSerializer.Deserialize<List<TestingLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<TestingLesson>();
                }
                else
                {
                    Console.WriteLine($"Testing lessons file not found at {lessonsPath}");
                    TestingLessons = new List<TestingLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "testing_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    TestingInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<TestingInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<TestingInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"Testing questions file not found at {questionsPath}");
                    TestingInterviewQuestions = new List<TestingInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing Testing data: {jsonEx.Message}");
                TestingLessons = new List<TestingLesson>();
                TestingInterviewQuestions = new List<TestingInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading Testing data: {ex.Message}");
                TestingLessons = new List<TestingLesson>();
                TestingInterviewQuestions = new List<TestingInterviewQuestion>();
            }
        }

        // Load Programming data from JSON files
        private void LoadProgrammingData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "programming_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    ProgrammingLessons = System.Text.Json.JsonSerializer.Deserialize<List<ProgrammingLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<ProgrammingLesson>();
                }
                else
                {
                    Console.WriteLine($"Programming lessons file not found at {lessonsPath}");
                    ProgrammingLessons = new List<ProgrammingLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "programming_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    ProgrammingInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<ProgrammingInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<ProgrammingInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"Programming questions file not found at {questionsPath}");
                    ProgrammingInterviewQuestions = new List<ProgrammingInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing Programming data: {jsonEx.Message}");
                ProgrammingLessons = new List<ProgrammingLesson>();
                ProgrammingInterviewQuestions = new List<ProgrammingInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading Programming data: {ex.Message}");
                ProgrammingLessons = new List<ProgrammingLesson>();
                ProgrammingInterviewQuestions = new List<ProgrammingInterviewQuestion>();
            }
        }

        // Load Web data from JSON files
        private void LoadWebData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "web_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    WebLessons = System.Text.Json.JsonSerializer.Deserialize<List<WebLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<WebLesson>();
                }
                else
                {
                    Console.WriteLine($"Web lessons file not found at {lessonsPath}");
                    WebLessons = new List<WebLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "web_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    WebInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<WebInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<WebInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"Web questions file not found at {questionsPath}");
                    WebInterviewQuestions = new List<WebInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing Web data: {jsonEx.Message}");
                WebLessons = new List<WebLesson>();
                WebInterviewQuestions = new List<WebInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading Web Fundamentals data: {ex.Message}");
                WebLessons = new List<WebLesson>();
                WebInterviewQuestions = new List<WebInterviewQuestion>();
            }
        }

        // Load Next.js data from JSON files
        private void LoadNextJsData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "nextjs_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    ValidateJsonFormat(lessonsJson, "Next.js Lessons");
                    NextJsLessons = System.Text.Json.JsonSerializer.Deserialize<List<NextJsLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<NextJsLesson>();
                    Console.WriteLine($"✅ Loaded {NextJsLessons.Count()} Next.js lessons");
                }
                else
                {
                    Console.WriteLine($"❌ Next.js lessons file not found at {lessonsPath}");
                    NextJsLessons = new List<NextJsLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "nextjs_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    ValidateJsonFormat(questionsJson, "Next.js Questions");
                    var options = new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    };

                    using var document = System.Text.Json.JsonDocument.Parse(questionsJson, new JsonDocumentOptions { AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip });
                    if (document.RootElement.ValueKind == JsonValueKind.Object &&
                        document.RootElement.TryGetProperty("questions", out var questionsElement) &&
                        questionsElement.ValueKind == JsonValueKind.Array)
                    {
                        var questionsArrayJson = questionsElement.GetRawText();
                        NextJsInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<NextJsInterviewQuestion>>(questionsArrayJson, options) ?? new List<NextJsInterviewQuestion>();
                    }
                    else
                    {
                        NextJsInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<NextJsInterviewQuestion>>(questionsJson, options) ?? new List<NextJsInterviewQuestion>();
                    }
                    Console.WriteLine($"✅ Loaded {NextJsInterviewQuestions.Count()} Next.js questions");
                }
                else
                {
                    Console.WriteLine($"❌ Next.js questions file not found at {questionsPath}");
                    NextJsInterviewQuestions = new List<NextJsInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"❌ Error deserializing Next.js data: {jsonEx.Message}");
                Console.WriteLine($"Line: {jsonEx.LineNumber}, Position: {jsonEx.BytePositionInLine}");
                // Don't silently fail - rethrow to make the issue visible
                throw new InvalidOperationException("Failed to load Next.js data due to JSON format error", jsonEx);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error loading Next.js data: {ex.Message}");
                throw new InvalidOperationException("Failed to load Next.js data", ex);
            }
        }

        // Load Performance Optimization data from JSON files
        private void LoadPerformanceData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "performance_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    // Map content-style JSON to PerformanceLesson model shape
                    var mappedLessons = new List<PerformanceLesson>();
                    try
                    {
                        using var doc = JsonDocument.Parse(lessonsJson, new JsonDocumentOptions { AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip });
                        JsonElement root = doc.RootElement;
                        JsonElement lessonsArray = root;
                        if (root.ValueKind == JsonValueKind.Object)
                        {
                            // Support { "lessons": [...] } format if present
                            if (root.TryGetProperty("lessons", out var larr) && larr.ValueKind == JsonValueKind.Array)
                            {
                                lessonsArray = larr;
                            }
                            else
                            {
                                lessonsArray = default;
                            }
                        }

                        if (lessonsArray.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var el in lessonsArray.EnumerateArray())
                            {
                                var lesson = new PerformanceLesson
                                {
                                    Id = GetStringFlexible(el, "id") ?? string.Empty,
                                    Topic = GetString(el, "moduleSlug") ?? GetString(el, "topic"),
                                    Title = GetString(el, "title") ?? string.Empty,
                                    Description = GetString(el, "intro") ?? GetString(el, "description") ?? string.Empty,
                                    CodeExample = GetNestedString(el, "code", "example") ?? GetString(el, "codeExample") ?? string.Empty,
                                    Output = GetNestedString(el, "code", "explanation") ?? GetString(el, "output") ?? string.Empty
                                };
                                mappedLessons.Add(lesson);
                            }
                        }
                        else
                        {
                            // Fallback to direct deserialization if not an array
                            mappedLessons = System.Text.Json.JsonSerializer.Deserialize<List<PerformanceLesson>>(lessonsJson, new JsonSerializerOptions
                            {
                                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                                PropertyNameCaseInsensitive = true
                            }) ?? new List<PerformanceLesson>();
                        }
                    }
                    catch (Exception)
                    {
                        // Fallback to direct deserialization on any mapping/parsing error
                        mappedLessons = System.Text.Json.JsonSerializer.Deserialize<List<PerformanceLesson>>(lessonsJson, new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                            PropertyNameCaseInsensitive = true
                        }) ?? new List<PerformanceLesson>();
                    }
                    PerformanceLessons = mappedLessons;
                }
                else
                {
                    Console.WriteLine($"Performance lessons file not found at {lessonsPath}");
                    PerformanceLessons = new List<PerformanceLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "performance_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    var mappedQuestions = new List<PerformanceInterviewQuestion>();
                    try
                    {
                        using var qdoc = JsonDocument.Parse(questionsJson, new JsonDocumentOptions { AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip });
                        JsonElement qroot = qdoc.RootElement;
                        JsonElement qarray = qroot;
                        if (qroot.ValueKind == JsonValueKind.Object)
                        {
                            // Handle { "questions": [...] }
                            if (qroot.TryGetProperty("questions", out var qarr) && qarr.ValueKind == JsonValueKind.Array)
                            {
                                qarray = qarr;
                            }
                            else
                            {
                                qarray = default;
                            }
                        }
                        if (qarray.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var q in qarray.EnumerateArray())
                            {
                                var item = new PerformanceInterviewQuestion
                                {
                                    Id = GetStringFlexible(q, "id") ?? string.Empty,
                                    Topic = GetString(q, "topic"),
                                    Type = GetString(q, "type") ?? GetString(q, "questionType") ?? string.Empty,
                                    Question = GetString(q, "question") ?? string.Empty,
                                    Choices = GetStringArray(q, "choices").ToArray(),
                                    CorrectAnswer = GetIntFlexible(q, "correctAnswer") ?? GetIntFlexible(q, "correctIndex"),
                                    Explanation = GetString(q, "explanation")
                                };
                                mappedQuestions.Add(item);
                            }
                        }
                        else
                        {
                            mappedQuestions = System.Text.Json.JsonSerializer.Deserialize<List<PerformanceInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                            {
                                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                                PropertyNameCaseInsensitive = true
                            }) ?? new List<PerformanceInterviewQuestion>();
                        }
                    }
                    catch (Exception)
                    {
                        mappedQuestions = System.Text.Json.JsonSerializer.Deserialize<List<PerformanceInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                            PropertyNameCaseInsensitive = true
                        }) ?? new List<PerformanceInterviewQuestion>();
                    }
                    PerformanceInterviewQuestions = mappedQuestions;
                }
                else
                {
                    Console.WriteLine($"Performance questions file not found at {questionsPath}");
                    PerformanceInterviewQuestions = new List<PerformanceInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing Performance data: {jsonEx.Message}");
                PerformanceLessons = new List<PerformanceLesson>();
                PerformanceInterviewQuestions = new List<PerformanceInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading Performance Optimization data: {ex.Message}");
                PerformanceLessons = new List<PerformanceLesson>();
                PerformanceInterviewQuestions = new List<PerformanceInterviewQuestion>();
            }
        }

        // Load Security Fundamentals data from JSON files
        private void LoadSecurityData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "security_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    var mappedLessons = new List<SecurityLesson>();
                    try
                    {
                        using var doc = JsonDocument.Parse(lessonsJson, new JsonDocumentOptions { AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip });
                        JsonElement root = doc.RootElement;
                        JsonElement lessonsArray = root;
                        if (root.ValueKind == JsonValueKind.Object)
                        {
                            if (root.TryGetProperty("lessons", out var larr) && larr.ValueKind == JsonValueKind.Array)
                            {
                                lessonsArray = larr;
                            }
                            else
                            {
                                lessonsArray = default;
                            }
                        }
                        if (lessonsArray.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var el in lessonsArray.EnumerateArray())
                            {
                                var lesson = new SecurityLesson
                                {
                                    Id = GetIntFlexible(el, "id") ?? 0,
                                    Topic = GetString(el, "topic"),
                                    Title = GetString(el, "title") ?? string.Empty,
                                    Description = GetString(el, "intro") ?? GetString(el, "description") ?? string.Empty,
                                    CodeExample = GetNestedString(el, "code", "example") ?? GetString(el, "codeExample") ?? string.Empty,
                                    Output = GetNestedString(el, "code", "explanation") ?? GetString(el, "output") ?? string.Empty
                                };
                                mappedLessons.Add(lesson);
                            }
                        }
                        else if (root.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var el in root.EnumerateArray())
                            {
                                var lesson = new SecurityLesson
                                {
                                    Id = GetIntFlexible(el, "id") ?? 0,
                                    Topic = GetString(el, "topic"),
                                    Title = GetString(el, "title") ?? string.Empty,
                                    Description = GetString(el, "intro") ?? GetString(el, "description") ?? string.Empty,
                                    CodeExample = GetNestedString(el, "code", "example") ?? GetString(el, "codeExample") ?? string.Empty,
                                    Output = GetNestedString(el, "code", "explanation") ?? GetString(el, "output") ?? string.Empty
                                };
                                mappedLessons.Add(lesson);
                            }
                        }
                        else
                        {
                            mappedLessons = new List<SecurityLesson>();
                        }
                    }
                    catch (Exception)
                    {
                        try
                        {
                            using var doc2 = JsonDocument.Parse(lessonsJson, new JsonDocumentOptions { AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip });
                            var root2 = doc2.RootElement;
                            if (root2.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var el in root2.EnumerateArray())
                                {
                                    var lesson = new SecurityLesson
                                    {
                                        Id = GetIntFlexible(el, "id") ?? 0,
                                        Topic = GetString(el, "topic"),
                                        Title = GetString(el, "title") ?? string.Empty,
                                        Description = GetString(el, "intro") ?? GetString(el, "description") ?? string.Empty,
                                        CodeExample = GetNestedString(el, "code", "example") ?? GetString(el, "codeExample") ?? string.Empty,
                                        Output = GetNestedString(el, "code", "explanation") ?? GetString(el, "output") ?? string.Empty
                                    };
                                    mappedLessons.Add(lesson);
                                }
                            }
                            else
                            {
                                mappedLessons = new List<SecurityLesson>();
                            }
                        }
                        catch
                        {
                            mappedLessons = new List<SecurityLesson>();
                        }
                    }
                    SecurityLessons = mappedLessons;
                }
                else
                {
                    Console.WriteLine($"Security lessons file not found at {lessonsPath}");
                    SecurityLessons = new List<SecurityLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "security_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    var mappedQuestions = new List<SecurityInterviewQuestion>();
                    try
                    {
                        using var qdoc = JsonDocument.Parse(questionsJson, new JsonDocumentOptions { AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip });
                        JsonElement qroot = qdoc.RootElement;
                        JsonElement qarray = qroot;
                        if (qroot.ValueKind == JsonValueKind.Object)
                        {
                            if (qroot.TryGetProperty("questions", out var qarr) && qarr.ValueKind == JsonValueKind.Array)
                            {
                                qarray = qarr;
                            }
                            else
                            {
                                qarray = default;
                            }
                        }
                        if (qarray.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var q in qarray.EnumerateArray())
                            {
                                var item = new SecurityInterviewQuestion
                                {
                                    Id = GetIntFlexible(q, "id") ?? 0,
                                    Topic = GetString(q, "topic"),
                                    Type = GetString(q, "type") ?? GetString(q, "questionType") ?? string.Empty,
                                    Question = GetString(q, "question") ?? string.Empty,
                                    Choices = GetStringArray(q, "choices").ToArray(),
                                    CorrectAnswer = GetIntFlexible(q, "correctAnswer") ?? GetIntFlexible(q, "correctIndex"),
                                    Explanation = GetString(q, "explanation")
                                };
                                mappedQuestions.Add(item);
                            }
                        }
                        else if (qroot.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var q in qroot.EnumerateArray())
                            {
                                var item = new SecurityInterviewQuestion
                                {
                                    Id = GetIntFlexible(q, "id") ?? 0,
                                    Topic = GetString(q, "topic"),
                                    Type = GetString(q, "type") ?? GetString(q, "questionType") ?? string.Empty,
                                    Question = GetString(q, "question") ?? string.Empty,
                                    Choices = GetStringArray(q, "choices").ToArray(),
                                    CorrectAnswer = GetIntFlexible(q, "correctAnswer") ?? GetIntFlexible(q, "correctIndex"),
                                    Explanation = GetString(q, "explanation")
                                };
                                mappedQuestions.Add(item);
                            }
                        }
                        else
                        {
                            mappedQuestions = new List<SecurityInterviewQuestion>();
                        }
                    }
                    catch (Exception)
                    {
                        try
                        {
                            using var qdoc2 = JsonDocument.Parse(questionsJson, new JsonDocumentOptions { AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip });
                            var root2 = qdoc2.RootElement;
                            if (root2.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var q in root2.EnumerateArray())
                                {
                                    var item = new SecurityInterviewQuestion
                                    {
                                        Id = GetIntFlexible(q, "id") ?? 0,
                                        Topic = GetString(q, "topic"),
                                        Type = GetString(q, "type") ?? GetString(q, "questionType") ?? string.Empty,
                                        Question = GetString(q, "question") ?? string.Empty,
                                        Choices = GetStringArray(q, "choices").ToArray(),
                                        CorrectAnswer = GetIntFlexible(q, "correctAnswer") ?? GetIntFlexible(q, "correctIndex"),
                                        Explanation = GetString(q, "explanation")
                                    };
                                    mappedQuestions.Add(item);
                                }
                            }
                            else
                            {
                                mappedQuestions = new List<SecurityInterviewQuestion>();
                            }
                        }
                        catch
                        {
                            mappedQuestions = new List<SecurityInterviewQuestion>();
                        }
                    }
                    SecurityInterviewQuestions = mappedQuestions;
                }
                else
                {
                    Console.WriteLine($"Security questions file not found at {questionsPath}");
                    SecurityInterviewQuestions = new List<SecurityInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing Security data: {jsonEx.Message}");
                SecurityLessons = new List<SecurityLesson>();
                SecurityInterviewQuestions = new List<SecurityInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading Security Fundamentals data: {ex.Message}");
                SecurityLessons = new List<SecurityLesson>();
                SecurityInterviewQuestions = new List<SecurityInterviewQuestion>();
            }
        }

        private static string? GetString(JsonElement el, string prop)
        {
            if (el.TryGetProperty(prop, out var v))
            {
                if (v.ValueKind == JsonValueKind.String) return v.GetString();
                return v.ToString();
            }
            return null;
        }

        private static string? GetStringFlexible(JsonElement el, string prop)
        {
            if (!el.TryGetProperty(prop, out var v)) return null;
            try
            {
                if (v.ValueKind == JsonValueKind.String) return v.GetString();
                if (v.ValueKind == JsonValueKind.Number)
                {
                    if (v.TryGetInt32(out var i)) return i.ToString();
                    if (v.TryGetInt64(out var l)) return l.ToString();
                    return v.ToString();
                }
                return v.ToString();
            }
            catch
            {
                return v.ToString();
            }
        }

        private static int? GetIntFlexible(JsonElement el, string prop)
        {
            if (!el.TryGetProperty(prop, out var v)) return null;
            try
            {
                if (v.ValueKind == JsonValueKind.Number)
                {
                    if (v.TryGetInt32(out var i)) return i;
                    if (v.TryGetInt64(out var l)) return (int)l;
                }
                else if (v.ValueKind == JsonValueKind.String)
                {
                    if (int.TryParse(v.GetString(), out var i)) return i;
                }
                return null;
            }
            catch { return null; }
        }

        private static string? GetNestedString(JsonElement el, string parent, string child)
        {
            if (el.TryGetProperty(parent, out var p) && p.ValueKind == JsonValueKind.Object)
            {
                if (p.TryGetProperty(child, out var c))
                {
                    if (c.ValueKind == JsonValueKind.String) return c.GetString();
                    return c.ToString();
                }
            }
            return null;
        }

        private static List<string> GetStringArray(JsonElement el, string prop)
        {
            var result = new List<string>();
            if (el.TryGetProperty(prop, out var arr) && arr.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in arr.EnumerateArray())
                {
                    if (item.ValueKind == JsonValueKind.String) result.Add(item.GetString()!);
                    else result.Add(item.ToString());
                }
            }
            return result;
        }

        // Load Version Control data from JSON files
        private void LoadVersionData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "version_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    VersionLessons = System.Text.Json.JsonSerializer.Deserialize<List<VersionLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<VersionLesson>();
                }
                else
                {
                    Console.WriteLine($"Version lessons file not found at {lessonsPath}");
                    VersionLessons = new List<VersionLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "version_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    VersionInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<VersionInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<VersionInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"Version questions file not found at {questionsPath}");
                    VersionInterviewQuestions = new List<VersionInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing Version data: {jsonEx.Message}");
                VersionLessons = new List<VersionLesson>();
                VersionInterviewQuestions = new List<VersionInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading Version Control data: {ex.Message}");
                VersionLessons = new List<VersionLesson>();
                VersionInterviewQuestions = new List<VersionInterviewQuestion>();
            }
        }

        // React answer validation
        public AnswerResult ValidateReactAnswer(int questionId, int answerIndex)
        {
            var question = ReactInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Tailwind answer validation
        public AnswerResult ValidateTailwindAnswer(int questionId, int answerIndex)
        {
            var question = TailwindInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Node.js answer validation
        public AnswerResult ValidateNodeAnswer(int questionId, int answerIndex)
        {
            var question = NodeInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // SASS answer validation
        public AnswerResult ValidateSassAnswer(int questionId, int answerIndex)
        {
            var question = SassInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Vue answer validation
        public AnswerResult ValidateVueAnswer(int questionId, int answerIndex)
        {
            var question = VueInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // TypeScript answer validation
        public AnswerResult ValidateTypescriptAnswer(int questionId, int answerIndex)
        {
            var question = TypescriptInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Database answer validation
        public AnswerResult ValidateDatabaseAnswer(int questionId, int answerIndex)
        {
            var question = DatabaseInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Testing answer validation
        public AnswerResult ValidateTestingAnswer(int questionId, int answerIndex)
        {
            var question = TestingInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Programming answer validation
        public AnswerResult ValidateProgrammingAnswer(int questionId, int answerIndex)
        {
            var question = ProgrammingInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Web Fundamentals answer validation
        public AnswerResult ValidateWebAnswer(int questionId, int answerIndex)
        {
            var question = WebInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Load Laravel data from JSON files
        private void LoadLaravelData()
        {
            try
            {
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "laravel_lessons.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    LaravelLessons = System.Text.Json.JsonSerializer.Deserialize<List<LaravelLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<LaravelLesson>();
                }
                else
                {
                    Console.WriteLine($"Laravel lessons file not found at {lessonsPath}");
                    LaravelLessons = new List<LaravelLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "laravel_questions.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    LaravelInterviewQuestions = System.Text.Json.JsonSerializer.Deserialize<List<LaravelInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<LaravelInterviewQuestion>();
                }
                else
                {
                    Console.WriteLine($"Laravel questions file not found at {questionsPath}");
                    LaravelInterviewQuestions = new List<LaravelInterviewQuestion>();
                }
            }
            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error deserializing Laravel data: {jsonEx.Message}");
                LaravelLessons = new List<LaravelLesson>();
                LaravelInterviewQuestions = new List<LaravelInterviewQuestion>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error loading Laravel data: {ex.Message}");
                LaravelLessons = new List<LaravelLesson>();
                LaravelInterviewQuestions = new List<LaravelInterviewQuestion>();
            }
        }

        // Next.js answer validation
        public AnswerResult ValidateNextJsAnswer(string questionId, int answerIndex)
        {
            var question = NextJsInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Performance Optimization answer validation
        public AnswerResult ValidatePerformanceAnswer(string questionId, int answerIndex)
        {
            var question = PerformanceInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Security Fundamentals answer validation
        public AnswerResult ValidateSecurityAnswer(int questionId, int answerIndex)
        {
            var question = SecurityInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }

        // Version Control answer validation
        public AnswerResult ValidateVersionAnswer(int questionId, int answerIndex)
        {
            var question = VersionInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
            if (question == null)
            {
                return new AnswerResult 
                { 
                    IsCorrect = false, 
                    Explanation = "Question not found." 
                };
            }

            bool isCorrect = question.Type == "open-ended" || 
                            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

            return new AnswerResult
            {
                IsCorrect = isCorrect,
                Explanation = question.Explanation
            };
        }
    }
}