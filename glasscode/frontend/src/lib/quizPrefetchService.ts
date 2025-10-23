/**
 * Quiz Prefetch Service Worker
 * Handles background prefetching of quizzes to improve loading performance
 */

class QuizPrefetchService {
  private static instance: QuizPrefetchService;
  private isPrefetching = false;
  private prefetchQueue: string[] = [];
  private prefetchedModules = new Set<string>();
  private maxConcurrent = 2;
  private delayBetweenRequests = 1000;
  private batchSize = 3;
  private queueLength = 0;

  private constructor() {}

  static getInstance(): QuizPrefetchService {
    if (!QuizPrefetchService.instance) {
      QuizPrefetchService.instance = new QuizPrefetchService();
    }
    return QuizPrefetchService.instance;
  }

  /**
   * Start prefetching quizzes in the background
   */
  async startPrefetching(priorityOrder: 'tier' | 'popularity' | 'alphabetical' = 'tier') {
    if (this.isPrefetching) {
      console.log('[QuizPrefetchService] Already prefetching, skipping');
      return;
    }

    this.isPrefetching = true;
    console.log('[QuizPrefetchService] Starting quiz prefetch process');

    try {
      // Get modules in priority order
      const modules = await this.getModulesByPriority(priorityOrder);
      
      // Add to queue
      this.prefetchQueue = modules.map(m => m.slug);
      this.queueLength = this.prefetchQueue.length;
      
      console.log(`[QuizPrefetchService] Queue initialized with ${this.queueLength} modules`);
      
      // Process queue
      await this.processQueue();
      
      console.log('[QuizPrefetchService] Completed quiz prefetch process');
    } catch (error) {
      console.error('[QuizPrefetchService] Error in prefetch process:', error);
    } finally {
      this.isPrefetching = false;
    }
  }

  /**
   * Get modules sorted by priority
   */
  private async getModulesByPriority(priorityOrder: string) {
    try {
      // Dynamically import contentRegistry to avoid SSR issues
      const { contentRegistry } = await import('@/lib/contentRegistry');
      
      const modules = await contentRegistry.getModules();
      // const tiers = await contentRegistry.getTiers(); // Unused variable
      
      switch (priorityOrder) {
        case 'tier':
          // Sort by tier level (foundational -> core -> specialized -> quality)
          const tierOrder = ['foundational', 'core', 'specialized', 'quality'];
          return modules.sort((a, b) => {
            const aTierIndex = tierOrder.indexOf(a.tier);
            const bTierIndex = tierOrder.indexOf(b.tier);
            
            if (aTierIndex !== bTierIndex) {
              return aTierIndex - bTierIndex;
            }
            
            // Within same tier, sort by order
            return (a.order || 0) - (b.order || 0);
          });
          
        case 'popularity':
          // For now, just sort alphabetically as we don't have popularity data
          return modules.sort((a, b) => a.title.localeCompare(b.title));
          
        case 'alphabetical':
        default:
          return modules.sort((a, b) => a.title.localeCompare(b.title));
      }
    } catch (error) {
      console.error('[QuizPrefetchService] Error getting modules:', error);
      return [];
    }
  }

  /**
   * Process the prefetch queue
   */
  private async processQueue() {
    while (this.prefetchQueue.length > 0) {
      // Take a batch from the queue
      const batch = this.prefetchQueue.splice(0, this.batchSize);
      
      console.log(`[QuizPrefetchService] Processing batch: ${batch.join(', ')}. Remaining: ${this.prefetchQueue.length}`);
      
      // Process batch concurrently
      const promises = batch.map(slug => this.prefetchQuiz(slug));
      await Promise.all(promises);
      
      // Add delay between batches
      if (this.prefetchQueue.length > 0) {
        console.log(`[QuizPrefetchService] Waiting ${this.delayBetweenRequests}ms before next batch`);
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
      }
    }
  }

  /**
   * Prefetch a single quiz
   */
  private async prefetchQuiz(moduleSlug: string) {
    // Skip if already prefetched
    if (this.prefetchedModules.has(moduleSlug)) {
      console.log(`[QuizPrefetchService] Already prefetched ${moduleSlug}, skipping`);
      return;
    }

    try {
      // Check cache first
      const cacheKey = `quiz_prefetch_${moduleSlug}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { timestamp } = JSON.parse(cached);
        // Reuse cache if less than 30 minutes old
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          console.log(`[QuizPrefetchService] Using cached quiz for ${moduleSlug}`);
          this.prefetchedModules.add(moduleSlug);
          return;
        }
      }
      
      console.log(`[QuizPrefetchService] Fetching quiz for ${moduleSlug}`);
      
      // Dynamically import contentRegistry to avoid SSR issues
      const { contentRegistry } = await import('@/lib/contentRegistry');
      const shortSlug = await contentRegistry.getShortSlugFromModuleSlug(moduleSlug) || moduleSlug;
      
      // Fetch the quiz
      const quiz = await contentRegistry.getModuleQuiz(moduleSlug);
      
      if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        // Cache the full quiz data in both local and session storage
        localStorage.setItem(`quiz_prefetch_${shortSlug}`, JSON.stringify({
          timestamp: Date.now(),
          data: quiz
        }));
        try {
          sessionStorage.setItem(`prefetch_quiz_${shortSlug}`, JSON.stringify({
            timestamp: Date.now(),
            data: quiz
          }));
        } catch {
          // Ignore storage errors
        }
        
        this.prefetchedModules.add(moduleSlug);
        console.log(`[QuizPrefetchService] Successfully prefetched quiz for ${moduleSlug} (${quiz.questions.length} questions)`);
      } else {
        console.log(`[QuizPrefetchService] No questions found for ${moduleSlug}`);
      }
    } catch (error) {
      console.error(`[QuizPrefetchService] Error prefetching quiz for ${moduleSlug}:`, error);
    }
  }

  /**
   * Check if a quiz has been prefetched
   */
  isQuizPrefetched(moduleSlug: string): boolean {
    return this.prefetchedModules.has(moduleSlug);
  }

  /**
   * Get prefetch status
   */
  getPrefetchStatus() {
    return {
      isPrefetching: this.isPrefetching,
      queueLength: this.prefetchQueue.length,
      prefetchedCount: this.prefetchedModules.size
    };
  }

  /**
   * Clear prefetch cache
   */
  clearCache() {
    // Clear all quiz prefetch cache entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('quiz_prefetch_')) {
        localStorage.removeItem(key);
      }
    }
    
    this.prefetchedModules.clear();
    console.log('[QuizPrefetchService] Cache cleared');
  }
}

// Export singleton instance
export const quizPrefetchService = QuizPrefetchService.getInstance();

// Auto-start disabled to avoid duplicate prefetching; start explicitly where needed.