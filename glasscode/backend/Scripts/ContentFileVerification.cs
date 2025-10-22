using System;
using System.IO;
using System.Threading.Tasks;
using System.Text.Json;
using System.Linq;
using backend.Models;

// Use alias to avoid conflict with HotChocolate.Path
using IOPath = System.IO.Path;

namespace backend.Scripts
{
    public class ContentFileVerification
    {
        public static async Task Main(string[] args)
        {
            await VerifyContentFiles();
        }
        
        public static async Task VerifyContentFiles()
        {
            Console.WriteLine("[START] Verifying content files...");
            
            var assemblyLocation = System.Reflection.Assembly.GetExecutingAssembly().Location;
            if (string.IsNullOrEmpty(assemblyLocation))
            {
                Console.WriteLine("[ERROR] Unable to determine assembly location");
                return;
            }
            
            var contentPath = IOPath.Combine(IOPath.GetDirectoryName(assemblyLocation) ?? "", "..", "..", "content");
            if (!Directory.Exists(contentPath))
            {
                Console.WriteLine($"[ERROR] Content directory not found at: {contentPath}");
                return;
            }
            
            // Check registry file
            var registryPath = IOPath.Combine(contentPath, "registry.json");
            if (!File.Exists(registryPath))
            {
                Console.WriteLine($"[ERROR] Registry file not found at: {registryPath}");
                return;
            }
            
            Console.WriteLine($"[SUCCESS] Registry file found: {registryPath}");
            
            // Parse registry to get expected modules
            var registryJson = await File.ReadAllTextAsync(registryPath);
            ModuleRegistryData? registry = null;
            
            try
            {
                registry = JsonSerializer.Deserialize<ModuleRegistryData>(registryJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"[ERROR] Error parsing registry.json: {ex.Message}");
                return;
            }
            
            if (registry?.Modules == null)
            {
                Console.WriteLine("[ERROR] Failed to parse registry.json");
                return;
            }
            
            Console.WriteLine($"[INFO] Found {registry.Modules.Count} modules in registry");
            
            // Check lessons directory
            var lessonsPath = IOPath.Combine(contentPath, "lessons");
            if (!Directory.Exists(lessonsPath))
            {
                Console.WriteLine($"[ERROR] Lessons directory not found at: {lessonsPath}");
                return;
            }
            
            Console.WriteLine($"[SUCCESS] Lessons directory found: {lessonsPath}");
            
            // Check quizzes directory
            var quizzesPath = IOPath.Combine(contentPath, "quizzes");
            if (!Directory.Exists(quizzesPath))
            {
                Console.WriteLine($"[ERROR] Quizzes directory not found at: {quizzesPath}");
                return;
            }
            
            Console.WriteLine($"[SUCCESS] Quizzes directory found: {quizzesPath}");
            
            // Verify each module has corresponding lesson and quiz files
            Console.WriteLine($"\n[MODULE_CHECK] Module File Verification:");
            Console.WriteLine($"{"Module Name",-30} {"Lesson File",-20} {"Quiz File",-20} {"Status",-10}");
            Console.WriteLine(new string('-', 90));
            
            var missingLessonFiles = 0;
            var missingQuizFiles = 0;
            var validModules = 0;
            
            foreach (var module in registry.Modules.OrderBy(m => m.Tier).ThenBy(m => m.Track))
            {
                var lessonFileName = $"{module.Slug}.json";
                var quizFileName = $"{module.Slug}.json";
                
                var lessonFilePath = IOPath.Combine(lessonsPath, lessonFileName);
                var quizFilePath = IOPath.Combine(quizzesPath, quizFileName);
                
                var lessonExists = File.Exists(lessonFilePath);
                var quizExists = File.Exists(quizFilePath);
                
                if (!lessonExists) missingLessonFiles++;
                if (!quizExists) missingQuizFiles++;
                
                var status = lessonExists && quizExists ? "[SUCCESS]" : "[ERROR]";
                if (lessonExists && quizExists) validModules++;
                
                Console.WriteLine($"{module.Title,-30} {lessonFileName,-20} {quizFileName,-20} {status,10}");
                
                // Validate JSON structure if files exist
                if (lessonExists)
                {
                    await ValidateLessonFile(lessonFilePath, module.Slug);
                }
                
                if (quizExists)
                {
                    await ValidateQuizFile(quizFilePath, module.Slug);
                }
            }
            
            Console.WriteLine(new string('-', 90));
            Console.WriteLine($"{"SUMMARY",-30} {"",-20} {"",-20} {((validModules == registry.Modules.Count) ? "[SUCCESS]" : "[ERROR]"),10}");
            
            // Summary
            Console.WriteLine($"\n[FILE_CHECK] File Verification Summary:");
            Console.WriteLine($"   Modules with complete files: {validModules}/{registry.Modules.Count}");
            Console.WriteLine($"   Missing lesson files: {missingLessonFiles}");
            Console.WriteLine($"   Missing quiz files: {missingQuizFiles}");
            
            if (validModules == registry.Modules.Count)
            {
                Console.WriteLine("\n[SUCCESS] All content files are present and properly structured!");
            }
            else
            {
                Console.WriteLine("\n[WARNING] Some content files are missing:");
                if (missingLessonFiles > 0)
                    Console.WriteLine($"   - {missingLessonFiles} lesson files missing");
                if (missingQuizFiles > 0)
                    Console.WriteLine($"   - {missingQuizFiles} quiz files missing");
            }
        }
        
