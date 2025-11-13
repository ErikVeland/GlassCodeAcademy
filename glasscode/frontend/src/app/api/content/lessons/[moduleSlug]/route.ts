import { NextRequest, NextResponse } from "next/server";
import { getApiBaseStrict } from "@/lib/urlUtils";
import { contentRegistry } from "@/lib/contentRegistry";
import { debugLog } from "@/lib/httpUtils";

// Removed static registry threshold and file fallbacks to enforce database-only content

type FrontendLesson = {
  id: string;
  title: string;
  intro: string;
  topic: string;
  tags: string[];
  estimatedMinutes: number;
  objectives: string[];
  codeExample: string;
  codeExplanation: string;
  additionalNotes: string;
  difficulty: "beginner" | "intermediate" | "advanced";
};

// Database-only lesson loading function
async function fetchLessonsFromDatabase(
  moduleSlug: string,
): Promise<FrontendLesson[]> {
  try {
    const apiBase = getApiBaseStrict();
    const bases = [apiBase];

    for (const apiBase of bases) {
      try {
        // Fetch lessons for this module by slug
        const lessonsResponse = await fetch(`${apiBase}/api/modules/${moduleSlug}/lessons`, { cache: 'no-store' });
        if (!lessonsResponse.ok) {
          console.error(
            `[lessons] Failed lessons fetch for ${moduleSlug} from ${apiBase}`,
          );
          continue;
        }
        const lessonsEnvelope: unknown = await lessonsResponse.json();
        const lessonsData: unknown[] =
          lessonsEnvelope &&
          typeof lessonsEnvelope === "object" &&
          Array.isArray((lessonsEnvelope as { data?: unknown }).data)
            ? ((lessonsEnvelope as { data?: unknown[] }).data as unknown[])
            : Array.isArray(lessonsEnvelope)
              ? (lessonsEnvelope as unknown[])
              : [];
        debugLog(
          `[lessons] Loaded ${Array.isArray(lessonsData) ? lessonsData.length : 0} lessons from ${apiBase} for ${moduleSlug}`,
        );

        if (Array.isArray(lessonsData) && lessonsData.length > 0) {
          // Transform the database lessons to match the expected frontend format
          const typedLessons = lessonsData as Array<{
            id: number;
            title: string;
            content?: string;
            metadata?: string;
          }>;
          const transformed: FrontendLesson[] = typedLessons.map((lesson) => {
            // Parse content JSON if it exists
            let intro = "";
            let objectives: string[] = [];
            let codeExample = "";
            let codeExplanation = "";
            let tags: string[] = [];
            let estimatedMinutes = 10;
            let difficulty: "beginner" | "intermediate" | "advanced" =
              "beginner";
            let topic = "";

            if (lesson.content) {
              try {
                const contentObj = JSON.parse(lesson.content);
                intro = contentObj.intro || "";
                objectives = Array.isArray(contentObj.objectives)
                  ? contentObj.objectives
                  : [];
                if (contentObj.code) {
                  if (typeof contentObj.code === "string") {
                    codeExample = contentObj.code;
                  } else if (typeof contentObj.code === "object") {
                    codeExample = contentObj.code.example || "";
                    codeExplanation = contentObj.code.explanation || "";
                  }
                }
                topic = contentObj.topic || "";
              } catch (e) {
                console.error("Error parsing lesson content:", e);
              }
            }

            if (lesson.metadata) {
              try {
                const metadataObj = JSON.parse(lesson.metadata);
                tags = Array.isArray(metadataObj.tags) ? metadataObj.tags : [];
                estimatedMinutes =
                  typeof metadataObj.estimatedMinutes === "number"
                    ? metadataObj.estimatedMinutes
                    : 10;
                difficulty = (
                  metadataObj.difficulty
                    ? String(metadataObj.difficulty).toLowerCase()
                    : "beginner"
                ) as "beginner" | "intermediate" | "advanced";
              } catch (e) {
                console.error("Error parsing lesson metadata:", e);
              }
            }

            return {
              id: `${lesson.id}`,
              title: lesson.title,
              intro,
              topic,
              tags,
              estimatedMinutes,
              objectives,
              codeExample,
              codeExplanation,
              additionalNotes: "",
              difficulty,
            };
          });
          return transformed;
        }
      } catch (innerErr) {
        console.error(`[lessons] Error using ${apiBase}:`, innerErr);
        continue;
      }
    }

    // If nothing worked, return empty array
    return [];
  } catch (error) {
    console.error("Error loading lessons from database:", error);
    return [];
  }
}

