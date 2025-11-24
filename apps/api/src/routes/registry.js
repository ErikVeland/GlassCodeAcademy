import contentService from '../services/contentService.js';

export async function registerRegistryRoutes(app) {
  app.get('/api/registry/modules', async () => {
    try {
      const courses = await contentService.getAllCourses();
      // Transform courses to match the expected module structure
      const modules = [];
      for (const course of courses) {
        for (const module of course.modules) {
          modules.push({
            id: module.id,
            slug: module.slug,
            title: module.title,
            description: module.description,
            courseId: course.id,
            courseSlug: course.slug,
            order: module.order,
            isPublished: module.isPublished,
            difficulty: module.difficulty,
            estimatedHours: module.estimatedHours,
            category: module.category,
            technologies: module.technologies,
            prerequisites: module.prerequisites,
            version: module.version,
            createdAt: module.createdAt,
            updatedAt: module.updatedAt,
          });
        }
      }
      return { modules };
    } catch (error) {
      throw new Error(`Failed to fetch registry: ${error.message}`);
    }
  });
}
