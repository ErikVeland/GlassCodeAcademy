import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract customization parameters from query string
    const colors = searchParams.get("colors");
    const speed = searchParams.get("speed");
    const blur = searchParams.get("blur");
    const opacity = searchParams.get("opacity");
    const respectReducedMotion = searchParams.get("respectReducedMotion");

    const projectRoot = process.cwd();
    const componentPath = path.join(
      projectRoot,
      "src",
      "components",
      "AnimatedBackground.tsx",
    );

    const fileExists = fs.existsSync(componentPath);
    if (!fileExists) {
      return NextResponse.json(
        { error: "Component file not found." },
        { status: 404 },
      );
    }

    let fileContent = fs.readFileSync(componentPath, "utf-8");

    // If customization parameters are provided, modify the default values
    if (colors || speed || blur || opacity || respectReducedMotion) {
      // Parse colors array if provided
      let parsedColors: string[] | undefined;
      if (colors) {
        try {
          parsedColors = JSON.parse(decodeURIComponent(colors));
        } catch {
          return NextResponse.json(
            { error: "Invalid colors format." },
            { status: 400 },
          );
        }
      }

      // Replace default values in the component
      if (parsedColors) {
        const colorsString = parsedColors
          .map((color: string) => `    '${color}'`)
          .join(",\n");
        fileContent = fileContent.replace(
          /colors = \[\s*[\s\S]*?\s*\]/,
          `colors = [\n${colorsString}\n  ]`,
        );
      }

      if (speed) {
        fileContent = fileContent.replace(/speed = \d+/, `speed = ${speed}`);
      }

      if (blur) {
        fileContent = fileContent.replace(/blur = \d+/, `blur = ${blur}`);
      }

      if (opacity) {
        fileContent = fileContent.replace(
          /opacity = [\d.]+/,
          `opacity = ${opacity}`,
        );
      }

      if (respectReducedMotion) {
        fileContent = fileContent.replace(
          /respectReducedMotion = (true|false)/,
          `respectReducedMotion = ${respectReducedMotion}`,
        );
      }
    }

    return new Response(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": 'attachment; filename="AnimatedBackground.tsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to read component file." },
      { status: 500 },
    );
  }
}
