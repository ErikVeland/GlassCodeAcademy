using Microsoft.EntityFrameworkCore;
using backend.Data;
using Microsoft.Extensions.Logging;

namespace backend.Services
{
    public class ReadinessService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ReadinessService> _logger;
        private bool _isReady = false;
        private readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1);

        public ReadinessService(IServiceProvider serviceProvider, ILogger<ReadinessService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        public bool IsReady => _isReady;

        public async Task<bool> WaitForReadinessAsync(CancellationToken cancellationToken)
        {
            var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(60)); // 60 second timeout

            try
            {
                while (!cancellationToken.IsCancellationRequested)
                {
                    if (_isReady)
                    {
                        return true;
                    }

                    await Task.Delay(100, cancellationToken); // Check every 100ms
                }

                return false;
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Readiness check was cancelled");
                return false;
            }
        }

        public async Task<bool> CheckAndSetReadinessAsync()
        {
            await _semaphore.WaitAsync();
            try
            {
                if (_isReady)
                {
                    return true;
                }

                _logger.LogInformation("Checking content readiness...");

                // Create a new scope to get a DbContext instance
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<GlassCodeDbContext>();

                // Check if we have modules, lessons, and quizzes
                var hasModules = await context.Modules.AnyAsync();
                var hasLessons = await context.Lessons.AnyAsync();
                var hasQuizzes = await context.LessonQuizzes.AnyAsync();

                if (hasModules && hasLessons && hasQuizzes)
                {
                    // Additional validation: ensure each module has at least one lesson
                    var modules = await context.Modules
                        .Include(m => m.Lessons)
                        .ToListAsync();

                    var allModulesHaveLessons = modules.All(m => m.Lessons.Any());

                    if (allModulesHaveLessons)
                    {
                        _isReady = true;
                        _logger.LogInformation("Content is ready. All modules have lessons and quizzes are present.");
                        return true;
                    }
                    else
                    {
                        _logger.LogWarning("Content not ready: some modules are missing lessons");
                        return false;
                    }
                }
                else
                {
                    _logger.LogWarning($"Content not ready: modules={hasModules}, lessons={hasLessons}, quizzes={hasQuizzes}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking content readiness");
                return false;
            }
            finally
            {
                _semaphore.Release();
            }
        }

        public async Task MarkAsReadyAsync()
        {
            await _semaphore.WaitAsync();
            try
            {
                _isReady = true;
                _logger.LogInformation("Content marked as ready");
            }
            finally
            {
                _semaphore.Release();
            }
        }
    }
}