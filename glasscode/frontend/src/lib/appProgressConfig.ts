// App Progress Configuration
// Defines the phases, goals, and milestones for GlassCode Academy development

export interface Goal {
  id: string;
  title: string;
  description: string;
  importance: number; // 1-10, affects weight in overall progress
  currentProgress: number; // 0-100
  category: 'infrastructure' | 'content' | 'features' | 'quality' | 'deployment';
  dependencies?: string[]; // Goal IDs that must be completed first
  milestones: Milestone[];
  previousProgress?: number; // Previous progress value for calculating increases
  lastUpdated?: string; // Date when progress was last updated
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedDate?: string;
  weight: number; // Contribution to goal progress (0-1)
}

export interface Phase {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'not-started' | 'in-progress' | 'completed';
  startDate?: string;
  targetDate?: string;
  completedDate?: string;
  goals: Goal[];
  color: string;
  icon: string;
}

export const APP_PHASES: Phase[] = [
  {
    id: 'foundation',
    title: 'Foundation & Core Infrastructure',
    description: 'Establish the fundamental architecture and core learning platform',
    order: 1,
    status: 'in-progress',
    startDate: '2025-09-01',
    targetDate: '2026-02-28',
    color: '#3B82F6', // Blue
    icon: '🏗️',
    goals: [
      {
        id: 'content-management',
        title: 'Content Management System',
        description: 'Complete content registry and lesson management',
        importance: 9,
        currentProgress: 85,
        category: 'infrastructure',
        milestones: [
          {
            id: 'content-registry',
            title: 'Content Registry Implementation',
            description: 'Dynamic content loading and module organization',
            completed: true,
            completedDate: '2025-10-01',
            weight: 0.3
          },
          {
            id: 'lesson-structure',
            title: 'Lesson Structure & Navigation',
            description: 'Standardized lesson format and navigation system',
            completed: true,
            completedDate: '2025-10-17',
            weight: 0.3
          },
          {
            id: 'quiz-system',
            title: 'Interactive Quiz System',
            description: 'Question types and scoring mechanism',
            completed: true,
            completedDate: '2025-10-15',
            weight: 0.25
          },
          {
            id: 'content-validation',
            title: 'Content Validation Scripts',
            description: 'Automated content structure and quality validation',
            completed: true,
            completedDate: '2025-10-10',
            weight: 0.15
          }
        ]
      },
      {
        id: 'core-modules',
        title: 'Core Technology Modules',
        description: 'Essential programming and web development modules',
        importance: 8,
        currentProgress: 75,
        category: 'content',
        milestones: [
          {
            id: 'web-fundamentals',
            title: 'Web Fundamentals Module',
            description: 'HTML, CSS, JavaScript basics',
            completed: true,
            completedDate: '2025-09-20',
            weight: 0.2
          },
          {
            id: 'react-module',
            title: 'React Development Module',
            description: 'Complete React learning path',
            completed: true,
            completedDate: '2025-10-05',
            weight: 0.25
          },
          {
            id: 'node-module',
            title: 'Node.js Backend Module',
            description: 'Server-side JavaScript development',
            completed: true,
            completedDate: '2025-09-25',
            weight: 0.2
          },
          {
            id: 'database-module',
            title: 'Database Design Module',
            description: 'SQL and database optimization',
            completed: true,
            completedDate: '2025-10-08',
            weight: 0.2
          },
          {
            id: 'laravel-module',
            title: 'Laravel PHP Module',
            description: 'PHP framework development',
            completed: false,
            weight: 0.15
          }
        ]
      },
      {
        id: 'ui-framework',
        title: 'Design System & UI Framework',
        description: 'Glassmorphism design system and responsive components',
        importance: 7,
        currentProgress: 90,
        category: 'infrastructure',
        milestones: [
          {
            id: 'design-system',
            title: 'Glassmorphism Design System',
            description: 'Consistent visual language and components',
            completed: true,
            completedDate: '2025-09-15',
            weight: 0.4
          },
          {
            id: 'responsive-layout',
            title: 'Responsive Layout System',
            description: 'Mobile-first responsive design',
            completed: true,
            completedDate: '2025-09-18',
            weight: 0.3
          },
          {
            id: 'accessibility',
            title: 'Accessibility Implementation',
            description: 'WCAG compliance and screen reader support',
            completed: true,
            completedDate: '2025-10-12',
            weight: 0.3
          }
        ]
      }
    ]
  },
  {
    id: 'enhancement',
    title: 'Feature Enhancement & User Experience',
    description: 'Advanced features, personalization, and user engagement',
    order: 2,
    status: 'in-progress',
    startDate: '2025-12-01',
    targetDate: '2026-04-30',
    color: '#10B981', // Green
    icon: '🚀',
    goals: [
      {
        id: 'progress-tracking',
        title: 'Progress Tracking System',
        description: 'User progress, achievements, and learning analytics',
        importance: 8,
        currentProgress: 60,
        category: 'features',
        milestones: [
          {
            id: 'basic-progress',
            title: 'Basic Progress Tracking',
            description: 'Lesson completion and module progress',
            completed: true,
            completedDate: '2025-10-14',
            weight: 0.3
          },
          {
            id: 'achievements',
            title: 'Achievement System',
            description: 'Badges, streaks, and gamification',
            completed: true,
            completedDate: '2025-10-16',
            weight: 0.25
          },
          {
            id: 'analytics-dashboard',
            title: 'Analytics Dashboard',
            description: 'Learning insights and statistics',
            completed: false,
            weight: 0.25
          },
          {
            id: 'personalization',
            title: 'Personalized Learning Paths',
            description: 'Adaptive content recommendations',
            completed: false,
            weight: 0.2
          }
        ]
      },
      {
        id: 'advanced-modules',
        title: 'Advanced Technology Modules',
        description: 'Specialized frameworks and advanced concepts',
        importance: 7,
        currentProgress: 45,
        category: 'content',
        milestones: [
          {
            id: 'typescript-module',
            title: 'TypeScript Module',
            description: 'Type-safe JavaScript development',
            completed: true,
            completedDate: '2025-10-03',
            weight: 0.2
          },
          {
            id: 'nextjs-module',
            title: 'Next.js Framework Module',
            description: 'Full-stack React framework',
            completed: false,
            weight: 0.2
          },
          {
            id: 'graphql-module',
            title: 'GraphQL API Module',
            description: 'Modern API development',
            completed: false,
            weight: 0.2
          },
          {
            id: 'vue-module',
            title: 'Vue.js Framework Module',
            description: 'Progressive JavaScript framework',
            completed: false,
            weight: 0.2
          },
          {
            id: 'tailwind-module',
            title: 'Tailwind CSS Module',
            description: 'Utility-first CSS framework',
            completed: true,
            completedDate: '2025-10-11',
            weight: 0.2
          }
        ]
      },
      {
        id: 'interactive-features',
        title: 'Interactive Learning Features',
        description: 'Code playground, live examples, and interactive exercises',
        importance: 6,
        currentProgress: 65,
        category: 'features',
        milestones: [
          {
            id: 'graphql-playground',
            title: 'GraphQL Playground',
            description: 'Interactive GraphQL query interface',
            completed: true,
            completedDate: '2025-09-05',
            weight: 0.2
          },
          {
            id: 'animated-background',
            title: 'Animated Background Playground',
            description: 'Interactive playground with real-time controls, Photoshop-style color editor, live preview, and liquid glass design',
            completed: true,
            completedDate: '2025-01-27',
            weight: 0.15
          },
          {
            id: 'code-playground',
            title: 'Code Playground',
            description: 'In-browser code execution environment',
            completed: false,
            weight: 0.25
          },
          {
            id: 'live-examples',
            title: 'Live Code Examples',
            description: 'Interactive code demonstrations',
            completed: false,
            weight: 0.2
          },
          {
            id: 'collaborative-features',
            title: 'Collaborative Learning',
            description: 'Study groups and peer learning',
            completed: false,
            weight: 0.2
          }
        ]
      }
    ]
  },
  {
    id: 'quality',
    title: 'Quality Assurance & Performance',
    description: 'Testing, optimization, and production readiness',
    order: 3,
    status: 'in-progress',
    startDate: '2026-02-01',
    targetDate: '2026-06-30',
    color: '#F59E0B', // Orange
    icon: '🔧',
    goals: [
      {
        id: 'testing-framework',
        title: 'Comprehensive Testing Suite',
        description: 'Unit, integration, and end-to-end testing',
        importance: 9,
        currentProgress: 65,
        previousProgress: 35, // Previous progress before recent backend testing updates
        lastUpdated: '2025-01-27',
        category: 'quality',
        milestones: [
          {
            id: 'unit-tests',
            title: 'Backend Unit Test Coverage',
            description: '57 passing tests for controllers and services',
            completed: true,
            completedDate: '2025-01-27',
            weight: 0.3
          },
          {
            id: 'integration-tests',
            title: 'Backend Integration Testing',
            description: 'API endpoint and service integration tests',
            completed: true,
            completedDate: '2025-01-27',
            weight: 0.3
          },
          {
            id: 'e2e-tests',
            title: 'End-to-End Testing',
            description: 'User journey and workflow testing',
            completed: false,
            weight: 0.25
          },
          {
            id: 'performance-tests',
            title: 'Performance Testing',
            description: 'Load testing and performance benchmarks',
            completed: false,
            weight: 0.15
          }
        ]
      },
      {
        id: 'performance-optimization',
        title: 'Performance Optimization',
        description: 'Speed, efficiency, and resource optimization',
        importance: 8,
        currentProgress: 55,
        category: 'quality',
        milestones: [
          {
            id: 'bundle-optimization',
            title: 'Bundle Size Optimization',
            description: 'Code splitting and lazy loading',
            completed: true,
            completedDate: '2025-10-09',
            weight: 0.25
          },
          {
            id: 'image-optimization',
            title: 'Image & Asset Optimization',
            description: 'Compressed images and efficient loading',
            completed: false,
            weight: 0.2
          },
          {
            id: 'caching-strategy',
            title: 'Caching Implementation',
            description: 'Browser and server-side caching',
            completed: false,
            weight: 0.25
          },
          {
            id: 'core-web-vitals',
            title: 'Core Web Vitals Optimization',
            description: 'LCP, FID, and CLS optimization',
            completed: false,
            weight: 0.3
          }
        ]
      },
      {
        id: 'security-hardening',
        title: 'Security & Compliance',
        description: 'Security measures and data protection',
        importance: 9,
        currentProgress: 25,
        category: 'quality',
        milestones: [
          {
            id: 'authentication',
            title: 'User Authentication System',
            description: 'Secure login and session management',
            completed: false,
            weight: 0.3
          },
          {
            id: 'data-protection',
            title: 'Data Protection & Privacy',
            description: 'GDPR compliance and data encryption',
            completed: false,
            weight: 0.25
          },
          {
            id: 'security-headers',
            title: 'Security Headers & CSP',
            description: 'Content Security Policy and security headers',
            completed: false,
            weight: 0.2
          },
          {
            id: 'vulnerability-scanning',
            title: 'Vulnerability Assessment',
            description: 'Regular security audits and dependency scanning',
            completed: false,
            weight: 0.25
          }
        ]
      }
    ]
  },
  {
    id: 'deployment',
    title: 'Production Deployment & Scaling',
    description: 'DevOps, monitoring, and production infrastructure',
    order: 4,
    status: 'not-started',
    startDate: '2026-05-01',
    targetDate: '2026-08-31',
    color: '#8B5CF6', // Purple
    icon: '🌐',
    goals: [
      {
        id: 'ci-cd-pipeline',
        title: 'CI/CD Pipeline',
        description: 'Automated testing, building, and deployment',
        importance: 8,
        currentProgress: 15,
        category: 'deployment',
        milestones: [
          {
            id: 'github-actions',
            title: 'GitHub Actions Setup',
            description: 'Automated workflows for testing and deployment',
            completed: false,
            weight: 0.3
          },
          {
            id: 'staging-environment',
            title: 'Staging Environment',
            description: 'Pre-production testing environment',
            completed: false,
            weight: 0.25
          },
          {
            id: 'production-deployment',
            title: 'Production Deployment',
            description: 'Live production environment setup',
            completed: false,
            weight: 0.3
          },
          {
            id: 'rollback-strategy',
            title: 'Rollback & Recovery',
            description: 'Deployment rollback and disaster recovery',
            completed: false,
            weight: 0.15
          }
        ]
      },
      {
        id: 'monitoring-analytics',
        title: 'Monitoring & Analytics',
        description: 'Application monitoring and user analytics',
        importance: 7,
        currentProgress: 10,
        category: 'deployment',
        milestones: [
          {
            id: 'error-tracking',
            title: 'Error Tracking & Logging',
            description: 'Comprehensive error monitoring and logging',
            completed: false,
            weight: 0.3
          },
          {
            id: 'performance-monitoring',
            title: 'Performance Monitoring',
            description: 'Real-time performance metrics and alerts',
            completed: false,
            weight: 0.25
          },
          {
            id: 'user-analytics',
            title: 'User Analytics',
            description: 'Learning behavior and engagement analytics',
            completed: false,
            weight: 0.25
          },
          {
            id: 'uptime-monitoring',
            title: 'Uptime & Health Checks',
            description: 'Service availability and health monitoring',
            completed: false,
            weight: 0.2
          }
        ]
      },
      {
        id: 'scalability',
        title: 'Scalability & Infrastructure',
        description: 'Horizontal scaling and infrastructure optimization',
        importance: 6,
        currentProgress: 5,
        category: 'deployment',
        milestones: [
          {
            id: 'cdn-setup',
            title: 'CDN Implementation',
            description: 'Global content delivery network',
            completed: false,
            weight: 0.25
          },
          {
            id: 'database-scaling',
            title: 'Database Scaling',
            description: 'Database optimization and scaling strategies',
            completed: false,
            weight: 0.3
          },
          {
            id: 'load-balancing',
            title: 'Load Balancing',
            description: 'Traffic distribution and server scaling',
            completed: false,
            weight: 0.25
          },
          {
            id: 'backup-strategy',
            title: 'Backup & Recovery',
            description: 'Data backup and disaster recovery plans',
            completed: false,
            weight: 0.2
          }
        ]
      }
    ]
  }
];

