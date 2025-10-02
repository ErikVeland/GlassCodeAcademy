export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5022';
  
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
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      apiUrl,
      error: error.message
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}