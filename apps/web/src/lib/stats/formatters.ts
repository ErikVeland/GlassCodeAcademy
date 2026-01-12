// Formatting helpers for stats-related UI

// Properly capitalize module names with special cases
export function capitalizeModuleName(name: string): string {
  const specialCases: { [key: string]: string } = {
    dotnet: "dotNet",
    "dot net": "dotNet",
    nextjs: "nextJS",
    "next js": "nextJS",
    graphql: "graphQL",
    "graph q l": "graphQL",
    sass: "SASS",
    scss: "SASS",
  };

  const lowerName = (name || "").toLowerCase();
  for (const [key, value] of Object.entries(specialCases)) {
    if (lowerName.includes(key)) {
      return value;
    }
  }

  return (name || "")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
