import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function buildMinimalRegistry() {
  return {
    version: '0.0.0',
    lastUpdated: new Date().toISOString(),
    tiers: {
      foundational: {
        level: 1,
        title: 'Foundational',
        description: 'Core fundamentals and basics',
        focusArea: 'Core skills',
        color: '#4B5563',
        learningObjectives: [],
      },
      core: {
        level: 2,
        title: 'Core',
        description: 'Essential modules and competencies',
        focusArea: 'Core skills',
        color: '#2563EB',
        learningObjectives: [],
      },
      specialized: {
        level: 3,
        title: 'Specialized',
        description: 'Advanced topics and frameworks',
        focusArea: 'Advanced',
        color: '#10B981',
        learningObjectives: [],
      },
      quality: {
        level: 4,
        title: 'Quality',
        description: 'Testing, QA, and reliability',
        focusArea: 'Quality',
        color: '#F59E0B',
        learningObjectives: [],
      },
    },
    modules: [],
    globalSettings: {
      contentThresholds: {
        strictMode: false,
        developmentMode: true,
        minimumLessonsPerModule: 0,
        minimumQuestionsPerModule: 0,
        requiredSchemaCompliance: 0,
      },
      routingRules: {
        enableLegacyRedirects: true,
        generate404Fallbacks: true,
        requireContentThresholds: false,
      },
      seoSettings: {
        generateSitemap: true,
        includeLastModified: false,
        excludeContentPending: false,
      },
    },
  };
}

export async function GET() {
  try {
    const registryPath = path.join(process.cwd(), '..', '..', 'content', 'registry.json');
    
    if (!fs.existsSync(registryPath)) {
      // Return minimal registry to avoid breaking SSR/client rendering
      return NextResponse.json(buildMinimalRegistry(), {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }

    const registryContent = fs.readFileSync(registryPath, 'utf8');
    const registry = JSON.parse(registryContent);

    return NextResponse.json(registry, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Failed to load content registry:', error);
    // Return minimal registry on error to prevent 500s
    return NextResponse.json(buildMinimalRegistry(), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }
}