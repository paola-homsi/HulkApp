// Export / import all data as one JSON file.
import { db } from '../db/db';
import type {
  Exercise, Food, FoodEntry, MuscleGroup, Settings, WorkoutSession, WorkoutSet,
} from '../types';

export const BACKUP_VERSION = 1;

export interface BackupData {
  settings: Settings[];
  foods: Food[];
  foodEntries: FoodEntry[];
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
  sessions: WorkoutSession[];
  sets: WorkoutSet[];
}

export interface BackupFile {
  app: 'fittrack';
  version: number;
  exportedAt: string;
  data: BackupData;
}

const TABLES: (keyof BackupData)[] = [
  'settings', 'foods', 'foodEntries', 'muscleGroups', 'exercises', 'sessions', 'sets',
];

export async function exportAll(): Promise<BackupFile> {
  const data = {} as BackupData;
  for (const name of TABLES) {
    (data as any)[name] = await db.table(name).toArray();
  }
  return { app: 'fittrack', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data };
}

export function downloadJson(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Parse and check a backup file. Throws an Error with a readable message if it's not valid. */
export function parseBackup(text: string): BackupFile {
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  if (json?.app !== 'fittrack' || typeof json.data !== 'object') {
    throw new Error('This is not a FitTrack backup file.');
  }
  if (json.version > BACKUP_VERSION) {
    throw new Error('This backup comes from a newer version of the app.');
  }
  for (const name of TABLES) {
    if (!Array.isArray(json.data[name])) json.data[name] = [];
  }
  return json as BackupFile;
}

export function summarize(b: BackupFile): string {
  const d = b.data;
  return [
    `${d.foodEntries.length} food entries`,
    `${d.foods.length} foods`,
    `${d.sessions.length} workouts`,
    `${d.sets.length} sets`,
    `${d.exercises.length} exercises`,
  ].join(', ');
}

/** Replace ALL data with the backup's content, in one transaction (all or nothing). */
export async function importAll(b: BackupFile) {
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const name of TABLES) {
      await db.table(name).clear();
      await db.table(name).bulkAdd(b.data[name] as any[]);
    }
  });
}
