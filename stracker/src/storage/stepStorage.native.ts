import * as SQLite from 'expo-sqlite';

const DB_NAME = 'steps.db';
const TABLE_NAME = 'step_data';

const getTodayKey = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
};

const openDatabase = () => {
  return SQLite.openDatabaseAsync(DB_NAME);
};

export type StepDb = SQLite.SQLiteDatabase;

export const ensureDb = async (): Promise<StepDb> => {
  const db = await openDatabase();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INTEGER PRIMARY KEY NOT NULL,
      date TEXT NOT NULL UNIQUE,
      steps INTEGER NOT NULL
    );
  `);

  return db;
};

export const loadTodaySteps = async (db?: StepDb): Promise<number> => {
  const database = db ?? (await ensureDb());
  const today = getTodayKey();

  const result = await database.getFirstAsync<{ steps: number }>(
    `SELECT steps FROM ${TABLE_NAME} WHERE date = ?;`,
    today,
  );

  if (result && typeof result.steps === 'number') {
    return result.steps;
  }

  return 0;
};

export const saveTodaySteps = async (value: number, db?: StepDb): Promise<void> => {
  const database = db ?? (await ensureDb());
  const today = getTodayKey();

  await database.runAsync(
    `INSERT INTO ${TABLE_NAME} (date, steps)
     VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET steps=excluded.steps;`,
    today,
    value,
  );
};

