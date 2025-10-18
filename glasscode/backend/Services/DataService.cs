using backend.Models;
using backend.Controllers;
using System.Text.Json;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Configuration;

namespace backend.Services {
  public class DataService {
    // Singleton instance to hold all data
    private static readonly DataService _instance = new DataService();
    public static DataService Instance => _instance;

    // Content directory path - resolved once and cached
    private static string ? _contentPath;
    public static string ContentPath => _contentPath ??= GetContentPath();

    // Helper method to find the content directory using robust app root path resolution
    private static string GetContentPath() {
      Console.WriteLine($"🔍 Starting path resolution from BaseDirectory: {AppDomain.CurrentDomain.BaseDirectory}");

      // Priority 1: Environment variable (for production/docker deployments)
      var envContentPath = Environment.GetEnvironmentVariable("GLASSCODE_CONTENT_PATH");
      if (!string.IsNullOrEmpty(envContentPath) && Directory.Exists(envContentPath)) {
        Console.WriteLine($"🔍 Using environment content path: {envContentPath}");
        return envContentPath;
      }

      // Priority 2: App root environment variable
      var appRoot = Environment.GetEnvironmentVariable("GLASSCODE_APP_ROOT");
      if (!string.IsNullOrEmpty(appRoot)) {
        var contentDir = System.IO.Path.Combine(appRoot, "content");
        if (Directory.Exists(contentDir)) {
          Console.WriteLine($"🔍 Using app root content path: {contentDir}");
          return contentDir;
        }
      }

      // Priority 3: Use multiple strategies to find app root
      var appRootPath = FindAppRootRobust();
      if (!string.IsNullOrEmpty(appRootPath)) {
        var contentDir = System.IO.Path.Combine(appRootPath, "content");
        if (Directory.Exists(contentDir)) {
          Console.WriteLine($"🔍 Found content directory via robust app root detection: {contentDir}");
          return contentDir;
        }
      }

      // Priority 4: Hardcoded fallback paths for common scenarios
      var fallbackPaths = GetFallbackContentPaths();
      foreach(var fallbackPath in fallbackPaths) {
        if (Directory.Exists(fallbackPath)) {
          Console.WriteLine($"🔍 Found content directory via fallback path: {fallbackPath}");
          return fallbackPath;
        }
      }

      // Final fallback: use current directory
      var finalFallback = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "content");
      Console.WriteLine($"⚠️  Could not locate content directory, using base directory: {finalFallback}");
      return finalFallback;
    }

    // Find the application root using multiple robust strategies
    private static string ? FindAppRootRobust() {
      Console.WriteLine("🔍 Starting robust app root detection...");

      // Strategy 1: Search from BaseDirectory upwards
      var appRoot = SearchForAppRoot(AppDomain.CurrentDomain.BaseDirectory);
      if (!string.IsNullOrEmpty(appRoot)) {
        Console.WriteLine($"🔍 Found app root via BaseDirectory search: {appRoot}");
        return appRoot;
      }

      // Strategy 2: Search from current working directory upwards
      var workingDir = Directory.GetCurrentDirectory();
      appRoot = SearchForAppRoot(workingDir);
      if (!string.IsNullOrEmpty(appRoot)) {
        Console.WriteLine($"🔍 Found app root via working directory search: {appRoot}");
        return appRoot;
      }

      // Strategy 3: Search from assembly location upwards
      var assemblyLocation = System.Reflection.Assembly.GetExecutingAssembly().Location;
      if (!string.IsNullOrEmpty(assemblyLocation)) {
        var assemblyDir = System.IO.Path.GetDirectoryName(assemblyLocation);
        if (!string.IsNullOrEmpty(assemblyDir)) {
          appRoot = SearchForAppRoot(assemblyDir);
          if (!string.IsNullOrEmpty(appRoot)) {
            Console.WriteLine($"🔍 Found app root via assembly location search: {appRoot}");
            return appRoot;
          }
        }
      }

      Console.WriteLine("⚠️ Could not find app root using any strategy");
      return null;
    }

    // Helper method to search for app root from a given starting directory
    private static string ? SearchForAppRoot(string startPath) {
      var currentDir = new DirectoryInfo(startPath);

      while (currentDir != null) {
        // Look for key files that indicate the app root
        var keyFiles = new [] {
          "global.json",
          "README.md",
          "bootstrap.sh",
          ".gitignore"
        };
        var hasKeyFiles = keyFiles.Any(file => File.Exists(System.IO.Path.Combine(currentDir.FullName, file)));

        // Also check for the glasscode directory structure
        var hasGlassCodeStructure = Directory.Exists(System.IO.Path.Combine(currentDir.FullName, "glasscode")) &&
          Directory.Exists(System.IO.Path.Combine(currentDir.FullName, "content"));

        if (hasKeyFiles && hasGlassCodeStructure) {
          return currentDir.FullName;
        }

        currentDir = currentDir.Parent;
      }

      return null;
    }

    // Get fallback content paths for common deployment scenarios
    private static string[] GetFallbackContentPaths() {
      var fallbackPaths = new List < string > ();

      // Common development paths
      fallbackPaths.Add("/Users/veland/GlassCodeAcademy/content");
      fallbackPaths.Add(System.IO.Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "GlassCodeAcademy", "content"));

      // Common deployment paths
      fallbackPaths.Add("/academy/content");
      fallbackPaths.Add("/app/content");
      fallbackPaths.Add("/var/www/glasscode/content");

      // Relative to common base directories
      var baseDir = AppDomain.CurrentDomain.BaseDirectory;

      // Go up from publish directory structure
      var publishParent = System.IO.Path.GetDirectoryName(System.IO.Path.GetDirectoryName(System.IO.Path.GetDirectoryName(baseDir))); // ../../../
      if (!string.IsNullOrEmpty(publishParent)) {
        fallbackPaths.Add(System.IO.Path.Combine(publishParent, "content"));
        var publishGrandParent = System.IO.Path.GetDirectoryName(publishParent);
        if (!string.IsNullOrEmpty(publishGrandParent)) {
          fallbackPaths.Add(System.IO.Path.Combine(publishGrandParent, "content")); // ../../../../content
        }
      }

      // Search in parent directories of current location
      var currentParent = System.IO.Path.GetDirectoryName(baseDir);
      for (int i = 0; i < 5 && !string.IsNullOrEmpty(currentParent); i++) {
        fallbackPaths.Add(System.IO.Path.Combine(currentParent, "content"));
        currentParent = System.IO.Path.GetDirectoryName(currentParent);
      }

