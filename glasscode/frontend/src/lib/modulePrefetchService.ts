/**
 * Module Prefetch Service
 * Prefetches lessons and quizzes for modules in priority order (unlocked by tier)
 * Caches results in localStorage (30m) and sessionStorage (5m) for fast, reliable loads
 */

export type PrefetchPriority = 'tier' | 'alphabetical';

interface PrefetchStatus {
  isPrefetching: boolean;
  queueLength: number;
  completedCount: number;
}

// Module metadata shape used by prefetch ordering and unlock checks
type ModuleMeta = {
  slug: string;
  title: string;
  order?: number;
  tier: 'foundational' | 'core' | 'specialized' | 'quality' | string;
  prerequisites?: string[];
};

class ModulePrefetchService {
  private static instance: ModulePrefetchService;
  private isPrefetching = false;
  private prefetchQueue: string[] = [];
  private completed = new Set<string>();

  // Adaptive network settings
  private maxConcurrent = 3;
  private batchSize = 4;
  private delayBetweenBatches = 800;

  private constructor() {}

  static getInstance(): ModulePrefetchService {
    if (!ModulePrefetchService.instance) {
      ModulePrefetchService.instance = new ModulePrefetchService();
    }
    return ModulePrefetchService.instance;
  }

  async startPrefetching(priority: PrefetchPriority = 'tier') {
    if (this.isPrefetching) return;

    this.isPrefetching = true;
    try {
      this.tuneForNetwork();
      const modules = await this.getUnlockedModules(priority);
      this.prefetchQueue = modules.map(m => m.slug);

      await this.processQueue();
    } catch (err) {
      console.error('[ModulePrefetchService] startPrefetching error:', err);
    } finally {
      this.isPrefetching = false;
    }
  }

  getStatus(): PrefetchStatus {
    return {
      isPrefetching: this.isPrefetching,
      queueLength: this.prefetchQueue.length,
      completedCount: this.completed.size,
    };
  }

