using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using backend.Data;
using backend.Models;

namespace backend.Scripts
{
    public class CheckModules
    {
        public static async Task Main(string[] args)
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

            // Check for modules
            var modules = await context.Modules
                .Where(m => m.Slug == "programming-fundamentals" || m.Slug == "web-fundamentals")
                .Select(m => new { m.Id, m.Slug, m.Title })
                .ToListAsync();

            Console.WriteLine("Found modules:");
            foreach (var module in modules)
            {
                Console.WriteLine($"ID: {module.Id}, Slug: {module.Slug}, Title: {module.Title}");
            }

            if (modules.Count == 0)
            {
                Console.WriteLine("No modules found with slugs 'programming-fundamentals' or 'web-fundamentals'");
            }

            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }
    }
}