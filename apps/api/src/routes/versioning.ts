import { FastifyInstance } from 'fastify';
import {
  getContentVersionHistory,
  getContentVersion,
  compareContentVersions,
  getAllVersionedContent,
  initializeVersionTracking,
} from '../utils/content-versioning';
import { getAllModules } from '../utils/optimized-content';
import { z } from 'zod';
import { ModuleSlugSchema, VersionSchema, VersionComparisonSchema } from '../utils/validation';

export async function registerVersioningRoutes(app: FastifyInstance) {
  // Get version history for a specific content item
  app.get('/api/versioning/:slug/history', async (request, reply) => {
    const { slug } = request.params as { slug: string };

    try {
      // Validate the slug parameter
      ModuleSlugSchema.parse(slug);
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid module slug format' };
    }

    try {
      const history = getContentVersionHistory(slug);
      if (!history) {
        reply.code(404);
        return { error: 'Content not found or no version history available' };
      }

      return history;
    } catch (_error) {
      reply.code(500);
      return { error: 'Internal server error retrieving version history' };
    }
  });

  // Get specific version of content
  app.get('/api/versioning/:slug/version/:version', async (request, reply) => {
    const { slug, version } = request.params as {
      slug: string;
      version: string;
    };

    try {
      // Validate the parameters
      ModuleSlugSchema.parse(slug);
      VersionSchema.parse(version);
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid parameters format' };
    }

    try {
      const contentVersion = getContentVersion(slug, version);
      if (!contentVersion) {
        reply.code(404);
        return { error: 'Version not found' };
      }

      return contentVersion;
    } catch (_error) {
      reply.code(500);
      return { error: 'Internal server error retrieving content version' };
    }
  });

  // Compare two versions of content
  app.get('/api/versioning/:slug/compare', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const { version1, version2 } = request.query as {
      version1?: string;
      version2?: string;
    };

    try {
      // Validate the slug parameter
      ModuleSlugSchema.parse(slug);
      
      // Validate the query parameters
      VersionComparisonSchema.parse({ version1, version2 });
    } catch (error) {
      reply.code(400);
      return { error: 'Invalid parameters format' };
    }

    try {
      const comparison = compareContentVersions(slug, version1!, version2!);
      if (!comparison) {
        reply.code(404);
        return { error: 'Content or versions not found' };
      }

      return {
        slug,
        version1,
        version2,
        comparison,
      };
    } catch (_error) {
      reply.code(500);
      return { error: 'Internal server error comparing versions' };
    }
  });

  // Get all content with version history
  app.get('/api/versioning/all', async (request, reply) => {
    try {
      const allContent = getAllVersionedContent();
      return {
        total: allContent.length,
        content: allContent,
      };
    } catch (_error) {
      reply.code(500);
      return {
        error: 'Internal server error retrieving all versioned content',
      };
    }
  });

  // Initialize version tracking for existing content
  app.post('/api/versioning/initialize', async (request, reply) => {
    try {
      // Check for admin authorization (in a real implementation, you'd check actual permissions)
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.code(401);
        return { error: 'Unauthorized: Admin access required' };
      }

      await initializeVersionTracking();
      return { success: true, message: 'Version tracking initialized' };
    } catch (_error) {
      reply.code(500);
      return { error: 'Internal server error initializing version tracking' };
    }
  });

  // Get version summary for all modules
  app.get('/api/versioning/summary', async (request, reply) => {
    try {
      const modules = await getAllModules();
      const versionedContent = getAllVersionedContent();

      const summary = modules.map((module) => {
        const contentHistory = versionedContent.find((c) =>
          c.slug.startsWith(module.slug)
        );
        return {
          slug: module.slug,
          title: module.title,
          versionCount: contentHistory ? contentHistory.versions.length : 0,
          latestVersion: contentHistory
            ? contentHistory.versions[contentHistory.versions.length - 1]
                ?.version
            : 'N/A',
          lastUpdated: contentHistory
            ? contentHistory.versions[contentHistory.versions.length - 1]
                ?.lastUpdated
            : 'N/A',
        };
      });

      return {
        totalModules: modules.length,
        modules: summary,
      };
    } catch (_error) {
      reply.code(500);
      return { error: 'Internal server error retrieving version summary' };
    }
  });
}
