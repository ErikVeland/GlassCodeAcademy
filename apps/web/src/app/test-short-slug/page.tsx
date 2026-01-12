import { contentRegistry } from "@/lib/contentRegistry";

export default async function TestShortSlugPage() {
  // Test the short slug mapping
  const testSlugs = [
    "programming",
    "web",
    "dotnet",
    "react",
    "graphql",
    "nextjs",
  ];

  const results = await Promise.all(
    testSlugs.map(async (shortSlug) => {
      const moduleData = await contentRegistry.getModule(shortSlug);
      return {
        shortSlug,
        found: !!moduleData,
        moduleName: moduleData?.title || "Not found",
        fullSlug: moduleData?.slug || "N/A",
      };
    }),
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Short Slug Mapping Test</h1>
      <div className="glass-morphism p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <span className="font-medium">Short Slug:</span>{" "}
                  {result.shortSlug}
                </div>
                <div>
                  <span className="font-medium">Found:</span>{" "}
                  {result.found ? "✅" : "❌"}
                </div>
                <div>
                  <span className="font-medium">Module:</span>{" "}
                  {result.moduleName}
                </div>
                <div>
                  <span className="font-medium">Full Slug:</span>{" "}
                  {result.fullSlug}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
