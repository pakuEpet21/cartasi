/**
 * Shared runtime configuration.
 *
 * VITE_* variables are exposed by Vite to the client. They are also available
 * on the server during SSR/dev via import.meta.env. Falls back to process.env
 * for server-only contexts (e.g. standalone server functions).
 */

function env(key: string, fallback: string): string {
  try {
    const viteValue = (import.meta as unknown as Record<string, Record<string, string | undefined>>)?.env?.[key];
    if (viteValue) return viteValue;
  } catch {
    // import.meta.env not available
  }

  try {
    const processValue = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key];
    if (processValue) return processValue;
  } catch {
    // process.env not available
  }

  return fallback;
}

export const ACTIVE_RESTAURANT_SLUG = env(
  "VITE_ACTIVE_RESTAURANT_SLUG",
  "mi-restaurante",
);

export const SITE_NAME = env("VITE_SITE_NAME", "CartaSI");
