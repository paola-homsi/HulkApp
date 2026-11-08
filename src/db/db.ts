import Dexie, { type Table } from 'dexie';
import type {
  Exercise, Food, FoodEntry, MuscleGroup, Settings, WorkoutSession, WorkoutSet,
} from '../types';
import { seedDatabase } from './seed';
import { loadMyHistory, v2RestoreOriginalNames, v3LoadMyHistory, v4AbducteurInLegs } from './migrations';

// Dexie wraps IndexedDB. Each property below is one table ("object store").
export class TrackerDB extends Dexie {
  settings!: Table<Settings, string>;
  foods!: Table<Food, string>;
  foodEntries!: Table<FoodEntry, string>;
  muscleGroups!: Table<MuscleGroup, string>;
  exercises!: Table<Exercise, string>;
  sessions!: Table<WorkoutSession, string>;
  sets!: Table<WorkoutSet, string>;

  constructor() {
    super('fittrack');
    // The string lists the primary key first, then the indexed fields (fields you query by).
    // Other fields are still stored, just not indexed.
    // To change the schema later: add this.version(2).stores({...}) below; never edit version 1.
    this.version(1).stores({
      settings: 'id',
      foods: 'id, name',
      foodEntries: 'id, date, foodId',
      muscleGroups: 'id, order',
      exercises: 'id, muscleGroupId, order',
      sessions: 'id, date, muscleGroupId, startedAt',
      sets: 'id, sessionId, exerciseId',
    });

    // Version 2: same tables, plus a one-time data fix (see migrations.ts).
    // Dexie runs .upgrade() only on devices that still have version 1, never on a fresh install.
    this.version(2)
      .stores({
        settings: 'id',
        foods: 'id, name',
        foodEntries: 'id, date, foodId',
        muscleGroups: 'id, order',
        exercises: 'id, muscleGroupId, order',
        sessions: 'id, date, muscleGroupId, startedAt',
        sets: 'id, sessionId, exerciseId',
      })
      .upgrade(v2RestoreOriginalNames);

    // Version 3: load the bundled gym history (see migrations.ts).
    this.version(3)
      .stores({
        settings: 'id',
        foods: 'id, name',
        foodEntries: 'id, date, foodId',
        muscleGroups: 'id, order',
        exercises: 'id, muscleGroupId, order',
        sessions: 'id, date, muscleGroupId, startedAt',
        sets: 'id, sessionId, exerciseId',
      })
      .upgrade(v3LoadMyHistory);

    // Version 4: move Abducteur from Glutes to Legs (see migrations.ts).
    this.version(4)
      .stores({
        settings: 'id',
        foods: 'id, name',
        foodEntries: 'id, date, foodId',
        muscleGroups: 'id, order',
        exercises: 'id, muscleGroupId, order',
        sessions: 'id, date, muscleGroupId, startedAt',
        sets: 'id, sessionId, exerciseId',
      })
      .upgrade(v4AbducteurInLegs);

    // Runs once, the first time the database is created on this device:
    // starter foods + settings, then your own exercises and history.
    this.on('populate', async (tx) => {
      await seedDatabase(tx);
      await loadMyHistory(tx);
    });
  }
}

export const db = new TrackerDB();

export const newId = () => crypto.randomUUID();
