/**
 * Validation Service
 * 
 * Manages content quality validation for all content types.
 * Provides rule creation, content validation, auto-fixing, and quality reports.
 * Supports both academy-specific and global validation rules.
 * 
 * @module services/validationService
 */

const { Op } = require('sequelize');
const ValidationRule = require('../models/validationRuleModel');
const ValidationResult = require('../models/validationResultModel');
const Academy = require('../models/academyModel');
const Course = require('../models/courseModel');
const Module = require('../models/moduleModel');
const Lesson = require('../models/lessonModel');
const Quiz = require('../models/quizModel');

/**
 * Validation Service
 * Singleton service for managing content validation
 */
class ValidationService {
  /**
   * Get the Sequelize model for a content type
   * 
   * @param {string} contentType - Type of content
   * @returns {Object} Sequelize model
   * @throws {Error} If content type is invalid
   */
  getContentModel(contentType) {
    const models = {
      course: Course,
      module: Module,
      lesson: Lesson,
      quiz: Quiz,
    };

    const model = models[contentType.toLowerCase()];
    if (!model) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    return model;
  }

  /**
   * Create a new validation rule
   * 
   * @param {Object} ruleData - Rule configuration
   * @param {number} ruleData.academyId - Academy ID (null for global rules)
   * @param {string} ruleData.ruleName - Name of the rule
   * @param {string} ruleData.contentType - Type of content this rule applies to
   * @param {Object} ruleData.ruleDefinition - Rule specification
   * @param {string} ruleData.severity - Severity level (error, warning, info)
   * @param {boolean} ruleData.autoFixAvailable - Whether auto-fix is available
   * @param {boolean} ruleData.isActive - Whether rule is active
   * @returns {Promise<Object>} Created rule
   */
  async createRule(ruleData) {
    const {
      academyId = null,
      ruleName,
      contentType,
      ruleDefinition,
      severity = 'warning',
      autoFixAvailable = false,
      isActive = true,
    } = ruleData;

    // Validate rule definition
    this.validateRuleDefinition(ruleDefinition);

    // Verify academy exists if specified
    if (academyId) {
      const academy = await Academy.findByPk(academyId);
      if (!academy) {
        throw new Error(`Academy ${academyId} not found`);
      }
    }

    const rule = await ValidationRule.create({
      academyId,
      ruleName,
      contentType: contentType.toLowerCase(),
      ruleDefinition,
      severity,
      autoFixAvailable,
      isActive,
    });

    return await this.getRuleById(rule.id);
  }

  /**
   * Get validation rule by ID
   * 
   * @param {number} ruleId - ID of the rule
   * @returns {Promise<Object|null>} Rule with associations
   */
  async getRuleById(ruleId) {
    return await ValidationRule.findByPk(ruleId, {
      include: [
        { model: Academy, as: 'academy', attributes: ['id', 'name'] },
      ],
    });
  }

  /**
   * Get all validation rules
   * 
   * @param {Object} options - Query options
   * @param {number} options.academyId - Filter by academy (includes global rules)
   * @param {string} options.contentType - Filter by content type
   * @param {boolean} options.activeOnly - Return only active rules
   * @param {string} options.severity - Filter by severity
   * @returns {Promise<Array>} List of rules
   */
  async getRules(options = {}) {
    const { academyId, contentType, activeOnly = true, severity } = options;

    const where = {};

    if (activeOnly) {
      where.isActive = true;
    }

    if (contentType) {
      where.contentType = contentType.toLowerCase();
    }

    if (severity) {
      where.severity = severity;
    }

    // Include both academy-specific and global rules
    if (academyId !== undefined) {
      where[Op.or] = [{ academyId }, { academyId: null }];
    }

    return await ValidationRule.findAll({
      where,
      include: [
        { model: Academy, as: 'academy', attributes: ['id', 'name'] },
      ],
      order: [
        ['severity', 'ASC'], // Errors first
        ['rule_name', 'ASC'],
      ],
    });
  }

