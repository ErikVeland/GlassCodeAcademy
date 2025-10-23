/**
 * Utility functions for mapping between short slugs and full module slugs
 */

// Define the slug mapping based on the registry.json
const slugMap = {
  'programming': 'programming-fundamentals',
  'web': 'web-fundamentals',
  'graphql': 'graphql-advanced'
};

/**
 * Resolves a short slug to its full slug equivalent
 * @param {string} slug - The slug to resolve (could be short or full)
 * @returns {string} The full slug
 */
function resolveSlug(slug) {
  // If the slug is in our mapping, return the full slug
  if (slugMap[slug]) {
    return slugMap[slug];
  }
  // Otherwise, assume it's already a full slug
  return slug;
}

/**
 * Checks if a slug is a short slug
 * @param {string} slug - The slug to check
 * @returns {boolean} True if the slug is a short slug
 */
function isShortSlug(slug) {
  return slugMap[slug] !== undefined;
}

/**
 * Checks if a short slug is valid (exists in our mapping)
 * @param {string} slug - The short slug to check
 * @returns {boolean} True if the short slug is valid
 */
function isValidShortSlug(slug) {
  return slugMap[slug] !== undefined;
}

/**
 * Gets all short slugs
 * @returns {Array<string>} Array of all short slugs
 */
function getShortSlugs() {
  return Object.keys(slugMap);
}

/**
 * Gets the short slug for a full slug, if one exists
 * @param {string} fullSlug - The full slug
 * @returns {string|null} The short slug or null if none exists
 */
function getShortSlug(fullSlug) {
  for (const [short, full] of Object.entries(slugMap)) {
    if (full === fullSlug) {
      return short;
    }
  }
  return null;
}

module.exports = {
  resolveSlug,
  isShortSlug,
  isValidShortSlug,
  getShortSlugs,
  getShortSlug,
  slugMap
};