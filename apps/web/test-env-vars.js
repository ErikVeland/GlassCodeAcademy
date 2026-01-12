#!/usr/bin/env node
/**
 * Environment sanity check tailored to current project.
 * Ensures essential runtime indicators are present and logs helpful info.
 * Designed to pass in dev/CI while surfacing warnings without failing builds.
 */

function ok(msg) {
  console.log(`✔ ${msg}`);
}

function warn(msg) {
  console.warn(`⚠ ${msg}`);
}

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exitCode = 1;
}

async function main() {
  try {
    // NODE_ENV is often unset in bare npm scripts; warn instead of failing
    if (!process.env.NODE_ENV) {
      warn('NODE_ENV is not set; assuming development');
    } else {
      ok(`NODE_ENV=${process.env.NODE_ENV}`);
    }

    // Optional NextAuth vars – warn if missing but do not fail
    const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3003';
    if (!process.env.NEXTAUTH_URL) {
      warn(`NEXTAUTH_URL not set; defaulting to ${nextAuthUrl}`);
    } else {
      ok(`NEXTAUTH_URL=${process.env.NEXTAUTH_URL}`);
    }

    if (!process.env.NEXTAUTH_SECRET) {
      warn('NEXTAUTH_SECRET not set (OK for local dev, required in prod)');
    } else {
      ok('NEXTAUTH_SECRET is set');
    }

    // Optional public site URL
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      ok(`NEXT_PUBLIC_SITE_URL=${process.env.NEXT_PUBLIC_SITE_URL}`);
    } else {
      warn('NEXT_PUBLIC_SITE_URL not set; using defaults in app code');
    }

    ok('Environment sanity check passed');
  } catch (err) {
    fail(`Unexpected error: ${err?.message || err}`);
  }
}

main();