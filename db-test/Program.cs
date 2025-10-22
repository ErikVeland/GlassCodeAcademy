using System;
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
            
            // Count modules
            using var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM \"Modules\"", connection);
            var result = cmd.ExecuteScalar();
            Console.WriteLine($"Total modules in database: {result}");
            
            // List module slugs
            using var cmd2 = new NpgsqlCommand("SELECT \"Slug\", \"Title\" FROM \"Modules\" ORDER BY \"Order\"", connection);
            using var reader = cmd2.ExecuteReader();
            Console.WriteLine("Modules:");
            while (reader.Read())
            {
                Console.WriteLine($"  - {reader.GetString(0)}: {reader.GetString(1)}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}