// Removed file fallback implementation

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ moduleSlug: string }> },
) {
  try {
    const { moduleSlug } = await params;
    // Resolve short slugs to full module slugs using central mapping
    const resolvedSlug =
      await contentRegistry.getModuleSlugFromShortSlug(moduleSlug);
    if (!resolvedSlug) {
      console.warn(
        `[lessons] Unknown or unsupported module slug: ${moduleSlug}`,
      );
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Load lessons from DB first
    let lessons = await fetchLessonsFromDatabase(resolvedSlug);

    // If DB returns no lessons, attempt filesystem fallback
    if (!Array.isArray(lessons) || lessons.length === 0) {
      try {
        const { promises: fs } = await import("fs");
        const path = await import("path");

        const cwd = process.cwd();
        const fileCandidates = [
          // Inside frontend project public dir
          path.join(
            cwd,
            "public",
            "content",
            "lessons",
            `${resolvedSlug}.json`,
          ),
          // Top-level content directory (../../content from frontend)
          path.join(
            cwd,
            "..",
            "..",
            "content",
            "lessons",
            `${resolvedSlug}.json`,
          ),
          // Alternative relative content directory (../content)
          path.join(cwd, "..", "content", "lessons", `${resolvedSlug}.json`),
        ];

        for (const p of fileCandidates) {
          try {
            const raw = await fs.readFile(p, "utf-8");
            const parsed: unknown = JSON.parse(raw);
            const lessonsArr: Record<string, unknown>[] = Array.isArray(parsed)
              ? (parsed as Record<string, unknown>[])
              : Array.isArray((parsed as { lessons?: unknown[] })?.lessons)
                ? ((parsed as { lessons?: unknown[] }).lessons as Record<
                    string,
                    unknown
                  >[])
                : [];

            if (!Array.isArray(lessonsArr) || lessonsArr.length === 0) {
              continue;
            }

            const transformed = lessonsArr.map((l, i) => {
              const idVal =
                typeof (l as { id?: unknown }).id === "number" ||
                typeof (l as { id?: unknown }).id === "string"
                  ? String(
                      (l as { id?: number | string }).id as number | string,
                    )
                  : String(i + 1);
              const titleVal =
                typeof (l as { title?: unknown }).title === "string"
                  ? (l as { title?: string }).title!
                  : `Lesson ${i + 1}`;
              const introVal =
                typeof (l as { intro?: unknown }).intro === "string"
                  ? (l as { intro?: string }).intro!
                  : "";
              const objectivesVal = Array.isArray(
                (l as { objectives?: unknown }).objectives,
              )
                ? ((l as { objectives?: unknown[] }).objectives!.filter(
                    (o) => typeof o === "string",
                  ) as string[])
                : [];
              const topicVal =
                typeof (l as { topic?: unknown }).topic === "string"
                  ? (l as { topic?: string }).topic!
                  : "";
              const tagsVal = Array.isArray((l as { tags?: unknown }).tags)
                ? ((l as { tags?: unknown[] }).tags!.filter(
                    (t) => typeof t === "string",
                  ) as string[])
                : [];
              const estimatedMinutesVal =
                typeof (l as { estimatedMinutes?: unknown })
                  .estimatedMinutes === "number"
                  ? (l as { estimatedMinutes?: number }).estimatedMinutes!
                  : 10;
              const codeObj = (l as { code?: unknown }).code;
              let codeExample = "";
              let codeExplanation = "";
              if (typeof codeObj === "string") {
                codeExample = codeObj;
              } else if (codeObj && typeof codeObj === "object") {
                const c = codeObj as {
                  example?: unknown;
                  explanation?: unknown;
                };
                codeExample = typeof c.example === "string" ? c.example : "";
                codeExplanation =
                  typeof c.explanation === "string" ? c.explanation : "";
              } else {
                const codeExampleStr =
                  typeof (l as { codeExample?: unknown }).codeExample ===
                  "string"
                    ? (l as { codeExample?: string }).codeExample!
                    : "";
                const codeExplanationStr =
                  typeof (l as { codeExplanation?: unknown })
                    .codeExplanation === "string"
                    ? (l as { codeExplanation?: string }).codeExplanation!
                    : "";
                codeExample = codeExampleStr;
                codeExplanation = codeExplanationStr;
              }
              const difficultyRaw = (l as { difficulty?: unknown }).difficulty;
              const difficultyVal =
                typeof difficultyRaw === "string" &&
                ["beginner", "intermediate", "advanced"].includes(
                  difficultyRaw.toLowerCase(),
                )
                  ? (difficultyRaw.toLowerCase() as
                      | "beginner"
                      | "intermediate"
                      | "advanced")
                  : "beginner";

              return {
                id: idVal,
                title: titleVal,
                intro: introVal,
                topic: topicVal,
                tags: tagsVal,
                estimatedMinutes: estimatedMinutesVal,
                objectives: objectivesVal,
                codeExample,
                codeExplanation,
                additionalNotes: "",
                difficulty: difficultyVal,
              } as FrontendLesson;
            });

            lessons = transformed;
            break; // stop at first successful file
          } catch {
            // try next candidate
            continue;
          }
        }
      } catch (fallbackErr) {
        console.error("[lessons] File fallback error:", fallbackErr);
      }
    }

    // Optional debug output in non-production
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug");
    if (debug && process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        debug: true,
        inputSlug: moduleSlug,
        resolvedSlug,
        lessonsCount: Array.isArray(lessons) ? lessons.length : 0,
        source: "db",
      });
    }

    return NextResponse.json(Array.isArray(lessons) ? lessons : []);
  } catch (err) {
    console.error("[lessons] GET handler error:", err);
    // Return error without falling back to file content
    return NextResponse.json(
      { error: "Failed to load lessons from backend" },
      { status: 502 },
    );
  }
}

export const runtime = "nodejs";
export const revalidate = 60; // cache lessons for short TTL
export const dynamic = "force-static";