// Calculate overall app progress
export function calculateOverallProgress(): number {
  let totalWeight = 0;
  let weightedProgress = 0;

  APP_PHASES.forEach(phase => {
    phase.goals.forEach(goal => {
      const goalWeight = goal.importance / 10; // Normalize importance to 0-1
      totalWeight += goalWeight;
      weightedProgress += (goal.currentProgress / 100) * goalWeight;
    });
  });

  return totalWeight > 0 ? Math.round((weightedProgress / totalWeight) * 100) : 0;
}

// Calculate phase progress
export function calculatePhaseProgress(phaseId: string): number {
  const phase = APP_PHASES.find(p => p.id === phaseId);
  if (!phase) return 0;

  let totalWeight = 0;
  let weightedProgress = 0;

  phase.goals.forEach(goal => {
    const goalWeight = goal.importance / 10;
    totalWeight += goalWeight;
    weightedProgress += (goal.currentProgress / 100) * goalWeight;
  });

  return totalWeight > 0 ? Math.round((weightedProgress / totalWeight) * 100) : 0;
}

// Calculate goal progress from milestones
export function calculateGoalProgress(goal: Goal): number {
  const totalWeight = goal.milestones.reduce((sum, milestone) => sum + milestone.weight, 0);
  const completedWeight = goal.milestones
    .filter(milestone => milestone.completed)
    .reduce((sum, milestone) => sum + milestone.weight, 0);

  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}

