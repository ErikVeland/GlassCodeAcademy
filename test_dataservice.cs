using System;
using System.IO;
using System.Text.Json;
using backend.Services;

class Program
{
    static void Main()
    {
        try
        {
            Console.WriteLine("Testing DataService initialization...");
            
            // Try to create an instance of DataService
            var dataService = DataService.Instance;
            
            Console.WriteLine("DataService initialized successfully!");
            Console.WriteLine($"Laravel Lessons Count: {dataService.LaravelLessons.Count()}");
            Console.WriteLine($"Laravel Questions Count: {dataService.LaravelInterviewQuestions.Count()}");
            Console.WriteLine($"React Lessons Count: {dataService.ReactLessons.Count()}");
            Console.WriteLine($"React Questions Count: {dataService.ReactInterviewQuestions.Count()}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error initializing DataService: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
        }
    }
}