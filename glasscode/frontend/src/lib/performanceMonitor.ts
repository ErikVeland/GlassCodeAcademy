import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import React from 'react';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: any[];
  id: string;
  navigationType: string;
}

interface PerformanceConfig {
  enableAnalytics: boolean;
  enableConsoleLogging: boolean;
  enableRemoteReporting: boolean;
  apiEndpoint?: string;
  sampleRate: number;
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: Map<string, WebVitalsMetric> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableAnalytics: true,
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableRemoteReporting: process.env.NODE_ENV === 'production',
      sampleRate: 1,
      ...config
    };

    this.initializeWebVitals();
    this.initializeCustomMetrics();
  }

  private initializeWebVitals() {
    if (!this.config.enableAnalytics) return;

    // Core Web Vitals
    onCLS(this.handleMetric.bind(this, 'CLS'));
    onINP(this.handleMetric.bind(this, 'INP'));
    onFCP(this.handleMetric.bind(this, 'FCP'));
    onLCP(this.handleMetric.bind(this, 'LCP'));
    onTTFB(this.handleMetric.bind(this, 'TTFB'));
  }

  private initializeCustomMetrics() {
    if (typeof window === 'undefined') return;

    // Resource loading performance
    this.observeResourceTiming();
    
    // Long tasks detection
    this.observeLongTasks();
    
    // Layout shifts beyond CLS
    this.observeLayoutShifts();
    
    // First input delay variations
    this.observeFirstInput();
  }

  private handleMetric(metricName: string, metric: any) {
    const webVitalsMetric: WebVitalsMetric = {
      name: metricName,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      entries: metric.entries,
      id: metric.id,
      navigationType: metric.navigationType || 'navigate'
    };

    this.metrics.set(metricName, webVitalsMetric);

    if (this.config.enableConsoleLogging) {
      this.logMetric(webVitalsMetric);
    }

    if (this.config.enableRemoteReporting && Math.random() < this.config.sampleRate) {
      this.reportMetric(webVitalsMetric);
    }

    // Trigger custom events for UI updates
    this.dispatchMetricEvent(webVitalsMetric);
  }

  private logMetric(metric: WebVitalsMetric) {
    const color = this.getConsoleColor(metric.rating);
    console.group(`%c${metric.name}: ${metric.value.toFixed(2)}ms`, `color: ${color}; font-weight: bold`);
    console.log(`Rating: ${metric.rating}`);
    console.log(`Delta: ${metric.delta}`);
    console.log(`Navigation Type: ${metric.navigationType}`);
    if (metric.entries?.length > 0) {
      console.log('Entries:', metric.entries);
    }
    console.groupEnd();
  }

  private getConsoleColor(rating: string): string {
    switch (rating) {
      case 'good': return '#22c55e';
      case 'needs-improvement': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  }

  private async reportMetric(metric: WebVitalsMetric) {
    if (!this.config.apiEndpoint) return;

    try {
      await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now(),
          sessionId: this.getSessionId(),
        }),
      });
    } catch (error) {
      if (this.config.enableConsoleLogging) {
        console.error('Failed to report metric:', error);
      }
    }
  }

  private dispatchMetricEvent(metric: WebVitalsMetric) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('web-vitals-metric', {
        detail: metric
      }));
    }
  }

  private observeResourceTiming() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          this.analyzeResourceTiming(entry as PerformanceResourceTiming);
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  private observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          this.handleLongTask(entry);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    } catch (e) {
      // Long tasks not supported in this browser
    }
  }

  private observeLayoutShifts() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          this.handleLayoutShift(entry);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layout-shift', observer);
    } catch (e) {
      // Layout shift not supported
    }
  }

  private observeFirstInput() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          this.handleFirstInput(entry);
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('first-input', observer);
    } catch (e) {
      // First input not supported
    }
  }

  private analyzeResourceTiming(entry: PerformanceResourceTiming) {
    const loadTime = entry.responseEnd - entry.requestStart;
    
    if (loadTime > 1000) { // Slow resource (>1s)
      if (this.config.enableConsoleLogging) {
        console.warn(`Slow resource detected: ${entry.name} took ${loadTime.toFixed(2)}ms`);
      }
    }

    // Check for render-blocking resources
    if ('renderBlockingStatus' in entry && entry.renderBlockingStatus === 'blocking') {
      if (this.config.enableConsoleLogging) {
        console.warn(`Render-blocking resource: ${entry.name}`);
      }
    }
  }

  private handleLongTask(entry: PerformanceEntry) {
    const duration = entry.duration;
    if (duration > 50) { // Tasks longer than 50ms
      if (this.config.enableConsoleLogging) {
        console.warn(`Long task detected: ${duration.toFixed(2)}ms`);
      }

      // Dispatch event for potential UI indication
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('long-task-detected', {
          detail: { duration, startTime: entry.startTime }
        }));
      }
    }
  }

  private handleLayoutShift(entry: PerformanceEntry) {
    const value = (entry as any).value;
    if (value > 0.1) { // Significant layout shift
      if (this.config.enableConsoleLogging) {
        console.warn(`Significant layout shift: ${value.toFixed(4)}`);
      }
    }
  }

  private handleFirstInput(entry: PerformanceEntry) {
    const delay = (entry as any).processingStart - entry.startTime;
    if (this.config.enableConsoleLogging) {
      console.log(`First Input Delay: ${delay.toFixed(2)}ms`);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('perf-session-id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('perf-session-id', sessionId);
    }
    return sessionId;
  }

  public getMetrics(): Map<string, WebVitalsMetric> {
    return new Map(this.metrics);
  }

  public getMetric(name: string): WebVitalsMetric | undefined {
    return this.metrics.get(name);
  }

  public getAllWebVitals(): Promise<WebVitalsMetric[]> {
    return new Promise((resolve) => {
      const vitals: WebVitalsMetric[] = [];
      
      // Note: In web-vitals v3+, the get* functions were removed
      // Metrics are now collected via the on* callback functions
      // This function now returns an empty array as metrics are
      // collected through the callback-based approach
      
      // Give some time for metrics to be collected
      setTimeout(() => resolve(vitals), 1000);
    });
  }

  public generatePerformanceReport(): string {
    const metrics = this.getMetrics();
    let report = 'Performance Report\n';
    report += '==================\n\n';

    for (const [name, metric] of metrics) {
      report += `${name}:\n`;
      report += `  Value: ${metric.value.toFixed(2)}ms\n`;
      report += `  Rating: ${metric.rating}\n`;
      report += `  Delta: ${metric.delta}\n\n`;
    }

    return report;
  }

  public disconnect() {
    for (const [name, observer] of this.observers) {
      try {
        observer.disconnect();
      } catch (e) {
        console.warn(`Failed to disconnect observer: ${name}`, e);
      }
    }
    this.observers.clear();
    this.metrics.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor({
  enableAnalytics: true,
  enableConsoleLogging: process.env.NODE_ENV === 'development',
  enableRemoteReporting: process.env.NODE_ENV === 'production',
  apiEndpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
  sampleRate: parseFloat(process.env.NEXT_PUBLIC_ANALYTICS_SAMPLE_RATE || '1'),
});

// React hook for using performance metrics
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = React.useState<Map<string, WebVitalsMetric>>(new Map());

  React.useEffect(() => {
    const handleMetricUpdate = (event: CustomEvent) => {
      setMetrics(new Map(performanceMonitor.getMetrics()));
    };

    // Listen for metric updates
    window.addEventListener('web-vitals-metric', handleMetricUpdate as EventListener);

    // Initial load
    setMetrics(performanceMonitor.getMetrics());

    return () => {
      window.removeEventListener('web-vitals-metric', handleMetricUpdate as EventListener);
    };
  }, []);

  return {
    metrics,
    getMetric: (name: string) => metrics.get(name),
    getAllMetrics: () => Array.from(metrics.values()),
    getPerformanceScore: () => {
      const coreMetrics = ['CLS', 'INP', 'LCP']; // Changed FID to INP as FID is deprecated
      let total = 0;
      let count = 0;
      
      for (const name of coreMetrics) {
        const metric = metrics.get(name);
        if (!metric) continue;
        const score = metric.rating === 'good' ? 100 : metric.rating === 'needs-improvement' ? 50 : 0;
        total += score;
        count++;
      }
      
      return count > 0 ? total / count : 0;
    }
  };
}

export default PerformanceMonitor;