// Get production readiness percentage
export function getProductionReadiness(): number {
  return calculateOverallProgress();
}

// Get next milestone
export function getNextMilestone(): { phase: string; goal: string; milestone: string } | null {
  for (const phase of APP_PHASES) {
    for (const goal of phase.goals) {
      const nextMilestone = goal.milestones.find(m => !m.completed);
      if (nextMilestone) {
        return {
          phase: phase.title,
          goal: goal.title,
          milestone: nextMilestone.title
        };
      }
    }
  }
  return null;
}

// Calculate progress increase for a goal
export function getProgressIncrease(goal: Goal): number {
  if (!goal.previousProgress) return 0;
  return Math.max(0, goal.currentProgress - goal.previousProgress);
}

// Check if a goal was recently updated (within last 7 days)
export function isRecentlyUpdated(goal: Goal): boolean {
  if (!goal.lastUpdated) return false;
  
  const lastUpdated = new Date(goal.lastUpdated);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysDiff <= 7;
}

// Get all goals with recent progress increases
export function getRecentProgressIncreases(): Array<Goal & { progressIncrease: number }> {
  return APP_PHASES
    .flatMap(phase => phase.goals)
    .filter(goal => isRecentlyUpdated(goal) && getProgressIncrease(goal) > 0)
    .map(goal => ({
      ...goal,
      progressIncrease: getProgressIncrease(goal)
    }));
}