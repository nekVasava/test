/**
 * Cache management scoped strictly to CalcNest caches.
 * Uses strict prefix matching to never touch or wipe caches belonging to other apps or domains.
 */

export const CALC_NEST_CACHE_PREFIX = 'calcnest-';

/**
 * Validates that a cache name belongs strictly to CalcNest.
 * Enforces exact prefix matching ('calcnest-') rather than loose substring inclusion.
 */
export function isCalcNestCache(cacheName: string): boolean {
  return typeof cacheName === 'string' && cacheName.startsWith(CALC_NEST_CACHE_PREFIX);
}

export async function clearCalcNestCachesOnly(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return { success: true, deletedCount: 0 };
    }

    const cacheNames = await caches.keys();
    let deletedCount = 0;

    for (const name of cacheNames) {
      // ONLY delete if it strictly starts with the CalcNest prefix
      if (isCalcNestCache(name)) {
        const deleted = await caches.delete(name);
        if (deleted) deletedCount++;
      }
    }

    return { success: true, deletedCount };
  } catch (err) {
    return {
      success: false,
      deletedCount: 0,
      error: `Failed to clear CalcNest caches: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Checks cache health and lists CalcNest cache names safely.
 */
export async function getCalcNestCacheStatus(): Promise<{
  available: boolean;
  caches: string[];
  scopedOnly: boolean;
}> {
  try {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return { available: false, caches: [], scopedOnly: true };
    }

    const all = await caches.keys();
    const calcnestOnly = all.filter((name) => isCalcNestCache(name));

    return {
      available: true,
      caches: calcnestOnly,
      scopedOnly: true,
    };
  } catch {
    return { available: false, caches: [], scopedOnly: true };
  }
}
