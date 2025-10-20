using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using backend.Data;
using backend.Services;

class RunAutomatedMigration
{
    static async Task Main(string[] args)
    {
        Console.WriteLine("🚀 Starting automated migration tool...");

        // Build service provider
        var host = Host.CreateDefaultBuilder(args)
            .ConfigureServices((context, services) =>
            {
                // Add database context
                services.AddDbContext<GlassCodeDbContext>(options =>
                    options.UseNpgsql(context.Configuration.GetConnectionString("DefaultConnection") ??
                                    "Host=localhost;Database=glasscode_dev;Username=postgres;Password=postgres;Port=5432"));

                // Add our services
                services.AddScoped<LessonMappingService>();
                services.AddScoped<AutomatedMigrationService>();
            })
            .Build();

        try
        {
            using var scope = host.Services.CreateScope();
            var serviceProvider = scope.ServiceProvider;
            
            // Get the migration service
            var migrationService = serviceProvider.GetRequiredService<AutomatedMigrationService>();
            
            // Run the migration
            var success = await migrationService.PerformFullMigrationAsync();
            
            if (success)
            {
                Console.WriteLine("✅ Migration completed successfully!");
                Environment.Exit(0);
            }
            else
            {
                Console.WriteLine("❌ Migration failed!");
                Environment.Exit(1);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error during migration: {ex.Message}");
            Console.WriteLine($"📍 Stack trace: {ex.StackTrace}");
            Environment.Exit(1);
        }
    }
}