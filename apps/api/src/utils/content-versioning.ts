import path from 'node:path';
import { promises as fs } from 'node:fs';
import { contentBasePath } from './optimized-content';

// Interface for content version history
export interface ContentVersion {
  version: string;
  lastUpdated: string;
  changes: string[];
  author?: string;
  hash: string;
}

// Interface for versioned content item
export interface VersionedContent {
  id: string | number;
  type: 'lesson' | 'quiz' | 'module';
  slug: string;
  title: string;
  versions: ContentVersion[];
}

// Simple in-memory store for version history (in production, use a proper database)
const versionHistoryStore = new Map<string, VersionedContent>();

// Generate a simple hash for content comparison
function generateContentHash(content: any): string {
  const str = JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

// Load version history from file system
async function loadVersionHistory(): Promise<void> {
  try {
    const basePath = contentBasePath();
    const versionDir = path.join(basePath, '.versions');

    // Check if version directory exists
    try {
      await fs.access(versionDir);
    } catch {
      // Create version directory if it doesn't exist
      await fs.mkdir(versionDir, { recursive: true });
      return;
    }

    // Load existing version files
    const files = await fs.readdir(versionDir);
    const versionFiles = files.filter((f) => f.endsWith('.json'));

    for (const file of versionFiles) {
      try {
        const filePath = path.join(versionDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        const versionedContent: VersionedContent = JSON.parse(data);
        versionHistoryStore.set(versionedContent.slug, versionedContent);
      } catch (error) {
        console.warn(`Failed to load version history from ${file}:`, error);
      }
    }
  } catch (error) {
    console.warn('Failed to load version history:', error);
  }
}

// Save version history to file system
async function saveVersionHistory(slug: string): Promise<void> {
  try {
    const versionedContent = versionHistoryStore.get(slug);
    if (!versionedContent) return;

    const basePath = contentBasePath();
    const versionDir = path.join(basePath, '.versions');
    await fs.mkdir(versionDir, { recursive: true });

    const filePath = path.join(versionDir, `${slug}.json`);
    await fs.writeFile(filePath, JSON.stringify(versionedContent, null, 2));
  } catch (error) {
    console.warn(`Failed to save version history for ${slug}:`, error);
  }
}

// Initialize version history on module load
loadVersionHistory().catch(console.warn);

// Track content changes
export async function trackContentChange(
  type: 'lesson' | 'quiz' | 'module',
  slug: string,
  title: string,
  content: any,
  changes: string[],
  author?: string
): Promise<void> {
  try {
    const hash = generateContentHash(content);
    const now = new Date().toISOString();

    // Get existing versioned content or create new
    let versionedContent = versionHistoryStore.get(slug);
    if (!versionedContent) {
      versionedContent = {
        id: slug,
        type,
        slug,
        title,
        versions: [],
      };
    }

    // Check if content has actually changed
    const latestVersion =
      versionedContent.versions[versionedContent.versions.length - 1];
    if (latestVersion && latestVersion.hash === hash) {
      // Content hasn't changed, no need to create new version
      return;
    }

    // Extract version from content if available
    const contentVersion = content.version || '1.0.0';

    // Create new version entry
    const newVersion: ContentVersion = {
      version: contentVersion,
      lastUpdated: now,
      changes,
      author,
      hash,
    };

    // Add new version to history
    versionedContent.versions.push(newVersion);

    // Update store
    versionHistoryStore.set(slug, versionedContent);

    // Save to file system
    await saveVersionHistory(slug);
  } catch (error) {
    console.warn(`Failed to track content change for ${slug}:`, error);
  }
}

// Get version history for content
export function getContentVersionHistory(
  slug: string
): VersionedContent | null {
  return versionHistoryStore.get(slug) || null;
}

// Get specific version of content
export function getContentVersion(
  slug: string,
  version: string
): ContentVersion | null {
  const versionedContent = versionHistoryStore.get(slug);
  if (!versionedContent) return null;

  return versionedContent.versions.find((v) => v.version === version) || null;
}

// Compare two versions of content
export function compareContentVersions(
  slug: string,
  version1: string,
  version2: string
): { added: string[]; removed: string[]; changed: string[] } | null {
  const content1 = getContentVersion(slug, version1);
  const content2 = getContentVersion(slug, version2);

  if (!content1 || !content2) return null;

  // Simple comparison based on changes array
  const added = content2.changes.filter(
    (change) => !content1.changes.includes(change)
  );
  const removed = content1.changes.filter(
    (change) => !content2.changes.includes(change)
  );
  const changed = content2.changes.filter(
    (change) =>
      content1.changes.includes(change) &&
      content1.lastUpdated !== content2.lastUpdated
  );

  return { added, removed, changed };
}

// Get all content with version history
export function getAllVersionedContent(): VersionedContent[] {
  return Array.from(versionHistoryStore.values());
}

// Initialize version tracking for existing content
export async function initializeVersionTracking(): Promise<void> {
  console.log('Initializing content version tracking...');

  try {
    const basePath = contentBasePath();

    // Process lessons
    const lessonsDir = path.join(basePath, 'lessons');
    const lessonFiles = await fs.readdir(lessonsDir);
    const lessonJsonFiles = lessonFiles.filter((f) => f.endsWith('.json'));

    for (const file of lessonJsonFiles) {
      try {
        const filePath = path.join(lessonsDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        const lessons = JSON.parse(data);
        const slug = file.replace(/\.json$/, '');

        // Track each lesson
        if (Array.isArray(lessons)) {
          for (const lesson of lessons) {
            await trackContentChange(
              'lesson',
              `${slug}-${lesson.id}`,
              lesson.title,
              lesson,
              ['Initial version import'],
              'system'
            );
          }
        }
      } catch (error) {
        console.warn(`Failed to process lesson file ${file}:`, error);
      }
    }

    // Process quizzes
    const quizzesDir = path.join(basePath, 'quizzes');
    const quizFiles = await fs.readdir(quizzesDir);
    const quizJsonFiles = quizFiles.filter((f) => f.endsWith('.json'));

    for (const file of quizJsonFiles) {
      try {
        const filePath = path.join(quizzesDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        const quiz = JSON.parse(data);
        const slug = file.replace(/\.json$/, '');

        await trackContentChange(
          'quiz',
          slug,
          `Quiz for ${slug}`,
          quiz,
          ['Initial version import'],
          'system'
        );
      } catch (error) {
        console.warn(`Failed to process quiz file ${file}:`, error);
      }
    }

    console.log(
      `Version tracking initialized with ${versionHistoryStore.size} content items`
    );
  } catch (error) {
    console.error('Failed to initialize version tracking:', error);
  }
}
