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

        // Verify that all data was loaded correctly with detailed error reporting
        private void VerifyDataIntegrity()
        {
            Console.WriteLine("🔍 Verifying data integrity...");
            Console.WriteLine($"🔍 Base Directory: {AppDomain.CurrentDomain.BaseDirectory}");
            var testPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content");
            Console.WriteLine($"🔍 Calculated content path: {System.IO.Path.GetFullPath(testPath)}");
            
            var moduleChecks = new List<(string Name, Func<int> CountFunc, string LessonsPath, string QuestionsPath)>
            {
                ("DotNet", () => DotNetLessons.Count(), "content/lessons/dotnet-fundamentals.json", "content/quizzes/dotnet-fundamentals.json"),
                ("GraphQL", () => GraphQLLessons.Count(), "content/lessons/graphql-advanced.json", "content/quizzes/graphql-advanced.json"),
                ("Laravel", () => LaravelLessons.Count(), "content/lessons/laravel-fundamentals.json", "content/quizzes/laravel-fundamentals.json"),
                ("React", () => ReactLessons.Count(), "content/lessons/react-fundamentals.json", "content/quizzes/react-fundamentals.json"),
                ("Tailwind", () => TailwindLessons.Count(), "content/lessons/tailwind-advanced.json", "content/quizzes/tailwind-advanced.json"),
                ("Node", () => NodeLessons.Count(), "content/lessons/node-fundamentals.json", "content/quizzes/node-fundamentals.json"),
                ("Sass", () => SassLessons.Count(), "content/lessons/sass-advanced.json", "content/quizzes/sass-advanced.json"),
                ("Vue", () => VueLessons.Count(), "content/lessons/vue-advanced.json", "content/quizzes/vue-advanced.json"),
                ("TypeScript", () => TypescriptLessons.Count(), "content/lessons/typescript-fundamentals.json", "content/quizzes/typescript-fundamentals.json"),
                ("Database", () => DatabaseLessons.Count(), "content/lessons/database-systems.json", "content/quizzes/database-systems.json"),
                ("Testing", () => TestingLessons.Count(), "content/lessons/testing-fundamentals.json", "content/quizzes/testing-fundamentals.json"),
                ("Programming", () => ProgrammingLessons.Count(), "content/lessons/programming-fundamentals.json", "content/quizzes/programming-fundamentals.json"),
                ("Web", () => WebLessons.Count(), "content/lessons/web-fundamentals.json", "content/quizzes/web-fundamentals.json"),
                ("Next.js", () => NextJsLessons.Count(), "content/lessons/nextjs-advanced.json", "content/quizzes/nextjs-advanced.json"),
                ("Performance", () => PerformanceLessons.Count(), "content/lessons/performance-optimization.json", "content/quizzes/performance-optimization.json"),
                ("Security", () => SecurityLessons.Count(), "content/lessons/security-fundamentals.json", "content/quizzes/security-fundamentals.json"),
                ("Version", () => VersionLessons.Count(), "content/lessons/version-control.json", "content/quizzes/version-control.json")
            };

            var questionChecks = new List<(string Name, Func<int> CountFunc)>
            {
                ("DotNet Questions", () => DotNetInterviewQuestions.Count()),
                ("GraphQL Questions", () => GraphQLInterviewQuestions.Count()),
                ("Laravel Questions", () => LaravelInterviewQuestions.Count()),
                ("React Questions", () => ReactInterviewQuestions.Count()),
                ("Tailwind Questions", () => TailwindInterviewQuestions.Count()),
                ("Node Questions", () => NodeInterviewQuestions.Count()),
                ("Sass Questions", () => SassInterviewQuestions.Count()),
                ("Vue Questions", () => VueInterviewQuestions.Count()),
                ("TypeScript Questions", () => TypescriptInterviewQuestions.Count()),
                ("Database Questions", () => DatabaseInterviewQuestions.Count()),
                ("Testing Questions", () => TestingInterviewQuestions.Count()),
                ("Programming Questions", () => ProgrammingInterviewQuestions.Count()),
                ("Web Questions", () => WebInterviewQuestions.Count()),
                ("Next.js Questions", () => NextJsInterviewQuestions.Count()),
                ("Performance Questions", () => PerformanceInterviewQuestions.Count()),
                ("Security Questions", () => SecurityInterviewQuestions.Count()),
                ("Version Questions", () => VersionInterviewQuestions.Count())
            };

            // Check lessons
            foreach (var check in moduleChecks)
            {
                try
                {
                    var count = check.CountFunc();
                    if (count == 0)
                    {
                        Console.WriteLine($"⚠️  WARNING: {check.Name} Lessons has 0 items loaded");
                        PerformDetailedFileCheck(check.Name, check.LessonsPath, "lessons");
                    }
                    else
                    {
                        Console.WriteLine($"✅ {check.Name} Lessons: {count} items");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ ERROR: Failed to count {check.Name} Lessons: {ex.Message}");
                    Console.WriteLine($"   Stack trace: {ex.StackTrace}");
                }
            }

            // Check questions
            foreach (var check in questionChecks)
            {
                try
                {
                    var count = check.CountFunc();
                    if (count == 0)
                    {
                        Console.WriteLine($"⚠️  WARNING: {check.Name} has 0 items loaded");
                        var moduleName = check.Name.Replace(" Questions", "");
                        var moduleCheck = moduleChecks.FirstOrDefault(m => m.Name == moduleName);
                        if (moduleCheck.Name != null)
                        {
                            PerformDetailedFileCheck(moduleName, moduleCheck.QuestionsPath, "questions");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"✅ {check.Name}: {count} items");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"❌ ERROR: Failed to count {check.Name}: {ex.Message}");
                    Console.WriteLine($"   Stack trace: {ex.StackTrace}");
                }
            }

            Console.WriteLine("✅ Data integrity verification completed");
        }

        // Perform detailed file and content checks for failed modules
        private void PerformDetailedFileCheck(string moduleName, string relativePath, string contentType)
        {
            try
            {
                var fullPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", relativePath);
                var normalizedPath = System.IO.Path.GetFullPath(fullPath);
                
                Console.WriteLine($"   📁 Checking file: {normalizedPath}");
                
                if (!System.IO.File.Exists(normalizedPath))
                {
                    Console.WriteLine($"   ❌ File does not exist: {normalizedPath}");
                    
                    // Check if directory exists
                    var directory = System.IO.Path.GetDirectoryName(normalizedPath);
                    if (!System.IO.Directory.Exists(directory))
                    {
                        Console.WriteLine($"   ❌ Directory does not exist: {directory}");
                    }
                    else
                    {
                        Console.WriteLine($"   📂 Directory exists, listing files:");
                        var files = System.IO.Directory.GetFiles(directory, "*.json");
                        foreach (var file in files)
                        {
                            Console.WriteLine($"      - {System.IO.Path.GetFileName(file)}");
                        }
                    }
                    return;
                }

                Console.WriteLine($"   ✅ File exists");
                
                // Check file size
                var fileInfo = new System.IO.FileInfo(normalizedPath);
                Console.WriteLine($"   📊 File size: {fileInfo.Length} bytes");
                
                if (fileInfo.Length == 0)
                {
                    Console.WriteLine($"   ❌ File is empty");
                    return;
                }

                // Check JSON validity
                try
                {
                    var jsonContent = System.IO.File.ReadAllText(normalizedPath);
                    Console.WriteLine($"   📄 Content length: {jsonContent.Length} characters");
                    
                    if (string.IsNullOrWhiteSpace(jsonContent))
                    {
                        Console.WriteLine($"   ❌ File content is empty or whitespace only");
                        return;
                    }

                    // Try to parse JSON
                    using var document = System.Text.Json.JsonDocument.Parse(jsonContent);
                    Console.WriteLine($"   ✅ JSON is valid");
                    
                    // Check JSON structure
                    var root = document.RootElement;
                    if (root.ValueKind == JsonValueKind.Array)
                    {
                        Console.WriteLine($"   📋 JSON contains array with {root.GetArrayLength()} items");
                        if (root.GetArrayLength() == 0)
                        {
                            Console.WriteLine($"   ⚠️  JSON array is empty - this explains why 0 items were loaded");
                        }
                    }
                    else if (root.ValueKind == JsonValueKind.Object)
                    {
                        Console.WriteLine($"   📋 JSON is an object");
                        if (root.TryGetProperty("questions", out var questionsProperty))
                        {
                            if (questionsProperty.ValueKind == JsonValueKind.Array)
                            {
                                Console.WriteLine($"   📋 Found 'questions' array with {questionsProperty.GetArrayLength()} items");
                                if (questionsProperty.GetArrayLength() == 0)
                                {
                                    Console.WriteLine($"   ⚠️  Questions array is empty - this explains why 0 items were loaded");
                                }
                            }
                        }
                        else
                        {
                            Console.WriteLine($"   ⚠️  Object structure doesn't contain expected 'questions' property");
                            Console.WriteLine($"   🔍 Available properties:");
                            foreach (var property in root.EnumerateObject())
                            {
                                Console.WriteLine($"      - {property.Name}: {property.Value.ValueKind}");
                            }
                        }
                    }
                    else
                    {
                        Console.WriteLine($"   ❌ Unexpected JSON structure: {root.ValueKind}");
                    }
                }
                catch (System.Text.Json.JsonException jsonEx)
                {
                    Console.WriteLine($"   ❌ Invalid JSON: {jsonEx.Message}");
                    Console.WriteLine($"   📍 Error at line {jsonEx.LineNumber}, position {jsonEx.BytePositionInLine}");
                    
                    // Show snippet around error
                    try
                    {
                        var lines = System.IO.File.ReadAllLines(normalizedPath);
                        if (jsonEx.LineNumber.HasValue && jsonEx.LineNumber.Value <= lines.Length)
                        {
                            var errorLine = (int)jsonEx.LineNumber.Value - 1; // Convert to 0-based
                            var start = Math.Max(0, errorLine - 2);
                            var end = Math.Min(lines.Length - 1, errorLine + 2);
                            
                            Console.WriteLine($"   📝 Content around error:");
                            for (int i = start; i <= end; i++)
                            {
                                var marker = i == errorLine ? ">>> " : "    ";
                                Console.WriteLine($"   {marker}Line {i + 1}: {lines[i]}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"   ❌ Could not read file lines for error context: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   ❌ Error during detailed file check: {ex.Message}");
                Console.WriteLine($"   📍 Stack trace: {ex.StackTrace}");
            }
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
            question = DotNetInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
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
            var graphqlQuestion = GraphQLInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
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

            return new AnswerResult { IsCorrect = false, Explanation = "Question not found." };
        }

        // Laravel answer validation
        public AnswerResult ValidateLaravelAnswer(string questionId, int answerIndex)
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
            Console.WriteLine("Starting LoadReactData...");
            // Load React Lessons
            var reactLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content/lessons/react-fundamentals.json");
        Console.WriteLine($"React lessons path: {reactLessonsPath}");
        Console.WriteLine($"React lessons file exists: {System.IO.File.Exists(reactLessonsPath)}");
            
            if (System.IO.File.Exists(reactLessonsPath))
            {
                var reactLessonsJson = System.IO.File.ReadAllText(reactLessonsPath);
                Console.WriteLine($"React lessons JSON length: {reactLessonsJson.Length}");
                ReactLessons = JsonSerializer.Deserialize<List<ReactLesson>>(reactLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<ReactLesson>();
                Console.WriteLine($"Loaded {ReactLessons.Count()} React lessons");
            }
            else
            {
                Console.WriteLine("React lessons file not found!");
            }

            // Load React Interview Questions
            var reactQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "react-fundamentals.json");
            Console.WriteLine($"React questions path: {reactQuestionsPath}");
            Console.WriteLine($"React questions file exists: {System.IO.File.Exists(reactQuestionsPath)}");
            
            if (System.IO.File.Exists(reactQuestionsPath))
            {
                var reactQuestionsJson = System.IO.File.ReadAllText(reactQuestionsPath);
                Console.WriteLine($"React questions JSON length: {reactQuestionsJson.Length}");
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(reactQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    ReactInterviewQuestions = JsonSerializer.Deserialize<List<ReactInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<ReactInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     ReactInterviewQuestions = JsonSerializer.Deserialize<List<ReactInterviewQuestion>>(reactQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<ReactInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {ReactInterviewQuestions.Count()} React interview questions");
            }
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
            Console.WriteLine("🔄 Starting LoadTailwindData...");
            
            // Load Tailwind Lessons
            var tailwindLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "tailwind-advanced.json");
            Console.WriteLine($"📁 Tailwind lessons path: {tailwindLessonsPath}");
            
            if (System.IO.File.Exists(tailwindLessonsPath))
            {
                Console.WriteLine("✅ Tailwind lessons file exists");
                var tailwindLessonsJson = System.IO.File.ReadAllText(tailwindLessonsPath);
                Console.WriteLine($"📄 Read {tailwindLessonsJson.Length} characters from lessons file");
                
                TailwindLessons = JsonSerializer.Deserialize<List<TailwindLesson>>(tailwindLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<TailwindLesson>();
                Console.WriteLine($"✅ Loaded {TailwindLessons.Count()} Tailwind lessons");
            }
            else
            {
                Console.WriteLine("❌ Tailwind lessons file does not exist");
                TailwindLessons = new List<TailwindLesson>();
            }

            // Load Tailwind Interview Questions
            var tailwindQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "tailwind-advanced.json");
            Console.WriteLine($"📁 Tailwind questions path: {tailwindQuestionsPath}");
            
            if (System.IO.File.Exists(tailwindQuestionsPath))
            {
                Console.WriteLine("✅ Tailwind questions file exists");
                var tailwindQuestionsJson = System.IO.File.ReadAllText(tailwindQuestionsPath);
                Console.WriteLine($"📄 Read {tailwindQuestionsJson.Length} characters from questions file");
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(tailwindQuestionsJson);
                Console.WriteLine($"📋 JSON parsed successfully");
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    Console.WriteLine($"📋 Found 'questions' property with {questionsElement.GetArrayLength()} items");
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    Console.WriteLine($"📄 Extracted questions JSON: {questionsJson.Length} characters");
                    
                    TailwindInterviewQuestions = JsonSerializer.Deserialize<List<TailwindInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<TailwindInterviewQuestion>();
                    Console.WriteLine($"✅ Deserialized {TailwindInterviewQuestions.Count()} questions from wrapper structure");
                 }
                 else
                 {
                     Console.WriteLine("📋 No 'questions' property found, trying direct array structure");
                     // Direct array structure
                     TailwindInterviewQuestions = JsonSerializer.Deserialize<List<TailwindInterviewQuestion>>(tailwindQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<TailwindInterviewQuestion>();
                    Console.WriteLine($"✅ Deserialized {TailwindInterviewQuestions.Count()} questions from direct array");
                }
                
                Console.WriteLine($"✅ Final result: Loaded {TailwindInterviewQuestions.Count()} Tailwind interview questions");
            }
            else
            {
                Console.WriteLine("❌ Tailwind questions file does not exist");
                TailwindInterviewQuestions = new List<TailwindInterviewQuestion>();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error loading Tailwind data: {ex.Message}");
            Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
            TailwindLessons = new List<TailwindLesson>();
            TailwindInterviewQuestions = new List<TailwindInterviewQuestion>();
        }
        
        Console.WriteLine($"🏁 LoadTailwindData completed. Final counts - Lessons: {TailwindLessons.Count()}, Questions: {TailwindInterviewQuestions.Count()}");
    }

        // Load Node.js data from JSON files
            private void LoadNodeData()
    {
        try
        {
            // Load Node Lessons
            var nodeLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "node-fundamentals.json");
            if (System.IO.File.Exists(nodeLessonsPath))
            {
                var nodeLessonsJson = System.IO.File.ReadAllText(nodeLessonsPath);
                NodeLessons = JsonSerializer.Deserialize<List<NodeLesson>>(nodeLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<NodeLesson>();
                Console.WriteLine($"Loaded {NodeLessons.Count()} Node lessons");
            }

            // Load Node Interview Questions
            var nodeQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "node-fundamentals.json");
            if (System.IO.File.Exists(nodeQuestionsPath))
            {
                var nodeQuestionsJson = System.IO.File.ReadAllText(nodeQuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(nodeQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    NodeInterviewQuestions = JsonSerializer.Deserialize<List<NodeInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<NodeInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     NodeInterviewQuestions = JsonSerializer.Deserialize<List<NodeInterviewQuestion>>(nodeQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<NodeInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {NodeInterviewQuestions.Count()} Node interview questions");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading Node data: {ex.Message}");
            NodeLessons = new List<NodeLesson>();
            NodeInterviewQuestions = new List<NodeInterviewQuestion>();
        }
    }

        // Load SASS data from JSON files
            private void LoadSassData()
    {
        try
        {
            // Load Sass Lessons
            var sassLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "sass-advanced.json");
            if (System.IO.File.Exists(sassLessonsPath))
            {
                var sassLessonsJson = System.IO.File.ReadAllText(sassLessonsPath);
                SassLessons = JsonSerializer.Deserialize<List<SassLesson>>(sassLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<SassLesson>();
                Console.WriteLine($"Loaded {SassLessons.Count()} Sass lessons");
            }

            // Load Sass Interview Questions
            var sassQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "sass-advanced.json");
            if (System.IO.File.Exists(sassQuestionsPath))
            {
                var sassQuestionsJson = System.IO.File.ReadAllText(sassQuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(sassQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    SassInterviewQuestions = JsonSerializer.Deserialize<List<SassInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<SassInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     SassInterviewQuestions = JsonSerializer.Deserialize<List<SassInterviewQuestion>>(sassQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<SassInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {SassInterviewQuestions.Count()} Sass interview questions");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading Sass data: {ex.Message}");
            SassLessons = new List<SassLesson>();
            SassInterviewQuestions = new List<SassInterviewQuestion>();
        }
    }

        // Load Vue data from JSON files
            private void LoadVueData()
    {
        try
        {
            // Load Vue Lessons
            var vueLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "vue-advanced.json");
            if (System.IO.File.Exists(vueLessonsPath))
            {
                var vueLessonsJson = System.IO.File.ReadAllText(vueLessonsPath);
                VueLessons = JsonSerializer.Deserialize<List<VueLesson>>(vueLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<VueLesson>();
                Console.WriteLine($"Loaded {VueLessons.Count()} Vue lessons");
            }

            // Load Vue Interview Questions
            var vueQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "vue-advanced.json");
            if (System.IO.File.Exists(vueQuestionsPath))
            {
                var vueQuestionsJson = System.IO.File.ReadAllText(vueQuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(vueQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    VueInterviewQuestions = JsonSerializer.Deserialize<List<VueInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<VueInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     VueInterviewQuestions = JsonSerializer.Deserialize<List<VueInterviewQuestion>>(vueQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<VueInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {VueInterviewQuestions.Count()} Vue interview questions");
            }
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
            // Load Typescript Lessons
            var typescriptLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "typescript-fundamentals.json");
            if (System.IO.File.Exists(typescriptLessonsPath))
            {
                var typescriptLessonsJson = System.IO.File.ReadAllText(typescriptLessonsPath);
                TypescriptLessons = JsonSerializer.Deserialize<List<TypescriptLesson>>(typescriptLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<TypescriptLesson>();
                Console.WriteLine($"Loaded {TypescriptLessons.Count()} Typescript lessons");
            }

            // Load Typescript Interview Questions
            var typescriptQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "typescript-fundamentals.json");
            if (System.IO.File.Exists(typescriptQuestionsPath))
            {
                var typescriptQuestionsJson = System.IO.File.ReadAllText(typescriptQuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(typescriptQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    TypescriptInterviewQuestions = JsonSerializer.Deserialize<List<TypescriptInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<TypescriptInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     TypescriptInterviewQuestions = JsonSerializer.Deserialize<List<TypescriptInterviewQuestion>>(typescriptQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<TypescriptInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {TypescriptInterviewQuestions.Count()} Typescript interview questions");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading Typescript data: {ex.Message}");
            TypescriptLessons = new List<TypescriptLesson>();
            TypescriptInterviewQuestions = new List<TypescriptInterviewQuestion>();
        }
    }

        // Load Database data from JSON files
            private void LoadDatabaseData()
    {
        try
        {
            // Load Database Lessons
            var databaseLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "database-systems.json");
            if (System.IO.File.Exists(databaseLessonsPath))
            {
                var databaseLessonsJson = System.IO.File.ReadAllText(databaseLessonsPath);
                DatabaseLessons = JsonSerializer.Deserialize<List<DatabaseLesson>>(databaseLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<DatabaseLesson>();
                Console.WriteLine($"Loaded {DatabaseLessons.Count()} Database lessons");
            }

            // Load Database Interview Questions
            var databaseQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "database-systems.json");
            if (System.IO.File.Exists(databaseQuestionsPath))
            {
                var databaseQuestionsJson = System.IO.File.ReadAllText(databaseQuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(databaseQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    DatabaseInterviewQuestions = JsonSerializer.Deserialize<List<DatabaseInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<DatabaseInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     DatabaseInterviewQuestions = JsonSerializer.Deserialize<List<DatabaseInterviewQuestion>>(databaseQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<DatabaseInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {DatabaseInterviewQuestions.Count()} Database interview questions");
            }
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
            // Load Testing Lessons
            var testingLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "testing-fundamentals.json");
            if (System.IO.File.Exists(testingLessonsPath))
            {
                var testingLessonsJson = System.IO.File.ReadAllText(testingLessonsPath);
                TestingLessons = JsonSerializer.Deserialize<List<TestingLesson>>(testingLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<TestingLesson>();
                Console.WriteLine($"Loaded {TestingLessons.Count()} Testing lessons");
            }

            // Load Testing Interview Questions
            var testingQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "testing-fundamentals.json");
            if (System.IO.File.Exists(testingQuestionsPath))
            {
                var testingQuestionsJson = System.IO.File.ReadAllText(testingQuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(testingQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    TestingInterviewQuestions = JsonSerializer.Deserialize<List<TestingInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<TestingInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     TestingInterviewQuestions = JsonSerializer.Deserialize<List<TestingInterviewQuestion>>(testingQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<TestingInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {TestingInterviewQuestions.Count()} Testing interview questions");
            }
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
            // Load Programming Lessons
            var programmingLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "programming-fundamentals.json");
            if (System.IO.File.Exists(programmingLessonsPath))
            {
                var programmingLessonsJson = System.IO.File.ReadAllText(programmingLessonsPath);
                ProgrammingLessons = JsonSerializer.Deserialize<List<ProgrammingLesson>>(programmingLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<ProgrammingLesson>();
                Console.WriteLine($"Loaded {ProgrammingLessons.Count()} Programming lessons");
            }

            // Load Programming Interview Questions
            var programmingQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "programming-fundamentals.json");
            if (System.IO.File.Exists(programmingQuestionsPath))
            {
                var programmingQuestionsJson = System.IO.File.ReadAllText(programmingQuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(programmingQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    ProgrammingInterviewQuestions = JsonSerializer.Deserialize<List<ProgrammingInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<ProgrammingInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     ProgrammingInterviewQuestions = JsonSerializer.Deserialize<List<ProgrammingInterviewQuestion>>(programmingQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<ProgrammingInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {ProgrammingInterviewQuestions.Count()} Programming interview questions");
            }
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
            // Load Web Lessons
            var webLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "web-fundamentals.json");
            if (System.IO.File.Exists(webLessonsPath))
            {
                var webLessonsJson = System.IO.File.ReadAllText(webLessonsPath);
                WebLessons = JsonSerializer.Deserialize<List<WebLesson>>(webLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<WebLesson>();
                Console.WriteLine($"Loaded {WebLessons.Count()} Web lessons");
            }

            // Load Web Interview Questions
            var webQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "web-fundamentals.json");
            if (System.IO.File.Exists(webQuestionsPath))
            {
                var webQuestionsJson = System.IO.File.ReadAllText(webQuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(webQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    WebInterviewQuestions = JsonSerializer.Deserialize<List<WebInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<WebInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     WebInterviewQuestions = JsonSerializer.Deserialize<List<WebInterviewQuestion>>(webQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<WebInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {WebInterviewQuestions.Count()} Web interview questions");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading Web data: {ex.Message}");
            WebLessons = new List<WebLesson>();
            WebInterviewQuestions = new List<WebInterviewQuestion>();
        }
    }

        // Load Next.js data from JSON files
            private void LoadNextJsData()
    {
        try
        {
            // Load NextJs Lessons
            var nextjsLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "nextjs-advanced.json");
            if (System.IO.File.Exists(nextjsLessonsPath))
            {
                var nextjsLessonsJson = System.IO.File.ReadAllText(nextjsLessonsPath);
                NextJsLessons = JsonSerializer.Deserialize<List<NextJsLesson>>(nextjsLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<NextJsLesson>();
                Console.WriteLine($"Loaded {NextJsLessons.Count()} NextJs lessons");
            }

            // Load NextJs Interview Questions
            var nextjsQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "nextjs-advanced.json");
            if (System.IO.File.Exists(nextjsQuestionsPath))
            {
                var nextjsQuestionsJson = System.IO.File.ReadAllText(nextjsQuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(nextjsQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    NextJsInterviewQuestions = JsonSerializer.Deserialize<List<NextJsInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<NextJsInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     NextJsInterviewQuestions = JsonSerializer.Deserialize<List<NextJsInterviewQuestion>>(nextjsQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<NextJsInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {NextJsInterviewQuestions.Count()} NextJs interview questions");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading NextJs data: {ex.Message}");
            NextJsLessons = new List<NextJsLesson>();
            NextJsInterviewQuestions = new List<NextJsInterviewQuestion>();
        }
    }

        // Load Performance Optimization data from JSON files
            private void LoadPerformanceData()
    {
        try
        {
            // Load Performance Lessons
            var performanceLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "performance-optimization.json");
            if (System.IO.File.Exists(performanceLessonsPath))
            {
                var performanceLessonsJson = System.IO.File.ReadAllText(performanceLessonsPath);
                PerformanceLessons = JsonSerializer.Deserialize<List<PerformanceLesson>>(performanceLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<PerformanceLesson>();
                Console.WriteLine($"Loaded {PerformanceLessons.Count()} Performance lessons");
            }

            // Load Performance Interview Questions
            var performanceQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "performance-optimization.json");
            if (System.IO.File.Exists(performanceQuestionsPath))
            {
                var performanceQuestionsJson = System.IO.File.ReadAllText(performanceQuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(performanceQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    PerformanceInterviewQuestions = JsonSerializer.Deserialize<List<PerformanceInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<PerformanceInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     PerformanceInterviewQuestions = JsonSerializer.Deserialize<List<PerformanceInterviewQuestion>>(performanceQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<PerformanceInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {PerformanceInterviewQuestions.Count()} Performance interview questions");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading Performance data: {ex.Message}");
            PerformanceLessons = new List<PerformanceLesson>();
            PerformanceInterviewQuestions = new List<PerformanceInterviewQuestion>();
        }
    }

        // Load Security Fundamentals data from JSON files
            private void LoadSecurityData()
    {
        try
        {
            // Load Security Lessons
            var securityLessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "security-fundamentals.json");
            Console.WriteLine($"Security lessons path: {securityLessonsPath}");
            Console.WriteLine($"Security lessons file exists: {System.IO.File.Exists(securityLessonsPath)}");
            if (System.IO.File.Exists(securityLessonsPath))
            {
                var securityLessonsJson = System.IO.File.ReadAllText(securityLessonsPath);
                SecurityLessons = JsonSerializer.Deserialize<List<SecurityLesson>>(securityLessonsJson, new JsonSerializerOptions
                 {
                     PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                     PropertyNameCaseInsensitive = true
                 }) ?? new List<SecurityLesson>();
                Console.WriteLine($"Loaded {SecurityLessons.Count()} Security lessons");
            }

            // Load Security Interview Questions
            var securityQuestionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "security-fundamentals.json");
            Console.WriteLine($"Security questions path: {securityQuestionsPath}");
            Console.WriteLine($"Security questions file exists: {System.IO.File.Exists(securityQuestionsPath)}");
            if (System.IO.File.Exists(securityQuestionsPath))
            {
                var securityQuestionsJson = System.IO.File.ReadAllText(securityQuestionsPath);
                
                // Parse as JsonDocument to check structure
                using var doc = JsonDocument.Parse(securityQuestionsJson);
                
                if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                {
                    // Wrapper structure - deserialize the questions array
                    var questionsJson = questionsElement.GetRawText();
                    SecurityInterviewQuestions = JsonSerializer.Deserialize<List<SecurityInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<SecurityInterviewQuestion>();
                 }
                 else
                 {
                     // Direct array structure
                     SecurityInterviewQuestions = JsonSerializer.Deserialize<List<SecurityInterviewQuestion>>(securityQuestionsJson, new JsonSerializerOptions
                     {
                         PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                         PropertyNameCaseInsensitive = true
                     }) ?? new List<SecurityInterviewQuestion>();
                }
                
                Console.WriteLine($"Loaded {SecurityInterviewQuestions.Count()} Security interview questions");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error loading Security data: {ex.Message}");
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
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "version-control.json");
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

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "version-control.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    // Normalize Version questions to handle different schemas and ensure multiple-choice mapping
                    var mappedQuestions = new List<VersionInterviewQuestion>();
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
                                var item = new VersionInterviewQuestion
                                {
                                    Id = GetString(q, "id") ?? "0",
                                    Topic = GetString(q, "topic"),
                                    Type = GetString(q, "type") ?? GetString(q, "questionType") ?? string.Empty,
                                    Question = GetString(q, "question") ?? string.Empty,
                                    Choices = GetStringArray(q, "choices").ToArray(),
                                    CorrectAnswer = GetIntFlexible(q, "correctAnswer") ?? GetIntFlexible(q, "correctIndex"),
                                    Explanation = GetString(q, "explanation")
                                };
                                // Auto-classify multiple-choice when choices and correct answer are present
                                if (item.Choices != null && item.Choices.Length > 0 && item.CorrectAnswer.HasValue)
                                {
                                    item.Type = "multiple-choice";
                                }
                                else if (string.IsNullOrWhiteSpace(item.Type))
                                {
                                    item.Type = "open-ended";
                                }
                                mappedQuestions.Add(item);
                            }
                        }
                        else if (qroot.ValueKind == JsonValueKind.Array)
                        {
                            foreach (var q in qroot.EnumerateArray())
                            {
                                var item = new VersionInterviewQuestion
                                {
                                    Id = GetString(q, "id") ?? "0",
                                    Topic = GetString(q, "topic"),
                                    Type = GetString(q, "type") ?? GetString(q, "questionType") ?? string.Empty,
                                    Question = GetString(q, "question") ?? string.Empty,
                                    Choices = GetStringArray(q, "choices").ToArray(),
                                    CorrectAnswer = GetIntFlexible(q, "correctAnswer") ?? GetIntFlexible(q, "correctIndex"),
                                    Explanation = GetString(q, "explanation")
                                };
                                if (item.Choices != null && item.Choices.Length > 0 && item.CorrectAnswer.HasValue)
                                {
                                    item.Type = "multiple-choice";
                                }
                                else if (string.IsNullOrWhiteSpace(item.Type))
                                {
                                    item.Type = "open-ended";
                                }
                                mappedQuestions.Add(item);
                            }
                        }
                        else
                        {
                            mappedQuestions = new List<VersionInterviewQuestion>();
                        }
                    }
                    catch (Exception)
                    {
                        // Fallback: try parsing as a plain array
                        try
                        {
                            using var qdoc2 = JsonDocument.Parse(questionsJson, new JsonDocumentOptions { AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip });
                            var root2 = qdoc2.RootElement;
                            if (root2.ValueKind == JsonValueKind.Array)
                            {
                                foreach (var q in root2.EnumerateArray())
                                {
                                    var item = new VersionInterviewQuestion
                                    {
                                        Id = GetString(q, "id") ?? "0",
                                        Topic = GetString(q, "topic"),
                                        Type = GetString(q, "type") ?? GetString(q, "questionType") ?? string.Empty,
                                        Question = GetString(q, "question") ?? string.Empty,
                                        Choices = GetStringArray(q, "choices").ToArray(),
                                        CorrectAnswer = GetIntFlexible(q, "correctAnswer") ?? GetIntFlexible(q, "correctIndex"),
                                        Explanation = GetString(q, "explanation")
                                    };
                                    if (item.Choices != null && item.Choices.Length > 0 && item.CorrectAnswer.HasValue)
                                    {
                                        item.Type = "multiple-choice";
                                    }
                                    else if (string.IsNullOrWhiteSpace(item.Type))
                                    {
                                        item.Type = "open-ended";
                                    }
                                    mappedQuestions.Add(item);
                                }
                            }
                            else
                            {
                                mappedQuestions = new List<VersionInterviewQuestion>();
                            }
                        }
                        catch
                        {
                            mappedQuestions = new List<VersionInterviewQuestion>();
                        }
                    }
                    VersionInterviewQuestions = mappedQuestions;
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
        public AnswerResult ValidateReactAnswer(string questionId, int answerIndex)
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
        public AnswerResult ValidateTailwindAnswer(string questionId, int answerIndex)
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
        public AnswerResult ValidateNodeAnswer(string questionId, int answerIndex)
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
        public AnswerResult ValidateSassAnswer(string questionId, int answerIndex)
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
        public AnswerResult ValidateVueAnswer(string questionId, int answerIndex)
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
        public AnswerResult ValidateTypescriptAnswer(string questionId, int answerIndex)
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
        public AnswerResult ValidateDatabaseAnswer(string questionId, int answerIndex)
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
        public AnswerResult ValidateTestingAnswer(string questionId, int answerIndex)
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
        public AnswerResult ValidateProgrammingAnswer(string questionId, int answerIndex)
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
        public AnswerResult ValidateWebAnswer(string questionId, int answerIndex)
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
                var lessonsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "lessons", "laravel-fundamentals.json");
                if (System.IO.File.Exists(lessonsPath))
                {
                    var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
                    LaravelLessons = System.Text.Json.JsonSerializer.Deserialize<List<LaravelLesson>>(lessonsJson, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                        PropertyNameCaseInsensitive = true
                    }) ?? new List<LaravelLesson>();
                    Console.WriteLine($"Loaded {LaravelLessons.Count()} Laravel lessons");
                }
                else
                {
                    Console.WriteLine($"Laravel lessons file not found at {lessonsPath}");
                    LaravelLessons = new List<LaravelLesson>();
                }

                var questionsPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "..", "..", "..", "..", "..", "content", "quizzes", "laravel-fundamentals.json");
                if (System.IO.File.Exists(questionsPath))
                {
                    var questionsJson = System.IO.File.ReadAllText(questionsPath);
                    
                    // Parse as JsonDocument to check structure
                    using var doc = JsonDocument.Parse(questionsJson);
                    
                    if (doc.RootElement.TryGetProperty("questions", out var questionsElement))
                    {
                        // Wrapper structure - deserialize the questions array
                        var questionsArrayJson = questionsElement.GetRawText();
                        LaravelInterviewQuestions = JsonSerializer.Deserialize<List<LaravelInterviewQuestion>>(questionsArrayJson, new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                            PropertyNameCaseInsensitive = true
                        }) ?? new List<LaravelInterviewQuestion>();
                    }
                    else
                    {
                        // Direct array structure
                        LaravelInterviewQuestions = JsonSerializer.Deserialize<List<LaravelInterviewQuestion>>(questionsJson, new JsonSerializerOptions
                        {
                            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                            PropertyNameCaseInsensitive = true
                        }) ?? new List<LaravelInterviewQuestion>();
                    }
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
        public AnswerResult ValidateSecurityAnswer(string questionId, int answerIndex)
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
        public AnswerResult ValidateVersionAnswer(string questionId, int answerIndex)
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