      return fallbackPaths.Distinct().ToArray();
    }

    public DataService() {
      Console.WriteLine("🚀 DataService constructor started - using lazy loading");
      // Data will be loaded on-demand when properties are first accessed
    }

    // Verify that all data was loaded correctly with detailed error reporting
    private void VerifyDataIntegrity() {
      Console.WriteLine("🔍 Verifying data integrity...");
      Console.WriteLine($"🔍 Base Directory: {AppDomain.CurrentDomain.BaseDirectory}");
      Console.WriteLine($"🔍 Content path: {ContentPath}");

      var moduleChecks = new List < (string Name, Func < int > CountFunc, string LessonsPath, string QuestionsPath) > {
        ("DotNet", () => DotNetLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "dotnet-fundamentals.json"), System.IO.Path.Combine(ContentPath, "quizzes", "dotnet-fundamentals.json")),
        ("GraphQL", () => GraphQLLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "graphql-advanced.json"), System.IO.Path.Combine(ContentPath, "quizzes", "graphql-advanced.json")),
        ("Laravel", () => LaravelLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "laravel-fundamentals.json"), System.IO.Path.Combine(ContentPath, "quizzes", "laravel-fundamentals.json")),
        ("React", () => ReactLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "react-fundamentals.json"), System.IO.Path.Combine(ContentPath, "quizzes", "react-fundamentals.json")),
        ("Tailwind", () => TailwindLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "tailwind-advanced.json"), System.IO.Path.Combine(ContentPath, "quizzes", "tailwind-advanced.json")),
        ("Node", () => NodeLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "node-fundamentals.json"), System.IO.Path.Combine(ContentPath, "quizzes", "node-fundamentals.json")),
        ("Sass", () => SassLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "sass-advanced.json"), System.IO.Path.Combine(ContentPath, "quizzes", "sass-advanced.json")),
        ("Vue", () => VueLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "vue-advanced.json"), System.IO.Path.Combine(ContentPath, "quizzes", "vue-advanced.json")),
        ("TypeScript", () => TypescriptLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "typescript-fundamentals.json"), System.IO.Path.Combine(ContentPath, "quizzes", "typescript-fundamentals.json")),
        ("Database", () => DatabaseLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "database-systems.json"), System.IO.Path.Combine(ContentPath, "quizzes", "database-systems.json")),
        ("Testing", () => TestingLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "testing-fundamentals.json"), System.IO.Path.Combine(ContentPath, "quizzes", "testing-fundamentals.json")),
        ("Programming", () => ProgrammingLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "programming-fundamentals.json"), System.IO.Path.Combine(ContentPath, "quizzes", "programming-fundamentals.json")),
        ("Web", () => WebLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "web-fundamentals.json"), System.IO.Path.Combine(ContentPath, "quizzes", "web-fundamentals.json")),
        ("Next.js", () => NextJsLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "nextjs-advanced.json"), System.IO.Path.Combine(ContentPath, "quizzes", "nextjs-advanced.json")),
        ("Performance", () => PerformanceLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "performance-optimization.json"), System.IO.Path.Combine(ContentPath, "quizzes", "performance-optimization.json")),
        ("Security", () => SecurityLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "security-fundamentals.json"), System.IO.Path.Combine(ContentPath, "quizzes", "security-fundamentals.json")),
        ("Version", () => VersionLessons.Count(), System.IO.Path.Combine(ContentPath, "lessons", "version-control.json"), System.IO.Path.Combine(ContentPath, "quizzes", "version-control.json"))
      };

      var questionChecks = new List < (string Name, Func < int > CountFunc) > {
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
      foreach(var check in moduleChecks) {
        try {
          var count = check.CountFunc();
          if (count == 0) {
            Console.WriteLine($"⚠️  WARNING: {check.Name} Lessons has 0 items loaded");
            PerformDetailedFileCheck(check.Name, check.LessonsPath, "lessons");
          } else {
            Console.WriteLine($"✅ {check.Name} Lessons: {count} items");
          }
        } catch (Exception ex) {
          Console.WriteLine($"❌ ERROR: Failed to count {check.Name} Lessons: {ex.Message}");
          Console.WriteLine($"   Stack trace: {ex.StackTrace}");
        }
      }

      // Check questions
      foreach(var check in questionChecks) {
        try {
          var count = check.CountFunc();
          if (count == 0) {
            Console.WriteLine($"⚠️  WARNING: {check.Name} has 0 items loaded");
            var moduleName = check.Name.Replace(" Questions", "");
            var moduleCheck = moduleChecks.FirstOrDefault(m => m.Name == moduleName);
            if (moduleCheck.Name != null) {
              PerformDetailedFileCheck(moduleName, moduleCheck.QuestionsPath, "questions");
            }
          } else {
            Console.WriteLine($"✅ {check.Name}: {count} items");
          }
        } catch (Exception ex) {
          Console.WriteLine($"❌ ERROR: Failed to count {check.Name}: {ex.Message}");
          Console.WriteLine($"   Stack trace: {ex.StackTrace}");
        }
      }

      Console.WriteLine("✅ Data integrity verification completed");
    }

    // Perform detailed file and content checks for failed modules
    private void PerformDetailedFileCheck(string moduleName, string relativePath, string contentType) {
      try {
        // Use the robust ContentPath instead of hardcoded relative paths
        var fileName = System.IO.Path.GetFileName(relativePath);
        var subDirectory = relativePath.Contains("lessons") ? "lessons" : "quizzes";
        var normalizedPath = System.IO.Path.Combine(ContentPath, subDirectory, fileName);

        Console.WriteLine($"   📁 Checking file: {normalizedPath}");

        if (!System.IO.File.Exists(normalizedPath)) {
          Console.WriteLine($"   ❌ File does not exist: {normalizedPath}");

          // Check if directory exists
          var directory = System.IO.Path.GetDirectoryName(normalizedPath);
          if (!System.IO.Directory.Exists(directory)) {
            Console.WriteLine($"   ❌ Directory does not exist: {directory}");
          } else {
            Console.WriteLine($"   📂 Directory exists, listing files:");
            var files = System.IO.Directory.GetFiles(directory, "*.json");
            foreach(var file in files) {
              Console.WriteLine($"      - {System.IO.Path.GetFileName(file)}");
            }
          }
          return;
        }

        Console.WriteLine($"   ✅ File exists");

        // Check file size
        var fileInfo = new System.IO.FileInfo(normalizedPath);
        Console.WriteLine($"   📊 File size: {fileInfo.Length} bytes");

        if (fileInfo.Length == 0) {
          Console.WriteLine($"   ❌ File is empty");
          return;
        }

        // Check JSON validity
        try {
          var jsonContent = System.IO.File.ReadAllText(normalizedPath);
          Console.WriteLine($"   📄 Content length: {jsonContent.Length} characters");

          if (string.IsNullOrWhiteSpace(jsonContent)) {
            Console.WriteLine($"   ❌ File content is empty or whitespace only");
            return;
          }

          // Try to parse JSON
          using
          var document = System.Text.Json.JsonDocument.Parse(jsonContent);
          Console.WriteLine($"   ✅ JSON is valid");

          // Check JSON structure
          var root = document.RootElement;
          if (root.ValueKind == JsonValueKind.Array) {
            Console.WriteLine($"   📋 JSON contains array with {root.GetArrayLength()} items");
            if (root.GetArrayLength() == 0) {
              Console.WriteLine($"   ⚠️  JSON array is empty - this explains why 0 items were loaded");
            }
          } else if (root.ValueKind == JsonValueKind.Object) {
            Console.WriteLine($"   📋 JSON is an object");
            if (root.TryGetProperty("questions", out
                var questionsProperty)) {
              if (questionsProperty.ValueKind == JsonValueKind.Array) {
                Console.WriteLine($"   📋 Found 'questions' array with {questionsProperty.GetArrayLength()} items");
                if (questionsProperty.GetArrayLength() == 0) {
                  Console.WriteLine($"   ⚠️  Questions array is empty - this explains why 0 items were loaded");
                }
              }
            } else {
              Console.WriteLine($"   ⚠️  Object structure doesn't contain expected 'questions' property");
              Console.WriteLine($"   🔍 Available properties:");
              foreach(var property in root.EnumerateObject()) {
                Console.WriteLine($"      - {property.Name}: {property.Value.ValueKind}");
              }
            }
          } else {
            Console.WriteLine($"   ❌ Unexpected JSON structure: {root.ValueKind}");
          }
        } catch (System.Text.Json.JsonException jsonEx) {
          Console.WriteLine($"   ❌ Invalid JSON: {jsonEx.Message}");
          Console.WriteLine($"   📍 Error at line {jsonEx.LineNumber}, position {jsonEx.BytePositionInLine}");

          // Show snippet around error
          try {
            var lines = System.IO.File.ReadAllLines(normalizedPath);
            if (jsonEx.LineNumber.HasValue && jsonEx.LineNumber.Value <= lines.Length) {
              var errorLine = (int) jsonEx.LineNumber.Value - 1; // Convert to 0-based
              var start = Math.Max(0, errorLine - 2);
              var end = Math.Min(lines.Length - 1, errorLine + 2);

              Console.WriteLine($"   📝 Content around error:");
              for (int i = start; i <= end; i++) {
                var marker = i == errorLine ? ">>> " : "    ";
                Console.WriteLine($"   {marker}Line {i + 1}: {lines[i]}");
              }
            }
          } catch (Exception ex) {
            Console.WriteLine($"   ❌ Could not read file lines for error context: {ex.Message}");
          }
        }
      } catch (Exception ex) {
        Console.WriteLine($"   ❌ Error during detailed file check: {ex.Message}");
        Console.WriteLine($"   📍 Stack trace: {ex.StackTrace}");
      }
    }

    // Data collections with lazy loading
    private IEnumerable<BaseLesson>? _dotNetLessons;
    public IEnumerable<BaseLesson> DotNetLessons {
      get {
        if (_dotNetLessons == null) {
          Console.WriteLine("📚 Lazy loading DotNet data...");
          LoadDotNetData();
        }
        return _dotNetLessons ?? new List<BaseLesson>();
      }
      private set => _dotNetLessons = value;
    }
    public IEnumerable < BaseLesson > GraphQLLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > DotNetInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();
    public IEnumerable < BaseInterviewQuestion > GraphQLInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Laravel data collections
    public IEnumerable < BaseLesson > LaravelLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > LaravelInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();
    public IEnumerable < BaseInterviewQuestion > ReactInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // React data collections with lazy loading
    private IEnumerable<BaseLesson>? _reactLessons;
    public IEnumerable<BaseLesson> ReactLessons {
      get {
        if (_reactLessons == null) {
          Console.WriteLine("📚 Lazy loading React data...");
          LoadReactData();
        }
        return _reactLessons ?? new List<BaseLesson>();
      }
      private set => _reactLessons = value;
    }

    // Tailwind data collections with lazy loading
    private IEnumerable<BaseLesson>? _tailwindLessons;
    public IEnumerable<BaseLesson> TailwindLessons {
      get {
        if (_tailwindLessons == null) {
          Console.WriteLine("📚 Lazy loading Tailwind data...");
          LoadTailwindData();
        }
        return _tailwindLessons ?? new List<BaseLesson>();
      }
      private set => _tailwindLessons = value;
    }
    public IEnumerable < BaseInterviewQuestion > TailwindInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Node.js data collections
    public IEnumerable < BaseLesson > NodeLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > NodeInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // SASS data collections
    public IEnumerable < BaseLesson > SassLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > SassInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Vue data collections
    public IEnumerable < BaseLesson > VueLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > VueInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // TypeScript data collections
    public IEnumerable < BaseLesson > TypescriptLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > TypescriptInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Database data collections
    public IEnumerable < BaseLesson > DatabaseLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > DatabaseInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Testing data collections
    public IEnumerable < BaseLesson > TestingLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > TestingInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Programming data collections
    public IEnumerable < BaseLesson > ProgrammingLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > ProgrammingInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Web Fundamentals data collections
    public IEnumerable < BaseLesson > WebLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > WebInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Next.js data collections
    public IEnumerable < BaseLesson > NextJsLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > NextJsInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Performance Optimization data collections
    public IEnumerable < BaseLesson > PerformanceLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > PerformanceInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Security Fundamentals data collections
    public IEnumerable < BaseLesson > SecurityLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > SecurityInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Version Control data collections
    public IEnumerable < BaseLesson > VersionLessons {
      get;
      private set;
    } = new List < BaseLesson > ();
    public IEnumerable < BaseInterviewQuestion > VersionInterviewQuestions {
      get;
      private set;
    } = new List < BaseInterviewQuestion > ();

    // Helper method to validate JSON format
    private void ValidateJsonFormat(string json, string dataType) {
      try {
        // Try to parse the JSON to validate its format
        using
        var document = System.Text.Json.JsonDocument.Parse(json, new JsonDocumentOptions {
          AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip
        });
        Console.WriteLine($"✅ {dataType} JSON format validated successfully");
      } catch (System.Text.Json.JsonException ex) {
        Console.WriteLine($"❌ Invalid JSON format in {dataType}: {ex.Message}");
        Console.WriteLine($"JSON snippet: {json.Substring(0, Math.Min(100, json.Length))}...");
        throw; // Re-throw to handle in the calling method
      }
    }

    // Helper methods
    public static IEnumerable < T > ApplyQuery < T > (IEnumerable < T > items, string ? topic, string ? sortBy, string ? sortOrder, int ? limit, int ? offset) {
      var query = items;
      if (!string.IsNullOrEmpty(topic)) {
        var prop = typeof (T).GetProperty("Topic");
        if (prop != null)
          query = query.Where(x => (prop.GetValue(x)?.ToString() ?? "").Equals(topic, StringComparison.OrdinalIgnoreCase));
      }
      if (!string.IsNullOrEmpty(sortBy)) {
        var prop = typeof (T).GetProperty(sortBy);
        if (prop != null) {
          query = (sortOrder?.ToLower() == "desc") ?
            query.OrderByDescending(x => prop.GetValue(x)) :
            query.OrderBy(x => prop.GetValue(x));
        }
      }
      if (offset.HasValue) query = query.Skip(offset.Value);
      if (limit.HasValue) query = query.Take(limit.Value);
      return query;
    }

    // Answer validation
    public AnswerResult ValidateAnswer(int questionId, int answerIndex) {
      // Try to find the question in any collection
      var allQuestionCollections = new List < IEnumerable < BaseInterviewQuestion >> {
        DotNetInterviewQuestions,
        ReactInterviewQuestions,
        VueInterviewQuestions,
        NodeInterviewQuestions,
        TypescriptInterviewQuestions,
        DatabaseInterviewQuestions,
        TestingInterviewQuestions,
        SassInterviewQuestions,
        TailwindInterviewQuestions,
        NextJsInterviewQuestions,
        LaravelInterviewQuestions,
        GraphQLInterviewQuestions,
        ProgrammingInterviewQuestions,
        WebInterviewQuestions,
        PerformanceInterviewQuestions,
        SecurityInterviewQuestions
      };

      foreach(var collection in allQuestionCollections) {
        var question = collection.FirstOrDefault(q => q.Id == questionId);
        if (question != null) {
          bool isCorrect = question.Type == "open-ended" ||
            (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

          return new AnswerResult {
            IsCorrect = isCorrect,
              Explanation = question.Explanation
          };
        }
      }

      return new AnswerResult {
        IsCorrect = false, Explanation = "Question not found."
      };
    }

    // Progress tracking
    public ProgressResult TrackProgress(int userId, int lessonId, string module) {
      // In-memory demo: just echo back the input
      return new ProgressResult {
        UserId = userId, LessonId = lessonId, ModuleSlug = module, Status = "completed"
      };
    }

    // Load React data from JSON files
    private void LoadReactData() {
      try {
        Console.WriteLine("Starting LoadReactData...");
        // Load React Lessons
        var reactLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "react-fundamentals.json");
        Console.WriteLine($"React lessons path: {reactLessonsPath}");
        Console.WriteLine($"React lessons file exists: {System.IO.File.Exists(reactLessonsPath)}");

        if (System.IO.File.Exists(reactLessonsPath)) {
          var reactLessonsJson = System.IO.File.ReadAllText(reactLessonsPath);
          Console.WriteLine($"React lessons JSON length: {reactLessonsJson.Length}");
          ReactLessons = JsonSerializer.Deserialize < List < BaseLesson >> (reactLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {ReactLessons.Count()} React lessons");
        } else {
          Console.WriteLine("React lessons file not found!");
        }

        // Load React Interview Questions
        var reactQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "react-fundamentals.json");
        Console.WriteLine($"React questions path: {reactQuestionsPath}");
        Console.WriteLine($"React questions file exists: {System.IO.File.Exists(reactQuestionsPath)}");

        if (System.IO.File.Exists(reactQuestionsPath)) {
          var reactQuestionsJson = System.IO.File.ReadAllText(reactQuestionsPath);
          Console.WriteLine($"React questions JSON length: {reactQuestionsJson.Length}");

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(reactQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            ReactInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            ReactInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (reactQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {ReactInterviewQuestions.Count()} React interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading React data: {ex.Message}");
        ReactLessons = new List < BaseLesson > ();
        ReactInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load Laravel data from JSON files
    private void LoadLaravelData() {
      try {
          Console.WriteLine("Starting LoadLaravelData...");
          // Load Laravel Lessons
          var LaravelLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "Laravel-fundamentals.json");
          Console.WriteLine($"Laravel lessons path: {LaravelLessonsPath}");
          Console.WriteLine($"Laravel lessons file exists: {System.IO.File.Exists(LaravelLessonsPath)}");

          if (System.IO.File.Exists(LaravelLessonsPath)) {
            var LaravelLessonsJson = System.IO.File.ReadAllText(LaravelLessonsPath);
            Console.WriteLine($"Laravel lessons JSON length: {LaravelLessonsJson.Length}");
            LaravelLessons = JsonSerializer.Deserialize < List < BaseLesson >> (LaravelLessonsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseLesson > ();
            Console.WriteLine($"Loaded {LaravelLessons.Count()} Laravel lessons");
          } else {
            Console.WriteLine("Laravel lessons file not found!");
          }

          // Load Laravel Interview Questions
          var LaravelQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "Laravel-fundamentals.json");
          Console.WriteLine($"Laravel questions path: {LaravelQuestionsPath}");
          Console.WriteLine($"Laravel questions file exists: {System.IO.File.Exists(LaravelQuestionsPath)}");

          if (System.IO.File.Exists(LaravelQuestionsPath)) {
            var LaravelQuestionsJson = System.IO.File.ReadAllText(LaravelQuestionsPath);
            Console.WriteLine($"Laravel questions JSON length: {LaravelQuestionsJson.Length}");

            // Parse as JsonDocument to check structure
            using
            var doc = JsonDocument.Parse(LaravelQuestionsJson);

            if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
                var questionsElement)) {
              // Wrapper structure - deserialize the questions array
              var questionsJson = questionsElement.GetRawText();
              LaravelInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                  PropertyNameCaseInsensitive = true
              }) ?? new List < BaseInterviewQuestion > ();
            } else {
              // Direct array structure
              LaravelInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (LaravelQuestionsJson, new JsonSerializerOptions {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                  PropertyNameCaseInsensitive = true
              }) ?? new List < BaseInterviewQuestion > ();
            }

            Console.WriteLine($"Loaded {LaravelInterviewQuestions.Count()} Laravel interview questions");
          }
        } catch (Exception ex) {
          Console.WriteLine($"Error loading Laravel data: {ex.Message}");
          LaravelLessons = new List < BaseLesson > ();
          LaravelInterviewQuestions = new List < BaseInterviewQuestion > ();
        }
    }

    // Load DotNet data from JSON files
    private void LoadDotNetData() {
      Console.WriteLine("🚨 LoadDotNetData method called!");
      try {
        Console.WriteLine("🔄 Starting LoadDotNetData...");
        Console.WriteLine($"🔍 ContentPath value: {ContentPath}");

        // Load DotNet lessons
        var dotnetLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "dotnet-fundamentals.json");
        Console.WriteLine($"Looking for DotNet lessons at: {dotnetLessonsPath}");

        if (File.Exists(dotnetLessonsPath)) {
          var dotnetLessonsJson = File.ReadAllText(dotnetLessonsPath);
          Console.WriteLine($"DotNet lessons JSON length: {dotnetLessonsJson.Length}");

          // Try to deserialize as wrapper object first, then as direct array
          try {
            var wrapper = JsonSerializer.Deserialize < JsonElement > (dotnetLessonsJson);
            if (wrapper.ValueKind == JsonValueKind.Object && wrapper.TryGetProperty("lessons", out
                var lessonsElement)) {
              DotNetLessons = JsonSerializer.Deserialize < List < BaseLesson >> (lessonsElement.GetRawText(), new JsonSerializerOptions {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                  PropertyNameCaseInsensitive = true
              }) ?? new List < BaseLesson > ();
            } else {
              // Direct array structure
              DotNetLessons = JsonSerializer.Deserialize < List < BaseLesson >> (dotnetLessonsJson, new JsonSerializerOptions {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                  PropertyNameCaseInsensitive = true
              }) ?? new List < BaseLesson > ();
            }
          } catch (JsonException) {
            // Fallback to direct array deserialization
            DotNetLessons = JsonSerializer.Deserialize < List < BaseLesson >> (dotnetLessonsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseLesson > ();
          }

          Console.WriteLine($"Loaded {DotNetLessons.Count()} DotNet lessons");
        }

        // Load DotNet interview questions
        var dotnetQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "dotnet-fundamentals.json");
        Console.WriteLine($"Looking for DotNet questions at: {dotnetQuestionsPath}");

        if (File.Exists(dotnetQuestionsPath)) {
          var dotnetQuestionsJson = File.ReadAllText(dotnetQuestionsPath);
          Console.WriteLine($"DotNet questions JSON length: {dotnetQuestionsJson.Length}");

          // Try to deserialize as wrapper object first, then as direct array
          try {
            var wrapper = JsonSerializer.Deserialize < JsonElement > (dotnetQuestionsJson);
            if (wrapper.ValueKind == JsonValueKind.Object && wrapper.TryGetProperty("questions", out
                var questionsElement)) {
              DotNetInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsElement.GetRawText(), new JsonSerializerOptions {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                  PropertyNameCaseInsensitive = true
              }) ?? new List < BaseInterviewQuestion > ();
            } else {
              // Direct array structure
              DotNetInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (dotnetQuestionsJson, new JsonSerializerOptions {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                  PropertyNameCaseInsensitive = true
              }) ?? new List < BaseInterviewQuestion > ();
            }
          } catch (JsonException) {
            // Fallback to direct array deserialization
            DotNetInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (dotnetQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {DotNetInterviewQuestions.Count()} DotNet interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading DotNet data: {ex.Message}");
        DotNetLessons = new List < BaseLesson > ();
        DotNetInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load Tailwind data from JSON files
    private void LoadTailwindData() {
      try {
        Console.WriteLine("🔄 Starting LoadTailwindData...");

        // Load Tailwind Lessons
        var tailwindLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "tailwind-advanced.json");
        Console.WriteLine($"📁 Tailwind lessons path: {tailwindLessonsPath}");

        if (System.IO.File.Exists(tailwindLessonsPath)) {
          Console.WriteLine("✅ Tailwind lessons file exists");
          var tailwindLessonsJson = System.IO.File.ReadAllText(tailwindLessonsPath);
          Console.WriteLine($"📄 Read {tailwindLessonsJson.Length} characters from lessons file");

          TailwindLessons = JsonSerializer.Deserialize < List < BaseLesson >> (tailwindLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"✅ Loaded {TailwindLessons.Count()} Tailwind lessons");
        } else {
          Console.WriteLine("❌ Tailwind lessons file does not exist");
          TailwindLessons = new List < BaseLesson > ();
        }

        // Load Tailwind Interview Questions
        var tailwindQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "tailwind-advanced.json");
        Console.WriteLine($"📁 Tailwind questions path: {tailwindQuestionsPath}");

        if (System.IO.File.Exists(tailwindQuestionsPath)) {
          Console.WriteLine("✅ Tailwind questions file exists");
          var tailwindQuestionsJson = System.IO.File.ReadAllText(tailwindQuestionsPath);
          Console.WriteLine($"📄 Read {tailwindQuestionsJson.Length} characters from questions file");

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(tailwindQuestionsJson);
          Console.WriteLine($"📋 JSON parsed successfully");

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            Console.WriteLine($"📋 Found 'questions' property with {questionsElement.GetArrayLength()} items");
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            Console.WriteLine($"📄 Extracted questions JSON: {questionsJson.Length} characters");

            TailwindInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
            Console.WriteLine($"✅ Deserialized {TailwindInterviewQuestions.Count()} questions from wrapper structure");
          } else {
            Console.WriteLine("📋 No 'questions' property found, trying direct array structure");
            // Direct array structure
            TailwindInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (tailwindQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
            Console.WriteLine($"✅ Deserialized {TailwindInterviewQuestions.Count()} questions from direct array");
          }

          Console.WriteLine($"✅ Final result: Loaded {TailwindInterviewQuestions.Count()} Tailwind interview questions");
        } else {
          Console.WriteLine("❌ Tailwind questions file does not exist");
          TailwindInterviewQuestions = new List < BaseInterviewQuestion > ();
        }
      } catch (Exception ex) {
        Console.WriteLine($"❌ Error loading Tailwind data: {ex.Message}");
        Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
        TailwindLessons = new List < BaseLesson > ();
        TailwindInterviewQuestions = new List < BaseInterviewQuestion > ();
      }

      Console.WriteLine($"🏁 LoadTailwindData completed. Final counts - Lessons: {TailwindLessons.Count()}, Questions: {TailwindInterviewQuestions.Count()}");
    }

    // Load Node.js data from JSON files
    private void LoadNodeData() {
      try {
        // Load Node Lessons
        var nodeLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "node-fundamentals.json");
        if (System.IO.File.Exists(nodeLessonsPath)) {
          var nodeLessonsJson = System.IO.File.ReadAllText(nodeLessonsPath);
          NodeLessons = JsonSerializer.Deserialize < List < BaseLesson >> (nodeLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {NodeLessons.Count()} Node lessons");
        }

        // Load Node Interview Questions
        var nodeQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "node-fundamentals.json");
        if (System.IO.File.Exists(nodeQuestionsPath)) {
          var nodeQuestionsJson = System.IO.File.ReadAllText(nodeQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(nodeQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            NodeInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            NodeInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (nodeQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {NodeInterviewQuestions.Count()} Node interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading Node data: {ex.Message}");
        NodeLessons = new List < BaseLesson > ();
        NodeInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load SASS data from JSON files
    private void LoadSassData() {
      try {
        // Load Sass Lessons
        var sassLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "sass-advanced.json");
        if (System.IO.File.Exists(sassLessonsPath)) {
          var sassLessonsJson = System.IO.File.ReadAllText(sassLessonsPath);
          SassLessons = JsonSerializer.Deserialize < List < BaseLesson >> (sassLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {SassLessons.Count()} Sass lessons");
        }

        // Load Sass Interview Questions
        var sassQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "sass-advanced.json");
        if (System.IO.File.Exists(sassQuestionsPath)) {
          var sassQuestionsJson = System.IO.File.ReadAllText(sassQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(sassQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            SassInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            SassInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (sassQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {SassInterviewQuestions.Count()} Sass interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading Sass data: {ex.Message}");
        SassLessons = new List < BaseLesson > ();
        SassInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load Vue data from JSON files
    private void LoadVueData() {
      try {
        // Load Vue Lessons
        var vueLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "vue-advanced.json");
        if (System.IO.File.Exists(vueLessonsPath)) {
          var vueLessonsJson = System.IO.File.ReadAllText(vueLessonsPath);
          VueLessons = JsonSerializer.Deserialize < List < BaseLesson >> (vueLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {VueLessons.Count()} Vue lessons");
        }

        // Load Vue Interview Questions
        var vueQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "vue-advanced.json");
        if (System.IO.File.Exists(vueQuestionsPath)) {
          var vueQuestionsJson = System.IO.File.ReadAllText(vueQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(vueQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            VueInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            VueInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (vueQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {VueInterviewQuestions.Count()} Vue interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading Vue data: {ex.Message}");
        VueLessons = new List < BaseLesson > ();
        VueInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load TypeScript data from JSON files
    private void LoadTypescriptData() {
      try {
        // Load Typescript Lessons
        var typescriptLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "typescript-fundamentals.json");
        if (System.IO.File.Exists(typescriptLessonsPath)) {
          var typescriptLessonsJson = System.IO.File.ReadAllText(typescriptLessonsPath);
          TypescriptLessons = JsonSerializer.Deserialize < List < BaseLesson >> (typescriptLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {TypescriptLessons.Count()} Typescript lessons");
        }

        // Load Typescript Interview Questions
        var typescriptQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "typescript-fundamentals.json");
        if (System.IO.File.Exists(typescriptQuestionsPath)) {
          var typescriptQuestionsJson = System.IO.File.ReadAllText(typescriptQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(typescriptQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            TypescriptInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            TypescriptInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (typescriptQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {TypescriptInterviewQuestions.Count()} Typescript interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading Typescript data: {ex.Message}");
        TypescriptLessons = new List < BaseLesson > ();
        TypescriptInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load Database data from JSON files
    private void LoadDatabaseData() {
      try {
        // Load Database Lessons
        var databaseLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "database-systems.json");
        if (System.IO.File.Exists(databaseLessonsPath)) {
          var databaseLessonsJson = System.IO.File.ReadAllText(databaseLessonsPath);
          DatabaseLessons = JsonSerializer.Deserialize < List < BaseLesson >> (databaseLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {DatabaseLessons.Count()} Database lessons");
        }

        // Load Database Interview Questions
        var databaseQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "database-systems.json");
        if (System.IO.File.Exists(databaseQuestionsPath)) {
          var databaseQuestionsJson = System.IO.File.ReadAllText(databaseQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(databaseQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            DatabaseInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            DatabaseInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (databaseQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {DatabaseInterviewQuestions.Count()} Database interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading Database data: {ex.Message}");
        DatabaseLessons = new List < BaseLesson > ();
        DatabaseInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load GraphQL data from JSON files
    private void LoadGraphQLData() {
      try {
        // Load GraphQL Lessons
        var graphqlLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "graphql-advanced.json");
        if (System.IO.File.Exists(graphqlLessonsPath)) {
          var graphqlLessonsJson = System.IO.File.ReadAllText(graphqlLessonsPath);
          GraphQLLessons = JsonSerializer.Deserialize < List < BaseLesson >> (graphqlLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {GraphQLLessons.Count()} GraphQL lessons");
        }

        // Load GraphQL Interview Questions
        var graphqlQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "graphql-advanced.json");
        if (System.IO.File.Exists(graphqlQuestionsPath)) {
          var graphqlQuestionsJson = System.IO.File.ReadAllText(graphqlQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(graphqlQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            GraphQLInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            GraphQLInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (graphqlQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {GraphQLInterviewQuestions.Count()} GraphQL interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading GraphQL data: {ex.Message}");
        GraphQLLessons = new List < BaseLesson > ();
        GraphQLInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load Testing data from JSON files
    private void LoadTestingData() {
      try {
        // Load Testing Lessons
        var testingLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "testing-fundamentals.json");
        if (System.IO.File.Exists(testingLessonsPath)) {
          var testingLessonsJson = System.IO.File.ReadAllText(testingLessonsPath);
          TestingLessons = JsonSerializer.Deserialize < List < BaseLesson >> (testingLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {TestingLessons.Count()} Testing lessons");
        }

        // Load Testing Interview Questions
        var testingQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "testing-fundamentals.json");
        if (System.IO.File.Exists(testingQuestionsPath)) {
          var testingQuestionsJson = System.IO.File.ReadAllText(testingQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(testingQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            TestingInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            TestingInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (testingQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {TestingInterviewQuestions.Count()} Testing interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading Testing data: {ex.Message}");
        TestingLessons = new List < BaseLesson > ();
        TestingInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load Programming data from JSON files
    private void LoadProgrammingData() {
      try {
        // Load Programming Lessons
        var programmingLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "programming-fundamentals.json");
        if (System.IO.File.Exists(programmingLessonsPath)) {
          var programmingLessonsJson = System.IO.File.ReadAllText(programmingLessonsPath);
          ProgrammingLessons = JsonSerializer.Deserialize < List < BaseLesson >> (programmingLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {ProgrammingLessons.Count()} Programming lessons");
        }

        // Load Programming Interview Questions
        var programmingQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "programming-fundamentals.json");
        if (System.IO.File.Exists(programmingQuestionsPath)) {
          var programmingQuestionsJson = System.IO.File.ReadAllText(programmingQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(programmingQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            ProgrammingInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            ProgrammingInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (programmingQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {ProgrammingInterviewQuestions.Count()} Programming interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading Programming data: {ex.Message}");
        ProgrammingLessons = new List < BaseLesson > ();
        ProgrammingInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load Web data from JSON files
    private void LoadWebData() {
      try {
        // Load Web Lessons
        var webLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "web-fundamentals.json");
        if (System.IO.File.Exists(webLessonsPath)) {
          var webLessonsJson = System.IO.File.ReadAllText(webLessonsPath);
          WebLessons = JsonSerializer.Deserialize < List < BaseLesson >> (webLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {WebLessons.Count()} Web lessons");
        }

        // Load Web Interview Questions
        var webQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "web-fundamentals.json");
        if (System.IO.File.Exists(webQuestionsPath)) {
          var webQuestionsJson = System.IO.File.ReadAllText(webQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(webQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            WebInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            WebInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (webQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {WebInterviewQuestions.Count()} Web interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading Web data: {ex.Message}");
        WebLessons = new List < BaseLesson > ();
        WebInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load Next.js data from JSON files
    private void LoadNextJsData() {
      try {
        // Load NextJs Lessons
        var nextjsLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "nextjs-advanced.json");
        if (System.IO.File.Exists(nextjsLessonsPath)) {
          var nextjsLessonsJson = System.IO.File.ReadAllText(nextjsLessonsPath);
          NextJsLessons = JsonSerializer.Deserialize < List < BaseLesson >> (nextjsLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {NextJsLessons.Count()} NextJs lessons");
        }

        // Load NextJs Interview Questions
        var nextjsQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "nextjs-advanced.json");
        if (System.IO.File.Exists(nextjsQuestionsPath)) {
          var nextjsQuestionsJson = System.IO.File.ReadAllText(nextjsQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(nextjsQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            NextJsInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            NextJsInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (nextjsQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {NextJsInterviewQuestions.Count()} NextJs interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading NextJs data: {ex.Message}");
        NextJsLessons = new List < BaseLesson > ();
        NextJsInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load Performance Optimization data from JSON files
    private void LoadPerformanceData() {
      try {
        // Load Performance Lessons
        var performanceLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "performance-optimization.json");
        if (System.IO.File.Exists(performanceLessonsPath)) {
          var performanceLessonsJson = System.IO.File.ReadAllText(performanceLessonsPath);
          PerformanceLessons = JsonSerializer.Deserialize < List < BaseLesson >> (performanceLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {PerformanceLessons.Count()} Performance lessons");
        }

        // Load Performance Interview Questions
        var performanceQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "performance-optimization.json");
        if (System.IO.File.Exists(performanceQuestionsPath)) {
          var performanceQuestionsJson = System.IO.File.ReadAllText(performanceQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(performanceQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            PerformanceInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            PerformanceInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (performanceQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {PerformanceInterviewQuestions.Count()} Performance interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading Performance data: {ex.Message}");
        PerformanceLessons = new List < BaseLesson > ();
        PerformanceInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load Security Fundamentals data from JSON files
    private void LoadSecurityData() {
      try {
        // Load Security Lessons
        var securityLessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "security-fundamentals.json");
        Console.WriteLine($"Security lessons path: {securityLessonsPath}");
        Console.WriteLine($"Security lessons file exists: {System.IO.File.Exists(securityLessonsPath)}");
        if (System.IO.File.Exists(securityLessonsPath)) {
          var securityLessonsJson = System.IO.File.ReadAllText(securityLessonsPath);
          SecurityLessons = JsonSerializer.Deserialize < List < BaseLesson >> (securityLessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
          Console.WriteLine($"Loaded {SecurityLessons.Count()} Security lessons");
        }

        // Load Security Interview Questions
        var securityQuestionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "security-fundamentals.json");
        Console.WriteLine($"Security questions path: {securityQuestionsPath}");
        Console.WriteLine($"Security questions file exists: {System.IO.File.Exists(securityQuestionsPath)}");
        if (System.IO.File.Exists(securityQuestionsPath)) {
          var securityQuestionsJson = System.IO.File.ReadAllText(securityQuestionsPath);

          // Parse as JsonDocument to check structure
          using
          var doc = JsonDocument.Parse(securityQuestionsJson);

          if (doc.RootElement.ValueKind == JsonValueKind.Object && doc.RootElement.TryGetProperty("questions", out
              var questionsElement)) {
            // Wrapper structure - deserialize the questions array
            var questionsJson = questionsElement.GetRawText();
            SecurityInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (questionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          } else {
            // Direct array structure
            SecurityInterviewQuestions = JsonSerializer.Deserialize < List < BaseInterviewQuestion >> (securityQuestionsJson, new JsonSerializerOptions {
              PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                PropertyNameCaseInsensitive = true
            }) ?? new List < BaseInterviewQuestion > ();
          }

          Console.WriteLine($"Loaded {SecurityInterviewQuestions.Count()} Security interview questions");
        }
      } catch (Exception ex) {
        Console.WriteLine($"Error loading Security data: {ex.Message}");
        SecurityLessons = new List < BaseLesson > ();
        SecurityInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    // Load Version Control data from JSON files
    private void LoadVersionData() {
      try {
        var lessonsPath = System.IO.Path.Combine(ContentPath, "lessons", "version-control.json");
        if (System.IO.File.Exists(lessonsPath)) {
          var lessonsJson = System.IO.File.ReadAllText(lessonsPath);
          VersionLessons = System.Text.Json.JsonSerializer.Deserialize < List < BaseLesson >> (lessonsJson, new JsonSerializerOptions {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
              PropertyNameCaseInsensitive = true
          }) ?? new List < BaseLesson > ();
        } else {
          Console.WriteLine($"Version lessons file not found at {lessonsPath}");
          VersionLessons = new List < BaseLesson > ();
        }

        var questionsPath = System.IO.Path.Combine(ContentPath, "quizzes", "version-control.json");
        if (System.IO.File.Exists(questionsPath)) {
          var questionsJson = System.IO.File.ReadAllText(questionsPath);
          // Normalize Version questions to handle different schemas and ensure multiple-choice mapping
          var mappedQuestions = new List < BaseInterviewQuestion > ();
          try {
            using
            var qdoc = JsonDocument.Parse(questionsJson, new JsonDocumentOptions {
              AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip
            });
            JsonElement qroot = qdoc.RootElement;
            JsonElement qarray = qroot;
            if (qroot.ValueKind == JsonValueKind.Object) {
              if (qroot.TryGetProperty("questions", out
                  var qarr) && qarr.ValueKind == JsonValueKind.Array) {
                qarray = qarr;
              } else {
                qarray =
                  default;
              }
            }
            if (qarray.ValueKind == JsonValueKind.Array) {
              foreach(var q in qarray.EnumerateArray()) {
                var item = new BaseInterviewQuestion {
                  Id = GetIntFlexible(q, "id") ?? 0,
                    Topic = GetString(q, "topic"),
                    Type = GetString(q, "type") ?? GetString(q, "questionType") ?? string.Empty,
                    Question = GetString(q, "question") ?? string.Empty,
                    Choices = GetStringArray(q, "choices").ToArray(),
                    CorrectAnswer = GetIntFlexible(q, "correctAnswer") ?? GetIntFlexible(q, "correctIndex"),
                    Explanation = GetString(q, "explanation")
                };
                // Auto-classify multiple-choice when choices and correct answer are present
                if (item.Choices != null && item.Choices.Length > 0 && item.CorrectAnswer.HasValue) {
                  item.Type = "multiple-choice";
                } else if (string.IsNullOrWhiteSpace(item.Type)) {
                  item.Type = "open-ended";
                }
                mappedQuestions.Add(item);
              }
            } else if (qroot.ValueKind == JsonValueKind.Array) {
              foreach(var q in qroot.EnumerateArray()) {
                var item = new BaseInterviewQuestion {
                  Id = GetIntFlexible(q, "id") ?? 0,
                    Topic = GetString(q, "topic"),
                    Type = GetString(q, "type") ?? GetString(q, "questionType") ?? string.Empty,
                    Question = GetString(q, "question") ?? string.Empty,
                    Choices = GetStringArray(q, "choices").ToArray(),
                    CorrectAnswer = GetIntFlexible(q, "correctAnswer") ?? GetIntFlexible(q, "correctIndex"),
                    Explanation = GetString(q, "explanation")
                };
                if (item.Choices != null && item.Choices.Length > 0 && item.CorrectAnswer.HasValue) {
                  item.Type = "multiple-choice";
                } else if (string.IsNullOrWhiteSpace(item.Type)) {
                  item.Type = "open-ended";
                }
                mappedQuestions.Add(item);
              }
            } else {
              mappedQuestions = new List < BaseInterviewQuestion > ();
            }
          } catch (Exception) {
            // Fallback: try parsing as a plain array
            try {
              using
              var qdoc2 = JsonDocument.Parse(questionsJson, new JsonDocumentOptions {
                AllowTrailingCommas = true, CommentHandling = JsonCommentHandling.Skip
              });
              var root2 = qdoc2.RootElement;
              if (root2.ValueKind == JsonValueKind.Array) {
                foreach(var q in root2.EnumerateArray()) {
                  var item = new BaseInterviewQuestion {
                    Id = GetIntFlexible(q, "id") ?? 0,
                      Topic = GetString(q, "topic"),
                      Type = GetString(q, "type") ?? GetString(q, "questionType") ?? string.Empty,
                      Question = GetString(q, "question") ?? string.Empty,
                      Choices = GetStringArray(q, "choices").ToArray(),
                      CorrectAnswer = GetIntFlexible(q, "correctAnswer") ?? GetIntFlexible(q, "correctIndex"),
                      Explanation = GetString(q, "explanation")
                  };
                  if (item.Choices != null && item.Choices.Length > 0 && item.CorrectAnswer.HasValue) {
                    item.Type = "multiple-choice";
                  } else if (string.IsNullOrWhiteSpace(item.Type)) {
                    item.Type = "open-ended";
                  }
                  mappedQuestions.Add(item);
                }
              } else {
                mappedQuestions = new List < BaseInterviewQuestion > ();
              }
            } catch {
              mappedQuestions = new List < BaseInterviewQuestion > ();
            }
          }
          VersionInterviewQuestions = mappedQuestions;
        } else {
          Console.WriteLine($"Version questions file not found at {questionsPath}");
          VersionInterviewQuestions = new List < BaseInterviewQuestion > ();
        }
      } catch (System.Text.Json.JsonException jsonEx) {
        Console.WriteLine($"Error deserializing Version data: {jsonEx.Message}");
        VersionLessons = new List < BaseLesson > ();
        VersionInterviewQuestions = new List < BaseInterviewQuestion > ();
      } catch (Exception ex) {
        Console.WriteLine($"Error loading Version Control data: {ex.Message}");
        VersionLessons = new List < BaseLesson > ();
        VersionInterviewQuestions = new List < BaseInterviewQuestion > ();
      }
    }

    private static string ? GetString(JsonElement el, string prop) {
      if (el.TryGetProperty(prop, out
          var v)) {
        if (v.ValueKind == JsonValueKind.String) return v.GetString();
        return v.ToString();
      }
      return null;
    }

    private static string ? GetStringFlexible(JsonElement el, string prop) {
      if (!el.TryGetProperty(prop, out
          var v)) return null;
      try {
        if (v.ValueKind == JsonValueKind.String) return v.GetString();
        if (v.ValueKind == JsonValueKind.Number) {
          if (v.TryGetInt32(out
              var i)) return i.ToString();
          if (v.TryGetInt64(out
              var l)) return l.ToString();
          return v.ToString();
        }
        return v.ToString();
      } catch {
        return v.ToString();
      }
    }

    private static int ? GetIntFlexible(JsonElement el, string prop) {
      if (!el.TryGetProperty(prop, out
          var v)) return null;
      try {
        if (v.ValueKind == JsonValueKind.Number) {
          if (v.TryGetInt32(out
              var i)) return i;
          if (v.TryGetInt64(out
              var l)) return (int) l;
        } else if (v.ValueKind == JsonValueKind.String) {
          if (int.TryParse(v.GetString(), out
              var i)) return i;
        }
        return null;
      } catch {
        return null;
      }
    }

    private static string ? GetNestedString(JsonElement el, string parent, string child) {
      if (el.TryGetProperty(parent, out
          var p) && p.ValueKind == JsonValueKind.Object) {
        if (p.TryGetProperty(child, out
            var c)) {
          if (c.ValueKind == JsonValueKind.String) return c.GetString();
          return c.ToString();
        }
      }
      return null;
    }

    private static List < string > GetStringArray(JsonElement el, string prop) {
      var result = new List < string > ();
      if (el.TryGetProperty(prop, out
          var arr) && arr.ValueKind == JsonValueKind.Array) {
        foreach(var item in arr.EnumerateArray()) {
          if (item.ValueKind == JsonValueKind.String) result.Add(item.GetString() !);
          else result.Add(item.ToString());
        }
      }
      return result;
    }

    // React answer validation
    public AnswerResult ValidateReactAnswer(int questionId, int answerIndex) {
      var question = ReactInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Laravel answer validation
    public AnswerResult ValidateLaravelAnswer(int questionId, int answerIndex) {
      var question = LaravelInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Tailwind answer validation
    public AnswerResult ValidateTailwindAnswer(int questionId, int answerIndex) {
      var question = TailwindInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Node.js answer validation
    public AnswerResult ValidateNodeAnswer(int questionId, int answerIndex) {
      var question = NodeInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // SASS answer validation
    public AnswerResult ValidateSassAnswer(int questionId, int answerIndex) {
      var question = SassInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Vue answer validation
    public AnswerResult ValidateVueAnswer(int questionId, int answerIndex) {
      var question = VueInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // TypeScript answer validation
    public AnswerResult ValidateTypescriptAnswer(int questionId, int answerIndex) {
      var question = TypescriptInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Database answer validation
    public AnswerResult ValidateDatabaseAnswer(int questionId, int answerIndex) {
      var question = DatabaseInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Testing answer validation
    public AnswerResult ValidateTestingAnswer(int questionId, int answerIndex) {
      var question = TestingInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Programming answer validation
    public AnswerResult ValidateProgrammingAnswer(int questionId, int answerIndex) {
      var question = ProgrammingInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Web Fundamentals answer validation
    public AnswerResult ValidateWebAnswer(int questionId, int answerIndex) {
      var question = WebInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Next.js answer validation
    public AnswerResult ValidateNextJsAnswer(int questionId, int answerIndex) {
      var question = NextJsInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Performance Optimization answer validation
    public AnswerResult ValidatePerformanceAnswer(int questionId, int answerIndex) {
      var question = PerformanceInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Security Fundamentals answer validation
    public AnswerResult ValidateSecurityAnswer(int questionId, int answerIndex) {
      var question = SecurityInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }

    // Version Control answer validation
    public AnswerResult ValidateVersionAnswer(int questionId, int answerIndex) {
      var question = VersionInterviewQuestions.FirstOrDefault(q => q.Id == questionId);
      if (question == null) {
        return new AnswerResult {
          IsCorrect = false,
            Explanation = "Question not found."
        };
      }

      bool isCorrect = question.Type == "open-ended" ||
        (question.CorrectAnswer.HasValue && answerIndex == question.CorrectAnswer.Value);

      return new AnswerResult {
        IsCorrect = isCorrect,
          Explanation = question.Explanation
      };
    }
  }
}
