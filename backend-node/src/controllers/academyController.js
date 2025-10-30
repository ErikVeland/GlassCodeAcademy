const { Academy, Course, Module, Lesson } = require('../models');
const { logAction } = require('../services/auditService');
const winston = require('winston');

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'academy-controller' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

const createAcademyController = async (req, res, next) => {
  try {
    const academyData = req.body;
    
    logger.info('Creating new academy', { 
      userId: req.user.id, 
      academyName: academyData.name,
      correlationId: req.correlationId 
    });
    
    // Check if academy with this slug already exists
    const existingAcademy = await Academy.findOne({
      where: {
        slug: academyData.slug
      }
    });
    
    if (existingAcademy) {
      logger.warn('Academy with this slug already exists', { 
        userId: req.user.id, 
        slug: academyData.slug,
        correlationId: req.correlationId 
      });
      
      const errorResponse = {
        type: 'https://glasscode/errors/conflict-error',
        title: 'Conflict Error',
        status: 409,
        detail: 'An academy with this slug already exists',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(409).json(errorResponse);
    }
    
    // Create academy
    const academy = await Academy.create(academyData);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'CREATE',
      resourceType: 'ACADEMY',
      resourceId: academy.id,
      resourceName: academy.name,
      details: { ...academyData },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    logger.info('Academy created successfully', { 
      userId: req.user.id, 
      academyId: academy.id,
      academyName: academy.name,
      correlationId: req.correlationId 
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 201,
      data: academy
    };
    
    res.status(201).json(successResponse);
  } catch (error) {
    logger.error('Error creating academy', { 
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getAllAcademiesController = async (req, res, next) => {
  try {
    logger.info('Fetching all academies', { 
      userId: req.user.id,
      correlationId: req.correlationId 
    });
    
    const academies = await Academy.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    logger.info('Academies fetched successfully', { 
      userId: req.user.id,
      count: academies.length,
      correlationId: req.correlationId 
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: academies
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching academies', { 
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const getAcademyByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.info('Fetching academy by ID', { 
      userId: req.user.id,
      academyId: id,
      correlationId: req.correlationId 
    });
    
    const academy = await Academy.findByPk(id);
    
    if (!academy) {
      logger.warn('Academy not found', { 
        userId: req.user.id,
        academyId: id,
        correlationId: req.correlationId 
      });
      
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Academy not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    logger.info('Academy fetched successfully', { 
      userId: req.user.id,
      academyId: id,
      academyName: academy.name,
      correlationId: req.correlationId 
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: academy
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error fetching academy by ID', { 
      userId: req.user?.id,
      academyId: req.params?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const updateAcademyController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    logger.info('Updating academy', { 
      userId: req.user.id,
      academyId: id,
      correlationId: req.correlationId 
    });
    
    // Check if academy exists
    const academy = await Academy.findByPk(id);
    
    if (!academy) {
      logger.warn('Academy not found for update', { 
        userId: req.user.id,
        academyId: id,
        correlationId: req.correlationId 
      });
      
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Academy not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Store original data for audit logging
    const originalData = {
      name: academy.name,
      slug: academy.slug,
      description: academy.description,
      isPublished: academy.isPublished,
      version: academy.version
    };
    
    // Check if slug is being updated and if it conflicts with another academy
    if (updateData.slug && updateData.slug !== academy.slug) {
      const existingAcademy = await Academy.findOne({
        where: {
          slug: updateData.slug
        }
      });
      
      if (existingAcademy) {
        logger.warn('Academy with this slug already exists', { 
          userId: req.user.id,
          slug: updateData.slug,
          correlationId: req.correlationId 
        });
        
        const errorResponse = {
          type: 'https://glasscode/errors/conflict-error',
          title: 'Conflict Error',
          status: 409,
          detail: 'An academy with this slug already exists',
          instance: req.originalUrl,
          traceId: req.correlationId
        };
        
        return res.status(409).json(errorResponse);
      }
    }
    
    // Update academy
    await academy.update(updateData);
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'UPDATE',
      resourceType: 'ACADEMY',
      resourceId: academy.id,
      resourceName: academy.name,
      details: {
        original: originalData,
        updated: updateData
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    logger.info('Academy updated successfully', { 
      userId: req.user.id,
      academyId: id,
      academyName: academy.name,
      correlationId: req.correlationId 
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: academy
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error updating academy', { 
      userId: req.user?.id,
      academyId: req.params?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const deleteAcademyController = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.info('Deleting academy', { 
      userId: req.user.id,
      academyId: id,
      correlationId: req.correlationId 
    });
    
    // Check if academy exists
    const academy = await Academy.findByPk(id);
    
    if (!academy) {
      logger.warn('Academy not found for deletion', { 
        userId: req.user.id,
        academyId: id,
        correlationId: req.correlationId 
      });
      
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Academy not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Store data for audit logging before deletion
    const academyData = {
      name: academy.name,
      slug: academy.slug,
      description: academy.description,
      isPublished: academy.isPublished,
      version: academy.version
    };
    
    // Delete academy
    await academy.destroy();
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'DELETE',
      resourceType: 'ACADEMY',
      resourceId: academy.id,
      resourceName: academy.name,
      details: academyData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    logger.info('Academy deleted successfully', { 
      userId: req.user.id,
      academyId: id,
      academyName: academy.name,
      correlationId: req.correlationId 
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: {
        message: 'Academy deleted successfully',
        id: academy.id
      }
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error deleting academy', { 
      userId: req.user?.id,
      academyId: req.params?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

const exportAcademyController = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    logger.info('Exporting academy', { 
      userId: req.user.id,
      academyId: id,
      correlationId: req.correlationId 
    });
    
    // Check if academy exists
    const academy = await Academy.findByPk(id);
    
    if (!academy) {
      logger.warn('Academy not found for export', { 
        userId: req.user.id,
        academyId: id,
        correlationId: req.correlationId 
      });
      
      const errorResponse = {
        type: 'https://glasscode/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Academy not found',
        instance: req.originalUrl,
        traceId: req.correlationId
      };
      
      return res.status(404).json(errorResponse);
    }
    
    // Get all courses for this academy (in a real implementation, this would be based on academy-course relationships)
    // For now, we'll export all courses as part of the academy
    const courses = await Course.findAll({
      where: {
        isPublished: true
      },
      include: [{
        model: Module,
        as: 'modules',
        where: {
          isPublished: true
        },
        required: false,
        include: [{
          model: Lesson,
          as: 'lessons',
          where: {
            isPublished: true
          },
          required: false
        }]
      }],
      order: [
        ['order', 'ASC'],
        [{ model: Module, as: 'modules' }, 'order', 'ASC'],
        [{ model: Module, as: 'modules' }, { model: Lesson, as: 'lessons' }, 'order', 'ASC']
      ]
    });
    
    // Create export structure
    const exportData = {
      academy: {
        id: academy.id,
        name: academy.name,
        slug: academy.slug,
        description: academy.description,
        version: academy.version,
        theme: academy.theme,
        createdAt: academy.createdAt,
        updatedAt: academy.updatedAt
      },
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        order: course.order,
        difficulty: course.difficulty,
        estimatedHours: course.estimatedHours,
        isPublished: course.isPublished,
        version: course.version,
        modules: course.modules.map(module => ({
          id: module.id,
          title: module.title,
          slug: module.slug,
          description: module.description,
          order: module.order,
          isPublished: module.isPublished,
          version: module.version,
          lessons: module.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            order: lesson.order,
            content: lesson.content,
            metadata: lesson.metadata,
            isPublished: lesson.isPublished,
            difficulty: lesson.difficulty,
            estimatedMinutes: lesson.estimatedMinutes,
            version: lesson.version
          }))
        }))
      })),
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: {
          userId: req.user.id,
          userEmail: req.user.email
        },
        formatVersion: '1.0.0'
      }
    };
    
    // Log the action
    await logAction({
      userId: req.user.id,
      action: 'EXPORT',
      resourceType: 'ACADEMY',
      resourceId: academy.id,
      resourceName: academy.name,
      details: { exportType: 'FULL_EXPORT' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    logger.info('Academy exported successfully', { 
      userId: req.user.id,
      academyId: id,
      academyName: academy.name,
      courseCount: courses.length,
      correlationId: req.correlationId 
    });
    
    const successResponse = {
      type: 'https://glasscode/errors/success',
      title: 'Success',
      status: 200,
      data: exportData
    };
    
    res.status(200).json(successResponse);
  } catch (error) {
    logger.error('Error exporting academy', { 
      userId: req.user?.id,
      academyId: req.params?.id,
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId
    });
    // Let the error middleware handle RFC 7807 compliant error responses
    next(error);
  }
};

module.exports = {
  createAcademyController,
  getAllAcademiesController,
  getAcademyByIdController,
  updateAcademyController,
  deleteAcademyController,
  exportAcademyController
};