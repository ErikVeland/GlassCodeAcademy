using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace backend.Services
{
    public class ModuleSeedingService
    {
        private readonly GlassCodeDbContext _context;
        private readonly ILogger<ModuleSeedingService> _logger;

        public ModuleSeedingService(GlassCodeDbContext context, ILogger<ModuleSeedingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task SeedModulesFromRegistryAsync()
        {
            try
            {
                // Check if modules already exist
                var existingModulesCount = await _context.Modules.CountAsync();
                if (existingModulesCount > 0)
                {
                    _logger.LogInformation($"✅ Modules already exist in database ({existingModulesCount} modules). Skipping seeding.");
                    return;
                }

                var registryPath = System.IO.Path.Combine(DataService.ContentPath, "registry.json");
                if (!System.IO.File.Exists(registryPath))
                {
                    _logger.LogWarning($"⚠️ Registry file not found at: {registryPath}");
                    return;
                }

                var jsonContent = await System.IO.File.ReadAllTextAsync(registryPath);
                var registryData = JsonSerializer.Deserialize<ModuleRegistryData>(jsonContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (registryData?.Modules == null || !registryData.Modules.Any())
                {
                    _logger.LogWarning("⚠️ No modules found in registry.json");
                    return;
                }

                // Ensure we have a default course
                var defaultCourse = await _context.Courses.FirstOrDefaultAsync();
                if (defaultCourse == null)
                {
                    defaultCourse = new Course
                    {
                        Title = "Glass Code Academy",
                        Description = "Comprehensive programming course",
                        IsPublished = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.Courses.Add(defaultCourse);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("✅ Created default course");
                }

                // Add modules from registry
                var moduleOrder = 1;
                foreach (var moduleData in registryData.Modules)
                {
                    var module = new Module
                    {
                        Title = moduleData.Title,
                        Slug = moduleData.Slug,
                        Description = moduleData.Description,
                        Order = moduleOrder++,
                        CourseId = defaultCourse.Id,
                        IsPublished = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    _context.Modules.Add(module);
                }

                await _context.SaveChangesAsync();
                _logger.LogInformation($"✅ Successfully seeded {registryData.Modules.Count} modules from registry.json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error seeding modules from registry");
                throw;
            }
        }
    }

    public class ModuleRegistryData
    {
        public List<ModuleData> Modules { get; set; } = new();
    }

    public class ModuleData
    {
        public string Slug { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Tier { get; set; } = string.Empty;
        public string Track { get; set; } = string.Empty;
        public List<string> Prerequisites { get; set; } = new();
    }
}