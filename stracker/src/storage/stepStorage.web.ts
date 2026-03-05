// Simple in-memory + localStorage fallback for web builds.
// Native platforms use stepStorage.native.ts with expo-sqlite.

const STORAGE_KEY_PREFIX = 'step_tracker_steps_';

const getTodayKey = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

export type StepDb = null;

export const ensureDb = async (): Promise<StepDb> => {
  return null;
};

export const loadTodaySteps = async (): Promise<number> => {
  const today = getTodayKey();
  const key = `${STORAGE_KEY_PREFIX}${today}`;

  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      const raw = window.localStorage.getItem(key);
      const parsed = raw != null ? Number(raw) : 0;
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    }
  } catch {
    // ignore
  }

  return 0;
};

export const saveTodaySteps = async (value: number): Promise<void> => {
  const today = getTodayKey();
  const key = `${STORAGE_KEY_PREFIX}${today}`;

  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.setItem(key, String(value));
    }
  } catch {
    // ignore
  }
};

