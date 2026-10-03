import { HistoryEntry } from '../types';

const STORAGE_KEYS = {
  HISTORY: 'calcnest_history_v1',
  PRO_DEMO_ENABLED: 'calcnest_pro_demo_v1',
  CUSTOM_RATES: 'calcnest_custom_rates_v1',
  THEME: 'calcnest_theme_v1',
};

export const FREE_TIER_HISTORY_LIMIT = 50;

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// In-memory persistent fallback store
const memoryStorage = new Map<string, string>();
// Track keys where localStorage write failed, ensuring fallback reads remain consistent
const fallbackActiveKeys = new Set<string>();

// Simulated failure flag for deterministic unit testing
let simulateFailure = false;

export function setSimulateStorageFailure(failing: boolean): void {
  simulateFailure = failing;
}

export function isFallbackActiveForKey(key: string): boolean {
  return fallbackActiveKeys.has(key);
}

/**
 * Coherent read operation:
 * If a key was written to fallback (because localStorage failed or quota exceeded),
 * safeGetItem reads directly from memoryStorage to ensure 100% read-after-write consistency.
 */
export function safeGetItem(key: string): string | null {
  if (fallbackActiveKeys.has(key) || simulateFailure) {
    return memoryStorage.get(key) ?? null;
  }

  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        // Keep memoryStorage in sync
        memoryStorage.set(key, val);
        return val;
      }
    }
  } catch {
    // If localStorage read throws, read from fallback
    fallbackActiveKeys.add(key);
  }

  return memoryStorage.get(key) ?? null;
}

/**
 * Coherent write operation:
 * Always updates memoryStorage. If localStorage fails (quota exceeded, security error, or simulated failure),
 * flags fallbackActiveKeys so subsequent reads consistently return the newly written value.
 */
export function safeSetItem(key: string, value: string): void {
  // Always update memoryStorage first
  memoryStorage.set(key, value);

  if (simulateFailure) {
    fallbackActiveKeys.add(key);
    return;
  }

  try {
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem(key, value);
      fallbackActiveKeys.delete(key);
      return;
    }
  } catch {
    // Write failed on localStorage (e.g. QuotaExceededError) -> mark fallback as active
    fallbackActiveKeys.add(key);
  }
}

/**
 * Coherent remove operation
 */
export function safeRemoveItem(key: string): void {
  memoryStorage.delete(key);
  fallbackActiveKeys.delete(key);

  if (simulateFailure) return;

  try {
    if (typeof localStorage !== 'undefined' && localStorage.removeItem) {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

/**
 * Checks if Pro Demo Mode is currently active.
 */
export function isProDemoActive(): boolean {
  try {
    return safeGetItem(STORAGE_KEYS.PRO_DEMO_ENABLED) === 'true';
  } catch {
    return false;
  }
}

/**
 * Toggles or sets Pro Demo Mode.
 */
export function setProDemoActive(enabled: boolean): StorageResult<boolean> {
  try {
    safeSetItem(STORAGE_KEYS.PRO_DEMO_ENABLED, enabled ? 'true' : 'false');
    return { success: true, data: enabled };
  } catch (err) {
    return {
      success: false,
      error: `Failed to update Pro demo mode: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Retrieves calculation history from localStorage with coherent fallback.
 */
export function getHistory(): StorageResult<HistoryEntry[]> {
  try {
    const raw = safeGetItem(STORAGE_KEYS.HISTORY);
    if (!raw) return { success: true, data: [] };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { success: true, data: [] };
    return { success: true, data: parsed };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: `Could not load history: ${err instanceof Error ? err.message : 'Corrupted storage data.'}`,
    };
  }
}

/**
 * Adds an entry to calculation history.
 * Enforces the 50-entry limit on free tier, or unlimited on Pro demo tier.
 */
export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): StorageResult<HistoryEntry[]> {
  try {
    const currentRes = getHistory();
    const current = currentRes.data || [];
    const isPro = isProDemoActive();

    const newEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };

    let updated = [newEntry, ...current];

    // Enforce 50-item limit for free tier
    if (!isPro && updated.length > FREE_TIER_HISTORY_LIMIT) {
      updated = updated.slice(0, FREE_TIER_HISTORY_LIMIT);
    }

    safeSetItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error: `Failed to save calculation history: ${err instanceof Error ? err.message : 'Storage quota exceeded.'}`,
    };
  }
}

/**
 * Clears all calculation history.
 */
export function clearHistory(): StorageResult<boolean> {
  try {
    safeRemoveItem(STORAGE_KEYS.HISTORY);
    return { success: true, data: true };
  } catch (err) {
    return {
      success: false,
      error: `Failed to clear history: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Deletes a single history entry by ID.
 */
export function deleteHistoryEntry(id: string): StorageResult<HistoryEntry[]> {
  try {
    const currentRes = getHistory();
    const current = currentRes.data || [];
    const updated = current.filter((item) => item.id !== id);
    safeSetItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return { success: true, data: updated };
  } catch (err) {
    return {
      success: false,
      error: `Failed to delete entry: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Custom currency rates storage
 */
export function getSavedCustomRates(): Record<string, number> | null {
  try {
    const raw = safeGetItem(STORAGE_KEYS.CUSTOM_RATES);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCustomRates(rates: Record<string, number>): StorageResult<Record<string, number>> {
  try {
    safeSetItem(STORAGE_KEYS.CUSTOM_RATES, JSON.stringify(rates));
    return { success: true, data: rates };
  } catch (err) {
    return {
      success: false,
      error: `Failed to persist custom exchange rates: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
