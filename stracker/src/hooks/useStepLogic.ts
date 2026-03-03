import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Accelerometer, Pedometer } from 'expo-sensors';
import * as SQLite from 'expo-sqlite';

import { BACKGROUND_STEP_TASK, ensureBackgroundTaskDefined } from '../services/BackgroundService';
import type { SensorStrategy } from '../context/StepContext';

const DB_NAME = 'steps.db';
const TABLE_NAME = 'step_data';

const getTodayKey = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

const openDatabase = () => {
  return SQLite.openDatabaseAsync(DB_NAME);
};

export interface UseStepLogicResult {
  steps: number;
  isWalking: boolean;
  isSupported: boolean;
  strategy: SensorStrategy;
  initialized: boolean;
  resetSteps: () => void;
}

export const useStepLogic = (): UseStepLogicResult => {
  const [steps, setSteps] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [strategy, setStrategy] = useState<SensorStrategy>('unsupported');
  const [initialized, setInitialized] = useState(false);

  const lastStepTimeRef = useRef<number>(0);
  const walkingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accelSubscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);
  const pedometerSubscriptionRef = useRef<ReturnType<typeof Pedometer.watchStepCount> | null>(null);
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);

  const persistSteps = useCallback(async (value: number) => {
    try {
      const db = dbRef.current ?? (await openDatabase());
      dbRef.current = db;

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
          id INTEGER PRIMARY KEY NOT NULL,
          date TEXT NOT NULL UNIQUE,
          steps INTEGER NOT NULL
        );
      `);

      const today = getTodayKey();

      await db.runAsync(
        `INSERT INTO ${TABLE_NAME} (date, steps)
         VALUES (?, ?)
         ON CONFLICT(date) DO UPDATE SET steps=excluded.steps;`,
        today,
        value,
      );
    } catch {
      // Swallow storage errors to avoid impacting UX
    }
  }, []);

  const loadInitialSteps = useCallback(async () => {
    try {
      const db = dbRef.current ?? (await openDatabase());
      dbRef.current = db;

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
          id INTEGER PRIMARY KEY NOT NULL,
          date TEXT NOT NULL UNIQUE,
          steps INTEGER NOT NULL
        );
      `);

      const today = getTodayKey();
      const result = await db.getFirstAsync<{ steps: number }>(
        `SELECT steps FROM ${TABLE_NAME} WHERE date = ?;`,
        today,
      );

      if (result && typeof result.steps === 'number') {
        setSteps(result.steps);
      }
    } catch {
      // Ignore initial load failure
    } finally {
      setInitialized(true);
    }
  }, []);

  const incrementStep = useCallback(
    (delta: number = 1) => {
      setSteps(prev => {
        const next = prev + delta;
        void persistSteps(next);
        return next;
      });

      setIsWalking(true);

      if (walkingTimeoutRef.current) {
        clearTimeout(walkingTimeoutRef.current);
      }

      walkingTimeoutRef.current = setTimeout(() => {
        setIsWalking(false);
      }, 1200);
    },
    [persistSteps],
  );

  const resetSteps = useCallback(() => {
    setSteps(0);
    void persistSteps(0);
  }, [persistSteps]);

  // Pedometer logic (primary)
  const startPedometer = useCallback(async () => {
    const available = await Pedometer.isAvailableAsync();
    if (!available) {
      return false;
    }

    setStrategy('pedometer');
    setIsSupported(true);

    if (pedometerSubscriptionRef.current) {
      pedometerSubscriptionRef.current.remove();
      pedometerSubscriptionRef.current = null;
    }

    const sub = Pedometer.watchStepCount(result => {
      const now = Date.now();

      if (now - lastStepTimeRef.current > 350) {
        incrementStep(result.steps);
        lastStepTimeRef.current = now;
      }
    });

    pedometerSubscriptionRef.current = sub;

    // Ensure background task is registered for future enhancements
    ensureBackgroundTaskDefined();

    return true;
  }, [incrementStep]);

  // Accelerometer fallback with DSP
  const startAccelerometer = useCallback(async () => {
    setStrategy('accelerometer');

    if (accelSubscriptionRef.current) {
      accelSubscriptionRef.current.remove();
      accelSubscriptionRef.current = null;
    }

    Accelerometer.setUpdateInterval(100);

    let gravity = 9.81;
    let movingAvg = 0;
    const alpha = 0.1;
    const thresholdDelta = 1.2;

    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      gravity = alpha * magnitude + (1 - alpha) * gravity;
      const linear = magnitude - gravity;

      movingAvg = alpha * linear + (1 - alpha) * movingAvg;

      const now = Date.now();
      if (linear > movingAvg + thresholdDelta && now - lastStepTimeRef.current > 350) {
        incrementStep(1);
        lastStepTimeRef.current = now;
      }
    });

    accelSubscriptionRef.current = sub;

    return true;
  }, [incrementStep]);

  useEffect(() => {
    void loadInitialSteps();
  }, [loadInitialSteps]);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        const startedPedometer = await startPedometer();

        if (!startedPedometer && !cancelled) {
          const accelStarted = await startAccelerometer();
          if (!accelStarted && !cancelled) {
            setIsSupported(false);
            setStrategy('unsupported');
          } else {
            setIsSupported(true);
          }
        } else if (startedPedometer && !cancelled) {
          setIsSupported(true);
        }
      } catch {
        if (!cancelled) {
          setIsSupported(false);
          setStrategy('unsupported');
        }
      }
    };

    setup();

    return () => {
      cancelled = true;

      if (pedometerSubscriptionRef.current) {
        pedometerSubscriptionRef.current.remove();
        pedometerSubscriptionRef.current = null;
      }

      if (accelSubscriptionRef.current) {
        accelSubscriptionRef.current.remove();
        accelSubscriptionRef.current = null;
      }

      if (walkingTimeoutRef.current) {
        clearTimeout(walkingTimeoutRef.current);
        walkingTimeoutRef.current = null;
      }
    };
  }, [startPedometer, startAccelerometer]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    // Placeholder for future TaskManager-related configuration on Android.
    void BACKGROUND_STEP_TASK;
  }, []);

  return {
    steps,
    isWalking,
    isSupported,
    strategy,
    initialized,
    resetSteps,
  };
};

