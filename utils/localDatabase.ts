import {
  openDatabaseAsync,
  type SQLiteDatabase,
} from "expo-sqlite";
import {
  getCurrentWeekBounds,
  getLocalDayBounds,
  type WaterLogRecord,
} from "@/utils/offlineLogic";

export type LocalCup = {
  id: number;
  name: string;
  volume: number;
  unit: string;
};

export type LocalProfile = {
  gender: string | null;
  weightKg: number | null;
  dailyGoalMl: number;
};

type CupRow = {
  id: number;
  name: string;
  volume_ml: number;
  unit: string;
};

const DATABASE_NAME = "smart-hydrate.db";
const DEFAULT_CUPS = [
  { name: "Glass", volumeMl: 250 },
  { name: "Bottle", volumeMl: 500 },
];

let databasePromise: Promise<SQLiteDatabase> | null = null;

const assertUserId = (clerkUserId: string) => {
  if (!clerkUserId.trim()) {
    throw new Error("A Clerk user ID is required for local data access.");
  }
};

const getDatabase = (): Promise<SQLiteDatabase> => {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME)
      .then(async (database) => {
        await database.execAsync(`
          PRAGMA foreign_keys = ON;
          CREATE TABLE IF NOT EXISTS user_profiles (
            clerk_user_id TEXT PRIMARY KEY NOT NULL,
            gender TEXT,
            weight_kg REAL,
            daily_goal_ml INTEGER NOT NULL DEFAULT 2000
              CHECK (daily_goal_ml > 0),
            cups_seeded INTEGER NOT NULL DEFAULT 0
              CHECK (cups_seeded IN (0, 1))
          );
          CREATE TABLE IF NOT EXISTS cups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clerk_user_id TEXT NOT NULL,
            name TEXT NOT NULL,
            volume_ml INTEGER NOT NULL CHECK (volume_ml > 0),
            unit TEXT NOT NULL DEFAULT 'ml',
            FOREIGN KEY (clerk_user_id)
              REFERENCES user_profiles (clerk_user_id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS cups_user_idx
            ON cups (clerk_user_id, id);
          CREATE TABLE IF NOT EXISTS water_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            clerk_user_id TEXT NOT NULL,
            amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
            logged_at TEXT NOT NULL,
            notes TEXT NOT NULL DEFAULT '',
            FOREIGN KEY (clerk_user_id)
              REFERENCES user_profiles (clerk_user_id) ON DELETE CASCADE
          );
          CREATE INDEX IF NOT EXISTS water_logs_user_time_idx
            ON water_logs (clerk_user_id, logged_at);
          PRAGMA user_version = 1;
        `);
        return database;
      })
      .catch((error: unknown) => {
        databasePromise = null;
        throw error;
      });
  }
  return databasePromise;
};

export const initializeLocalUser = async (clerkUserId: string) => {
  assertUserId(clerkUserId);
  const database = await getDatabase();

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(
      `INSERT OR IGNORE INTO user_profiles (clerk_user_id)
       VALUES (?)`,
      clerkUserId,
    );

    const profile = await transaction.getFirstAsync<{ cups_seeded: number }>(
      `SELECT cups_seeded FROM user_profiles WHERE clerk_user_id = ?`,
      clerkUserId,
    );

    if (!profile) {
      throw new Error("Could not initialize the local user profile.");
    }

    if (profile.cups_seeded === 0) {
      for (const cup of DEFAULT_CUPS) {
        await transaction.runAsync(
          `INSERT INTO cups (clerk_user_id, name, volume_ml, unit)
           VALUES (?, ?, ?, 'ml')`,
          clerkUserId,
          cup.name,
          cup.volumeMl,
        );
      }

      await transaction.runAsync(
        `UPDATE user_profiles SET cups_seeded = 1
         WHERE clerk_user_id = ?`,
        clerkUserId,
      );
    }
  });
};

export const getLocalProfile = async (
  clerkUserId: string,
): Promise<LocalProfile> => {
  assertUserId(clerkUserId);
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    gender: string | null;
    weight_kg: number | null;
    daily_goal_ml: number;
  }>(
    `SELECT gender, weight_kg, daily_goal_ml
     FROM user_profiles WHERE clerk_user_id = ?`,
    clerkUserId,
  );

  if (!row) {
    throw new Error("The local user profile has not been initialized.");
  }

  return {
    gender: row.gender,
    weightKg: row.weight_kg,
    dailyGoalMl: row.daily_goal_ml,
  };
};

