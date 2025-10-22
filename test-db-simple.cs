using System;
using System.Data;
using Npgsql;

class Program
{
    static void Main()
    {
        try
        {
            Console.WriteLine("Testing database connection...");
            
            string connectionString = "Host=localhost;Database=glasscode_dev;Username=postgres;Password=postgres;Port=5432";
            
            using var connection = new NpgsqlConnection(connectionString);
            connection.Open();
            
            Console.WriteLine("Database connection: SUCCESS");
            
            // Check counts
            CheckTableCount(connection, "Modules", "SELECT COUNT(*) FROM \"Modules\"");
            CheckTableCount(connection, "Lessons", "SELECT COUNT(*) FROM \"Lessons\"");
            CheckTableCount(connection, "LessonQuizzes", "SELECT COUNT(*) FROM \"LessonQuizzes\"");
            
            // Check for programming fundamentals
            CheckProgrammingModule(connection);
            
            // Check quiz data for a specific module
            CheckQuizData(connection, "programming-fundamentals");
            
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
    
    static void CheckTableCount(NpgsqlConnection connection, string tableName, string query)
    {
        try
        {
            using var cmd = new NpgsqlCommand(query, connection);
            var count = (long)cmd.ExecuteScalar();
            Console.WriteLine($"{tableName}: {count}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error checking {tableName}: {ex.Message}");
        }
    }
    
    static void CheckProgrammingModule(NpgsqlConnection connection)
    {
        try
        {
            using var cmd = new NpgsqlCommand("SELECT \"Id\", \"Title\", \"Slug\" FROM \"Modules\" WHERE \"Slug\" = 'programming-fundamentals'", connection);
            using var reader = cmd.ExecuteReader();
            
            if (reader.Read())
            {
                var id = reader.GetInt32("Id");
                var title = reader.GetString("Title");
                var slug = reader.GetString("Slug");
                Console.WriteLine($"Programming module found: {title} (ID: {id}, Slug: {slug})");
            }
            else
            {
                Console.WriteLine("Programming module NOT found");
            }
            reader.Close();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error checking programming module: {ex.Message}");
        }
    }
    
    static void CheckQuizData(NpgsqlConnection connection, string moduleSlug)
    {
        try
        {
            // Get module ID
            using var cmd = new NpgsqlCommand("SELECT \"Id\" FROM \"Modules\" WHERE \"Slug\" = @slug", connection);
            cmd.Parameters.AddWithValue("slug", moduleSlug);
            var moduleIdObj = cmd.ExecuteScalar();
            
            if (moduleIdObj != null)
            {
                var moduleId = (int)moduleIdObj;
                Console.WriteLine($"Module {moduleSlug} has ID: {moduleId}");
                
                // Count lessons for this module
                using var lessonCmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Lessons\" WHERE \"ModuleId\" = @moduleId", connection);
                lessonCmd.Parameters.AddWithValue("moduleId", moduleId);
                var lessonCount = (long)lessonCmd.ExecuteScalar();
                Console.WriteLine($"Lessons for {moduleSlug}: {lessonCount}");
                
                // Count quizzes for this module
                using var quizCmd = new NpgsqlCommand(@"
                    SELECT COUNT(*) 
                    FROM ""LessonQuizzes"" q
                    JOIN ""Lessons"" l ON q.""LessonId"" = l.""Id""
                    WHERE l.""ModuleId"" = @moduleId", connection);
                quizCmd.Parameters.AddWithValue("moduleId", moduleId);
                var quizCount = (long)quizCmd.ExecuteScalar();
                Console.WriteLine($"Quizzes for {moduleSlug}: {quizCount}");
            }
            else
            {
                Console.WriteLine($"Module {moduleSlug} not found");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error checking quiz data: {ex.Message}");
        }
    }
}