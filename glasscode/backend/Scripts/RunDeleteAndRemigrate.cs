using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Scripts;

namespace backend.Scripts
{
    public class RunDeleteAndRemigrate
    {
        public static async Task RunAsync(string[] args)
        {
            var connectionString = "Host=localhost;Database=glasscode_academy;Username=veland;Password=veland123;Port=5432";
            
            var options = new DbContextOptionsBuilder<GlassCodeDbContext>()
                .UseNpgsql(connectionString)
                .Options;

            using var context = new GlassCodeDbContext(options);
            
            try
            {
                Console.WriteLine("Starting delete and re-migration process...");
                
                var migrator = new DeleteAndRemigrate(context);
                await migrator.DeleteSpecificModulesAndRemigrate();
                
                Console.WriteLine("Process completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during migration: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }
    }
}