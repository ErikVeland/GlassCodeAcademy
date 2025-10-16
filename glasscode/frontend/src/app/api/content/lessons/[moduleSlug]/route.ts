import { NextRequest, NextResponse } from 'next/server';
import { getGraphQLEndpoint } from '@/lib/urlUtils';

// Mapping of module slugs to their corresponding GraphQL query names and field structures
const MODULE_TO_GRAPHQL_QUERY: Record<string, { queryName: string; fields: string }> = {
  'programming-fundamentals': { 
    queryName: 'programmingLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'dotnet-fundamentals': { 
    queryName: 'dotNetLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'web-fundamentals': { 
    queryName: 'webLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'react-fundamentals': { 
    queryName: 'reactLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'database-systems': { 
    queryName: 'databaseLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'typescript-fundamentals': { 
    queryName: 'typescriptLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'node-fundamentals': { 
    queryName: 'nodeLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'laravel-fundamentals': { 
    queryName: 'laravelLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'nextjs-advanced': { 
    queryName: 'nextJsLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'graphql-advanced': { 
    queryName: 'graphQLLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'sass-advanced': { 
    queryName: 'sassLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'tailwind-advanced': { 
    queryName: 'tailwindLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'vue-advanced': { 
    queryName: 'vueLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'testing-fundamentals': { 
    queryName: 'testingLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'performance-optimization': { 
    queryName: 'performanceLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'security-fundamentals': { 
    queryName: 'securityLessons', 
    fields: 'id topic title description codeExample output' 
  },
  'version-control': { 
    queryName: 'versionLessons', 
    fields: 'id topic title description codeExample output' 
  }
};

// Unified GraphQL query function that works for all lesson types
async function fetchLessonsFromGraphQL(moduleSlug: string) {
  const queryConfig = MODULE_TO_GRAPHQL_QUERY[moduleSlug];
  
  if (!queryConfig) {
    console.log(`No GraphQL query mapping found for module: ${moduleSlug}`);
    return [];
  }

  const { queryName, fields } = queryConfig;
  const query = `query { ${queryName} { ${fields} } }`;

  try {
    console.log(`Fetching ${queryName} from GraphQL...`);
    const graphqlEndpoint = getGraphQLEndpoint();
    console.log(`Fetching ${moduleSlug} lessons from GraphQL:`, graphqlEndpoint);
    
    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query
      }),
    });

    if (!response.ok) {
      console.error('GraphQL request failed:', response.status, response.statusText);
      throw new Error(`GraphQL request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error('GraphQL query returned errors');
    }

    const lessons = result.data?.[queryName] || [];
    console.log(`Successfully fetched ${lessons.length} lessons for ${moduleSlug} from GraphQL`);
    
    return lessons;
  } catch (error) {
    console.error(`Error fetching ${moduleSlug} lessons from GraphQL:`, error);
    return [];
  }
}



export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moduleSlug: string }> }
) {
  try {
    const { moduleSlug } = await params;
    console.log(`Fetching lessons for module: ${moduleSlug}`);

    // Use unified GraphQL approach for all modules
    const lessons = await fetchLessonsFromGraphQL(moduleSlug);

    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error in lessons API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    );
  }
}

// Add explicit export to ensure route is handled
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';