        private static async Task ValidateLessonFile(string filePath, string moduleSlug)
        {
            try
            {
                var jsonContent = await File.ReadAllTextAsync(filePath);
                
                // Try to parse as array first
                try
                {
                    var lessons = JsonSerializer.Deserialize<JsonElement[]>(jsonContent, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    
                    if (lessons != null)
                    {
                        Console.WriteLine($"   [LESSON] Lesson file contains {lessons.Length} lessons");
                    }
                }
                catch (JsonException)
                {
                    // Try parsing as object with lessons property
                    try
                    {
                        var wrapper = JsonSerializer.Deserialize<JsonElement>(jsonContent);
                        if (wrapper.ValueKind == JsonValueKind.Object && 
                            wrapper.TryGetProperty("lessons", out var lessonsElement) && 
                            lessonsElement.ValueKind == JsonValueKind.Array)
                        {
                            Console.WriteLine($"   [LESSON] Lesson file contains {lessonsElement.GetArrayLength()} lessons in wrapper");
                        }
                        else
                        {
                            Console.WriteLine($"   [WARNING] Unexpected lesson file structure for {moduleSlug}");
                        }
                    }
                    catch (JsonException)
                    {
                        Console.WriteLine($"   [WARNING] Invalid JSON structure in lesson file for {moduleSlug}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   [ERROR] Error validating lesson file for {moduleSlug}: {ex.Message}");
            }
        }
        
        private static async Task ValidateQuizFile(string filePath, string moduleSlug)
        {
            try
            {
                var jsonContent = await File.ReadAllTextAsync(filePath);
                var quizData = JsonSerializer.Deserialize<QuizFileData>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                if (quizData?.Questions != null)
                {
                    Console.WriteLine($"   [QUIZ] Quiz file contains {quizData.Questions.Count} questions");
                }
                else
                {
                    Console.WriteLine($"   [WARNING] No questions found in quiz file for {moduleSlug}");
                }
            }
            catch (JsonException ex)
            {
                Console.WriteLine($"   [ERROR] Invalid JSON in quiz file for {moduleSlug}: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"   [ERROR] Error validating quiz file for {moduleSlug}: {ex.Message}");
            }
        }
    }
    
    // Data models are defined in Models/ContentModels.cs to avoid duplication
}