  /**
   * Update validation rule
   * 
   * @param {number} ruleId - ID of the rule
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated rule
   */
  async updateRule(ruleId, updates) {
    const rule = await ValidationRule.findByPk(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    // Validate rule definition if being updated
    if (updates.ruleDefinition) {
      this.validateRuleDefinition(updates.ruleDefinition);
    }

    await rule.update(updates);
    return await this.getRuleById(ruleId);
  }

  /**
   * Delete validation rule
   * 
   * @param {number} ruleId - ID of the rule
   * @returns {Promise<boolean>} Success status
   */
  async deleteRule(ruleId) {
    const rule = await ValidationRule.findByPk(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    await rule.destroy();
    return true;
  }

  /**
   * Validate content against all applicable rules
   * 
   * @param {string} contentType - Type of content
   * @param {number} contentId - ID of the content
   * @param {number} academyId - Academy ID (for rule filtering)
   * @param {Object} options - Validation options
   * @param {boolean} options.autoFix - Automatically fix issues when possible
   * @param {Array<string>} options.severities - Filter rules by severity
   * @returns {Promise<Object>} Validation results
   */
  async validateContent(contentType, contentId, academyId, options = {}) {
    const { autoFix = false, severities } = options;

    // Get the content
    const ContentModel = this.getContentModel(contentType);
    const content = await ContentModel.findByPk(contentId);

    if (!content) {
      throw new Error(`${contentType} with ID ${contentId} not found`);
    }

    // Get applicable rules
    const rules = await this.getRules({
      academyId,
      contentType,
      activeOnly: true,
      ...(severities ? { severity: { [Op.in]: severities } } : {}),
    });

    if (rules.length === 0) {
      return {
        contentType,
        contentId,
        totalRules: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        results: [],
      };
    }

    const results = [];
    let passedCount = 0;
    let failedCount = 0;
    let warningCount = 0;
    let autoFixedCount = 0;

    const transaction = await ValidationResult.sequelize.transaction();

    try {
      // Run each rule against the content
      for (const rule of rules) {
        const result = await this.executeRule(rule, content, { autoFix });

        // Store validation result
        const validationResult = await ValidationResult.create(
          {
            contentType: contentType.toLowerCase(),
            contentId,
            ruleId: rule.id,
            status: result.status,
            details: result.details,
            autoFixed: result.autoFixed || false,
            validatedAt: new Date(),
          },
          { transaction }
        );

        results.push({
          ruleId: rule.id,
          ruleName: rule.ruleName,
          severity: rule.severity,
          status: result.status,
          details: result.details,
          autoFixed: result.autoFixed,
        });

        // Update counts
        if (result.status === 'passed') {
          passedCount++;
        } else if (result.status === 'failed') {
          failedCount++;
        } else if (result.status === 'warning') {
          warningCount++;
        }

        if (result.autoFixed) {
          autoFixedCount++;
        }
      }

      await transaction.commit();

      return {
        contentType,
        contentId,
        totalRules: rules.length,
        passed: passedCount,
        failed: failedCount,
        warnings: warningCount,
        autoFixed: autoFixedCount,
        results,
        overallStatus: failedCount > 0 ? 'failed' : warningCount > 0 ? 'warning' : 'passed',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Execute a validation rule against content
   * 
   * @param {Object} rule - Validation rule
   * @param {Object} content - Content to validate
   * @param {Object} options - Execution options
   * @param {boolean} options.autoFix - Auto-fix if possible
   * @returns {Promise<Object>} Execution result
   * @private
   */
  async executeRule(rule, content, options = {}) {
    const { autoFix = false } = options;
    const { ruleDefinition, severity } = rule;

    try {
      // Execute rule based on type
      switch (ruleDefinition.type) {
        case 'required_field':
          return this.checkRequiredField(content, ruleDefinition, { autoFix });

        case 'min_length':
          return this.checkMinLength(content, ruleDefinition, { autoFix });

        case 'max_length':
          return this.checkMaxLength(content, ruleDefinition, { autoFix });

        case 'format':
          return this.checkFormat(content, ruleDefinition, { autoFix });

        case 'custom':
          return this.executeCustomRule(content, ruleDefinition, { autoFix });

        default:
          return {
            status: 'warning',
            details: { message: `Unknown rule type: ${ruleDefinition.type}` },
            autoFixed: false,
          };
      }
    } catch (error) {
      return {
        status: severity === 'error' ? 'failed' : 'warning',
        details: {
          message: 'Error executing validation rule',
          error: error.message,
        },
        autoFixed: false,
      };
    }
  }

  /**
   * Check if required field is present
   * 
   * @param {Object} content - Content object
   * @param {Object} ruleDefinition - Rule definition
   * @param {Object} options - Options
   * @returns {Object} Validation result
   * @private
   */
  checkRequiredField(content, ruleDefinition, options = {}) {
    const { field } = ruleDefinition;
    const value = content[field];

    if (value === null || value === undefined || value === '') {
      return {
        status: 'failed',
        details: {
          message: `Required field '${field}' is missing or empty`,
          field,
        },
        autoFixed: false,
      };
    }

    return {
      status: 'passed',
      details: { message: `Field '${field}' is present` },
      autoFixed: false,
    };
  }

  /**
   * Check minimum length requirement
   * 
   * @param {Object} content - Content object
   * @param {Object} ruleDefinition - Rule definition
   * @param {Object} options - Options
   * @returns {Object} Validation result
   * @private
   */
  checkMinLength(content, ruleDefinition, options = {}) {
    const { field, minLength } = ruleDefinition;
    const value = content[field];

    if (!value || value.length < minLength) {
      return {
        status: 'failed',
        details: {
          message: `Field '${field}' must be at least ${minLength} characters (current: ${
            value ? value.length : 0
          })`,
          field,
          minLength,
          actualLength: value ? value.length : 0,
        },
        autoFixed: false,
      };
    }

    return {
      status: 'passed',
      details: { message: `Field '${field}' meets minimum length requirement` },
      autoFixed: false,
    };
  }

  /**
   * Check maximum length requirement
   * 
   * @param {Object} content - Content object
   * @param {Object} ruleDefinition - Rule definition
   * @param {Object} options - Options
   * @returns {Object} Validation result
   * @private
   */
  checkMaxLength(content, ruleDefinition, options = {}) {
    const { field, maxLength } = ruleDefinition;
    const value = content[field];

    if (value && value.length > maxLength) {
      return {
        status: 'failed',
        details: {
          message: `Field '${field}' exceeds maximum length of ${maxLength} characters (current: ${value.length})`,
          field,
          maxLength,
          actualLength: value.length,
        },
        autoFixed: false,
      };
    }

    return {
      status: 'passed',
      details: { message: `Field '${field}' meets maximum length requirement` },
      autoFixed: false,
    };
  }

  /**
   * Check format requirement (regex)
   * 
   * @param {Object} content - Content object
   * @param {Object} ruleDefinition - Rule definition
   * @param {Object} options - Options
   * @returns {Object} Validation result
   * @private
   */
  checkFormat(content, ruleDefinition, options = {}) {
    const { field, pattern, patternDescription } = ruleDefinition;
    const value = content[field];

    if (!value) {
      return {
        status: 'warning',
        details: { message: `Field '${field}' is empty, cannot check format` },
        autoFixed: false,
      };
    }

    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      return {
        status: 'failed',
        details: {
          message: `Field '${field}' does not match required format${
            patternDescription ? ': ' + patternDescription : ''
          }`,
          field,
          pattern,
        },
        autoFixed: false,
      };
    }

    return {
      status: 'passed',
      details: { message: `Field '${field}' matches required format` },
      autoFixed: false,
    };
  }

  /**
   * Execute custom validation rule
   * 
   * @param {Object} content - Content object
   * @param {Object} ruleDefinition - Rule definition
   * @param {Object} options - Options
   * @returns {Object} Validation result
   * @private
   */
  executeCustomRule(content, ruleDefinition, options = {}) {
    // Custom rules require external implementation
    // This is a placeholder for future extension
    return {
      status: 'warning',
      details: {
        message: 'Custom rule execution not yet implemented',
        ruleDefinition,
      },
      autoFixed: false,
    };
  }

  /**
   * Get validation history for content
   * 
   * @param {string} contentType - Type of content
   * @param {number} contentId - ID of the content
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum results
   * @param {Date} options.since - Get results since this date
   * @returns {Promise<Array>} Validation results
   */
  async getValidationHistory(contentType, contentId, options = {}) {
    const { limit = 50, since } = options;

    const where = {
      contentType: contentType.toLowerCase(),
      contentId,
    };

    if (since) {
      where.validatedAt = { [Op.gte]: since };
    }

    return await ValidationResult.findAll({
      where,
      include: [
        { model: ValidationRule, as: 'rule', attributes: ['id', 'ruleName', 'severity'] },
      ],
      order: [['validated_at', 'DESC']],
      limit,
    });
  }

  /**
   * Get validation summary for academy
   * 
   * @param {number} academyId - ID of the academy
   * @param {Object} options - Query options
   * @param {string} options.contentType - Filter by content type
   * @param {Date} options.startDate - Start date
   * @param {Date} options.endDate - End date
   * @returns {Promise<Object>} Validation summary
   */
  async getAcademyValidationSummary(academyId, options = {}) {
    const { contentType, startDate, endDate } = options;

    // Get all validation results for the academy
    const rules = await this.getRules({ academyId, contentType });
    const ruleIds = rules.map((r) => r.id);

    const where = {
      ruleId: { [Op.in]: ruleIds },
    };

    if (contentType) {
      where.contentType = contentType.toLowerCase();
    }

    if (startDate || endDate) {
      where.validatedAt = {};
      if (startDate) where.validatedAt[Op.gte] = startDate;
      if (endDate) where.validatedAt[Op.lte] = endDate;
    }

    const results = await ValidationResult.findAll({
      where,
      attributes: ['status', 'contentType', 'autoFixed'],
    });

    const summary = {
      total: results.length,
      passed: 0,
      failed: 0,
      warnings: 0,
      autoFixed: 0,
      byContentType: {},
    };

    results.forEach((result) => {
      summary[result.status]++;

      if (result.autoFixed) {
        summary.autoFixed++;
      }

      if (!summary.byContentType[result.contentType]) {
        summary.byContentType[result.contentType] = {
          total: 0,
          passed: 0,
          failed: 0,
          warnings: 0,
          autoFixed: 0,
        };
      }

      const typeStats = summary.byContentType[result.contentType];
      typeStats.total++;
      typeStats[result.status]++;
      if (result.autoFixed) {
        typeStats.autoFixed++;
      }
    });

    return summary;
  }

  /**
   * Validate rule definition structure
   * 
   * @param {Object} definition - Rule definition to validate
   * @throws {Error} If rule definition is invalid
   * @private
   */
  validateRuleDefinition(definition) {
    if (!definition || typeof definition !== 'object') {
      throw new Error('Rule definition must be an object');
    }

    if (!definition.type) {
      throw new Error('Rule definition must have a type');
    }

    const validTypes = ['required_field', 'min_length', 'max_length', 'format', 'custom'];
    if (!validTypes.includes(definition.type)) {
      throw new Error(`Invalid rule type: ${definition.type}. Must be one of: ${validTypes.join(', ')}`);
    }

    // Type-specific validation
    if (definition.type === 'required_field' && !definition.field) {
      throw new Error('Required field rule must specify a field');
    }

    if (definition.type === 'min_length' && (!definition.field || !definition.minLength)) {
      throw new Error('Min length rule must specify field and minLength');
    }

    if (definition.type === 'max_length' && (!definition.field || !definition.maxLength)) {
      throw new Error('Max length rule must specify field and maxLength');
    }

    if (definition.type === 'format' && (!definition.field || !definition.pattern)) {
      throw new Error('Format rule must specify field and pattern');
    }

    return true;
  }
}

// Export singleton instance
module.exports = new ValidationService();
