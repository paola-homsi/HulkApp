import Dexie, { type Table } from 'dexie';
import type {
  Exercise, Food, FoodEntry, MuscleGroup, Settings, WorkoutSession, WorkoutSet,
} from '../types';
import { seedDatabase } from './seed';

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

    // Runs once, the first time the database is created on this device.
    this.on('populate', (tx) => seedDatabase(tx));
  }
}

export const db = new TrackerDB();

export const newId = () => crypto.randomUUID();
