const { AuditLog } = require('../models');

/**
 * Log an administrative action to the audit log
 * @param {Object} params - The audit log parameters
 * @param {number} params.userId - The ID of the user performing the action
 * @param {string} params.action - The action being performed (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} params.resourceType - The type of resource being acted upon (e.g., 'ACADEMY', 'COURSE')
 * @param {number} params.resourceId - The ID of the resource being acted upon
 * @param {string} params.resourceName - The name/title of the resource being acted upon
 * @param {Object} params.details - Additional details about the action
 * @param {string} params.ipAddress - The IP address of the user
 * @param {string} params.userAgent - The user agent of the request
 * @returns {Promise<AuditLog>} The created audit log entry
 */
const logAction = async ({
  userId,
  action,
  resourceType,
  resourceId,
  resourceName,
  details,
  ipAddress,
  userAgent,
}) => {
  try {
    const auditLog = await AuditLog.create({
      userId,
      action,
      resourceType,
      resourceId,
      resourceName,
      details,
      ipAddress,
      userAgent,
    });

    return auditLog;
  } catch (error) {
    // Log the error but don't throw it to avoid breaking the main flow
    console.error('Failed to create audit log entry:', error);
    return null;
  }
};

module.exports = {
  logAction,
};
