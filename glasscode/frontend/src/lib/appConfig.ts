/**
 * Application-wide configuration for external URLs and options
 * Centralizes links to avoid hardcoded URLs in components.
 */

export const EXTERNAL_LINKS = {
  AUTHOR_URL: (process.env.NEXT_PUBLIC_AUTHOR_URL || '').trim(),
  REPO_URL: (process.env.NEXT_PUBLIC_REPO_URL || '').trim(),
};