  clearCache() {
    if (typeof window === 'undefined') return;
    const keysToClear: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('lessons_prefetch_') || key.startsWith('quiz_prefetch_')) {
        keysToClear.push(key);
      }
    }
    keysToClear.forEach(k => localStorage.removeItem(k));
    this.completed.clear();
  }

  // Internal
  private tuneForNetwork() {
    try {
      interface NetworkInformation { effectiveType?: string }
      const nav = navigator as Navigator & { connection?: NetworkInformation };
      const type = nav.connection?.effectiveType || '4g';
      if (type === '2g' || type === 'slow-2g') {
        this.maxConcurrent = 1;
        this.batchSize = 2;
        this.delayBetweenBatches = 2000;
      } else if (type === '3g') {
        this.maxConcurrent = 2;
        this.batchSize = 3;
        this.delayBetweenBatches = 1200;
      } else {
        this.maxConcurrent = 3;
        this.batchSize = 4;
        this.delayBetweenBatches = 800;
      }
    } catch {}
  }

  private async getUnlockedModules(priority: PrefetchPriority): Promise<ModuleMeta[]> {
    const { contentRegistry } = await import('@/lib/contentRegistry');
    const all = await contentRegistry.getModules() as ModuleMeta[];

    const lockEnabled = this.getLockEnabled();
    const progress = this.getProgressStore();

    const isUnlocked = (mod: ModuleMeta) => {
      if (!lockEnabled) return true;
      const prereqs = Array.isArray(mod.prerequisites) ? mod.prerequisites : [];
      if (prereqs.length === 0) return true;
      return prereqs.every((slug: string) => progress[slug]?.completionStatus === 'completed');
    };

    const unlocked = all.filter(isUnlocked);

    const tierOrder = ['foundational', 'core', 'specialized', 'quality'];
    if (priority === 'tier') {
      unlocked.sort((a, b) => {
        const ai = tierOrder.indexOf(a.tier);
        const bi = tierOrder.indexOf(b.tier);
        if (ai !== bi) return ai - bi;
        return (a.order ?? 0) - (b.order ?? 0);
      });
    } else {
      unlocked.sort((a, b) => a.title.localeCompare(b.title));
    }

    return unlocked;
  }

  private getLockEnabled(): boolean {
    try {
      const val = localStorage.getItem('gc.moduleLockEnabled');
      return val === 'true';
    } catch {
      return true;
    }
  }

  private getProgressStore(): Record<string, { completionStatus?: 'not_started' | 'in_progress' | 'completed' }> {
    const stores: string[] = [];
    try {
      // Prefer user-scoped progress first
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fullstack_progress_')) {
          stores.push(key);
        }
      }
      // Fallback default
      stores.push('fullstack_progress_veland');

      for (const k of stores) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw) as Record<string, { completionStatus?: 'not_started' | 'in_progress' | 'completed' }>;
          if (parsed && typeof parsed === 'object') return parsed;
        }
      }
    } catch {}
    return {};
  }

  private async processQueue() {
    while (this.prefetchQueue.length > 0) {
      const batch = this.prefetchQueue.splice(0, this.batchSize);
      const jobs = batch.map(slug => this.prefetchForModule(slug));
      // Limit concurrency
      for (let i = 0; i < jobs.length; i += this.maxConcurrent) {
        await Promise.all(jobs.slice(i, i + this.maxConcurrent));
      }
      if (this.prefetchQueue.length > 0) {
        await new Promise(r => setTimeout(r, this.delayBetweenBatches));
      }
    }
  }

  private async prefetchForModule(moduleSlug: string) {
    if (this.completed.has(moduleSlug)) return;
    try {
      const { contentRegistry } = await import('@/lib/contentRegistry');
      const shortSlug = await contentRegistry.getShortSlugFromModuleSlug(moduleSlug) || moduleSlug;

      await Promise.all([
        this.prefetchLessons(shortSlug, moduleSlug),
        this.prefetchQuiz(shortSlug, moduleSlug)
      ]);

      this.completed.add(moduleSlug);
    } catch (err) {
      console.warn(`[ModulePrefetchService] prefetch failed for ${moduleSlug}:`, err);
    }
  }

  private async prefetchLessons(shortSlug: string, moduleSlug: string) {
    const cacheKey = `lessons_prefetch_${shortSlug}`;
    if (this.isFresh(cacheKey, 30 * 60 * 1000)) return;

    try {
      const { contentRegistry } = await import('@/lib/contentRegistry');
      const lessons = await contentRegistry.getModuleLessons(moduleSlug);
      if (Array.isArray(lessons) && lessons.length > 0) {
        this.safeSetItem('localStorage', cacheKey, JSON.stringify({ timestamp: Date.now(), data: lessons }));
        this.safeSetItem('sessionStorage', `prefetch_lessons_${shortSlug}`, JSON.stringify({ timestamp: Date.now(), data: lessons }));
        console.log(`[ModulePrefetchService] Lessons cached for ${moduleSlug} (${lessons.length})`);
      }
    } catch (err) {
      console.debug(`[ModulePrefetchService] Lessons fetch fallback for ${moduleSlug}`, err);
    }
  }

  private async prefetchQuiz(shortSlug: string, moduleSlug: string) {
    const cacheKey = `quiz_prefetch_${shortSlug}`;
    if (this.isFresh(cacheKey, 30 * 60 * 1000)) return;

    try {
      const { contentRegistry } = await import('@/lib/contentRegistry');
      const quiz = await contentRegistry.getModuleQuiz(moduleSlug);
      if (quiz && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        this.safeSetItem('localStorage', cacheKey, JSON.stringify({ timestamp: Date.now(), data: quiz }));
        this.safeSetItem('sessionStorage', `prefetch_quiz_${shortSlug}`, JSON.stringify({ timestamp: Date.now(), data: quiz }));
        console.log(`[ModulePrefetchService] Quiz cached for ${moduleSlug} (${quiz.questions.length} questions)`);
      }
    } catch (err) {
      console.debug(`[ModulePrefetchService] Quiz fetch fallback for ${moduleSlug}`, err);
    }
  }

  private isFresh(cacheKey: string, ttlMs: number): boolean {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return false;
      const { timestamp } = JSON.parse(raw) as { timestamp?: number };
      return typeof timestamp === 'number' && (Date.now() - timestamp) < ttlMs;
    } catch {
      return false;
    }
  }

  private safeSetItem(storageType: 'localStorage' | 'sessionStorage', key: string, value: string) {
    try {
      if (storageType === 'localStorage') {
        localStorage.setItem(key, value);
      } else {
        sessionStorage.setItem(key, value);
      }
    } catch {
      try {
        // Fallback to sessionStorage if localStorage quota is exceeded
        sessionStorage.setItem(key, value);
      } catch {}
    }
  }
}

export const modulePrefetchService = ModulePrefetchService.getInstance();