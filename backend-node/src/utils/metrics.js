/**
 * Minimal metrics utility used by middleware to record HTTP request stats.
 * In local/dev environments, this is a no-op with optional console logging.
 */
function recordHttpRequest(method, route, statusCode, durationSeconds) {
  const env = (process.env.NODE_ENV || '').toLowerCase();
  if (env !== 'production') {
    // Keep logging terse to avoid noise; enable detailed logs when needed
    // console.log(`[metrics] ${method} ${route} -> ${statusCode} in ${durationSeconds.toFixed(3)}s`);
  }
}

module.exports = { recordHttpRequest };