import * as TaskManager from 'expo-task-manager';
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'steps.db';
const TABLE_NAME = 'step_data';

export const BACKGROUND_STEP_TASK = 'BACKGROUND_STEP_TASK';

let taskDefined = false;

const openDatabase = () => {
  return SQLite.openDatabaseAsync(DB_NAME);
};

export const ensureBackgroundTaskDefined = () => {
  if (taskDefined) return;

  try {
    TaskManager.defineTask(BACKGROUND_STEP_TASK, async ({ error }) => {
      if (error) {
        return;
      }

      try {
        const db = await openDatabase();

        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
            id INTEGER PRIMARY KEY NOT NULL,
            date TEXT NOT NULL UNIQUE,
            steps INTEGER NOT NULL
          );
        `);

        const today = new Date().toISOString().slice(0, 10);

        await db.runAsync(
          `INSERT INTO ${TABLE_NAME} (date, steps)
           VALUES (?, ?)
           ON CONFLICT(date) DO NOTHING;`,
          today,
        );
      } catch {
        // Swallow background storage errors
      }
    });

    taskDefined = true;
  } catch {
    // Ignore TaskManager configuration errors at runtime
  }
};

