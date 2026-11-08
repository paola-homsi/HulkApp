import Dexie, { type Table } from 'dexie';
import type {
  Exercise, Food, FoodEntry, MuscleGroup, Settings, WorkoutSession, WorkoutSet,
} from '../types';
import { seedDatabase } from './seed';
import { loadMyHistory, v2RestoreOriginalNames, v3LoadMyHistory, v4AbducteurInLegs } from './migrations';
import { LEGACY_DB } from './profiles';

// Table definitions: primary key first, then the indexed fields (fields you query by).
// Other fields are still stored, just not indexed.
const SCHEMA = {
  settings: 'id',
  foods: 'id, name',
  foodEntries: 'id, date, foodId',
  muscleGroups: 'id, order',
  exercises: 'id, muscleGroupId, order',
  sessions: 'id, date, muscleGroupId, startedAt',
  sets: 'id, sessionId, exerciseId',
};

// Dexie wraps IndexedDB. Each property below is one table ("object store").
// There is one database per user (see profiles.ts); `name` says which one.
export class TrackerDB extends Dexie {
  settings!: Table<Settings, string>;
  foods!: Table<Food, string>;
  foodEntries!: Table<FoodEntry, string>;
  muscleGroups!: Table<MuscleGroup, string>;
  exercises!: Table<Exercise, string>;
  sessions!: Table<WorkoutSession, string>;
  sets!: Table<WorkoutSet, string>;

  constructor(name: string) {
    super(name);
    // Versions are never edited once released. To change the schema or fix data,
    // add a new version with an .upgrade() (see migrations.ts).
    // Upgrades only run on databases created by an OLDER version (Hulk's original one);
    // a new user's database starts directly at the latest version.
    this.version(1).stores(SCHEMA);
    this.version(2).stores(SCHEMA).upgrade(v2RestoreOriginalNames);
    this.version(3).stores(SCHEMA).upgrade(v3LoadMyHistory);
    this.version(4).stores(SCHEMA).upgrade(v4AbducteurInLegs);

    // Runs once, when this user's database is first created: starter foods, settings and exercises.
    // Hulk's database also gets the gym notes.
    this.on('populate', async (tx) => {
      await seedDatabase(tx);
      if (name === LEGACY_DB) await loadMyHistory(tx);
    });
  }
}

/** The current user's database. Set once at startup by openDatabase() (see main.tsx). */
export let db: TrackerDB;

export function openDatabase(name: string): TrackerDB {
  db = new TrackerDB(name);
  return db;
}

export const newId = () => crypto.randomUUID();
