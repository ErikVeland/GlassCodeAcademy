export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Tailwind CSS Test</h1>
        <p className="text-gray-600">If you can see this styled correctly, Tailwind is working!</p>
        <div className="mt-4 p-4 bg-red-100 rounded">
          <p className="text-red-800">This should have a red background</p>
        </div>
      </div>
    </div>
  );
}