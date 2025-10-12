export async function GET(): Promise<Response> {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';
  
  try {
    const response = await fetch(`${apiUrl}/api/health`);
    const data = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      apiUrl,
      health: data
    }), {
      headers: {
        'Content-Type': 'application/json'
        }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({
      success: false,
      apiUrl,
      error: message
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}