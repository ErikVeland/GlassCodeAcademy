export default function EnvTestPage() {
  // This will only show server-side environment variables
  const serverEnv = {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
    NODE_ENV: process.env.NODE_ENV,
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Environment Variables Test</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Server-side Environment Variables</h2>
        <div className="space-y-2">
          <p><strong>NEXT_PUBLIC_API_BASE:</strong> {serverEnv.NEXT_PUBLIC_API_BASE || 'Not set'}</p>
          <p><strong>NODE_ENV:</strong> {serverEnv.NODE_ENV || 'Not set'}</p>
        </div>
      </div>
    </div>
  );
}