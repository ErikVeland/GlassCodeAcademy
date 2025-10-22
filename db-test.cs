using System;
using System.Data;
using Npgsql;

class Program
{
    static void Main()
    {
        try
        {
            string connectionString = "Host=localhost;Database=glasscode_dev;Username=postgres;Password=postgres;Port=5432";
            
            using var connection = new NpgsqlConnection(connectionString);
            connection.Open();
            
            Console.WriteLine("Database connection successful!");
            
            // Test query to check if tables exist
            using var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'", connection);
            var result = cmd.ExecuteScalar();
            Console.WriteLine($"Number of tables in public schema: {result}");
            
            // Check if specific tables exist
            string[] tables = { "modules", "lessons", "lessonquizzes" };
            foreach (string table in tables)
            {
                using var countCmd = new NpgsqlCommand($"SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '{table}'", connection);
                var countResult = countCmd.ExecuteScalar();
                Console.WriteLine($"{table} table exists: {Convert.ToInt32(countResult) > 0}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}