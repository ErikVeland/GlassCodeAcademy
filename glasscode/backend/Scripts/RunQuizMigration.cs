using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using backend.Data;
using backend.Scripts;

namespace backend.Scripts
{
    public class RunQuizMigration
    {
        public static async Task RunAsync(string[] args)
        {
            // Build configuration
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .Build();

            // Get connection string
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            // Configure DbContext
            var options = new DbContextOptionsBuilder<GlassCodeDbContext>()
                .UseNpgsql(connectionString)
                .Options;

            using var context = new GlassCodeDbContext(options);

            // Ensure database is created
            await context.Database.EnsureCreatedAsync();

            // Run migration
            var migration = new BulkQuizMigration(context);
            await migration.MigrateQuizzesAsync();

            Console.WriteLine("Quiz migration completed! Press any key to exit...");
            Console.ReadKey();
        }
    }
}