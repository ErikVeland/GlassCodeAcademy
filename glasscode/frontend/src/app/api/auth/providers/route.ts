import { getAuthProviders } from '@/lib/authProviders';

export async function GET() {
  try {
    // Get providers from our shared configuration
    const authProviders = getAuthProviders();
    
    // Transform providers array into the expected object format
    const providersObj: Record<string, { id: string; name: string }> = {};
    
    authProviders.forEach((provider) => {
      if (provider && provider.id && provider.name) {
        providersObj[provider.id] = {
          id: provider.id,
          name: provider.name
        };
      }
    });

    return new Response(JSON.stringify(providersObj), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    return new Response(JSON.stringify({}), {
      status: 200, // Still return 200 but empty object to match original behavior
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}