export const updateLocalProfile = async (
  clerkUserId: string,
  profile: LocalProfile,
) => {
  assertUserId(clerkUserId);
  if (!Number.isInteger(profile.dailyGoalMl) || profile.dailyGoalMl <= 0) {
    throw new Error("Daily goal must be a positive number.");
  }
  if (
    profile.weightKg !== null &&
    (!Number.isFinite(profile.weightKg) || profile.weightKg <= 0)
  ) {
    throw new Error("Weight must be a positive number.");
  }

  const database = await getDatabase();
  const result = await database.runAsync(
    `UPDATE user_profiles
     SET gender = ?, weight_kg = ?, daily_goal_ml = ?
     WHERE clerk_user_id = ?`,
    profile.gender,
    profile.weightKg,
    profile.dailyGoalMl,
    clerkUserId,
  );

  if (result.changes === 0) {
    throw new Error("The local user profile has not been initialized.");
  }
};

export const getLocalCups = async (
  clerkUserId: string,
): Promise<LocalCup[]> => {
  assertUserId(clerkUserId);
  const database = await getDatabase();
  const rows = await database.getAllAsync<CupRow>(
    `SELECT id, name, volume_ml, unit
     FROM cups WHERE clerk_user_id = ? ORDER BY id`,
    clerkUserId,
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    volume: row.volume_ml,
    unit: row.unit,
  }));
};

export const addLocalCup = async (
  clerkUserId: string,
  name: string,
  volumeMl: number,
): Promise<LocalCup> => {
  assertUserId(clerkUserId);
  if (!name.trim() || !Number.isInteger(volumeMl) || volumeMl <= 0) {
    throw new Error("Enter a cup name and a positive whole-number volume.");
  }

  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO cups (clerk_user_id, name, volume_ml, unit)
     VALUES (?, ?, ?, 'ml')`,
    clerkUserId,
    name.trim(),
    volumeMl,
  );

  return {
    id: result.lastInsertRowId,
    name: name.trim(),
    volume: volumeMl,
    unit: "ml",
  };
};

export const deleteLocalCup = async (
  clerkUserId: string,
  cupId: number,
): Promise<boolean> => {
  assertUserId(clerkUserId);
  const database = await getDatabase();
  const result = await database.runAsync(
    `DELETE FROM cups WHERE id = ? AND clerk_user_id = ?`,
    cupId,
    clerkUserId,
  );
  return result.changes > 0;
};

export const getLocalWaterLogs = async (
  clerkUserId: string,
  range?: { start: Date; end: Date },
): Promise<WaterLogRecord[]> => {
  assertUserId(clerkUserId);
  const database = await getDatabase();

  const rows = range
    ? await database.getAllAsync<WaterLogRecord>(
        `SELECT id, amount_ml, logged_at, notes
         FROM water_logs
         WHERE clerk_user_id = ? AND logged_at >= ? AND logged_at < ?
         ORDER BY logged_at DESC`,
        clerkUserId,
        range.start.toISOString(),
        range.end.toISOString(),
      )
    : await database.getAllAsync<WaterLogRecord>(
        `SELECT id, amount_ml, logged_at, notes
         FROM water_logs WHERE clerk_user_id = ?
         ORDER BY logged_at DESC`,
        clerkUserId,
      );

  return rows;
};

export const getTodayWaterLogs = (clerkUserId: string) =>
  getLocalWaterLogs(clerkUserId, getLocalDayBounds());

export const getThisWeekWaterLogs = (clerkUserId: string) =>
  getLocalWaterLogs(clerkUserId, getCurrentWeekBounds());

export const addLocalWaterLog = async (
  clerkUserId: string,
  amountMl: number,
  notes: string,
): Promise<WaterLogRecord> => {
  assertUserId(clerkUserId);
  if (!Number.isInteger(amountMl) || amountMl <= 0) {
    throw new Error("Water amount must be a positive whole number.");
  }

  const loggedAt = new Date().toISOString();
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO water_logs (clerk_user_id, amount_ml, logged_at, notes)
     VALUES (?, ?, ?, ?)`,
    clerkUserId,
    amountMl,
    loggedAt,
    notes,
  );

  return {
    id: result.lastInsertRowId,
    amount_ml: amountMl,
    logged_at: loggedAt,
    notes,
  };
};

export const deleteLocalWaterLog = async (
  clerkUserId: string,
  logId: number,
): Promise<boolean> => {
  assertUserId(clerkUserId);
  const database = await getDatabase();
  const result = await database.runAsync(
    `DELETE FROM water_logs WHERE id = ? AND clerk_user_id = ?`,
    logId,
    clerkUserId,
  );
  return result.changes > 0;
};
