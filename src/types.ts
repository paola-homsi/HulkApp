// All data shapes used by the app. Each interface = one IndexedDB table (see db/db.ts).
// Dates are local 'YYYY-MM-DD' strings; timestamps are milliseconds (Date.now()).

export type Theme = 'dark' | 'light';

export interface Settings {
  id: 'singleton'; // only one settings row exists
  bodyWeightKg: number;
  proteinPerKg: number; // default 1.6
  weightStepKg: number; // default 0.5 (the +/- step for weights)
  theme: Theme;
}

export interface FoodUnit {
  label: string; // 'egg', 'scoop', 'slice'
  grams: number; // grams in one unit
}

export interface Food {
  id: string;
  name: string;
  proteinPer100g: number;
  unit?: FoodUnit;
  isFavorite: boolean;
  isBuiltIn: boolean;
}

export interface FoodEntry {
  id: string;
  date: string; // 'YYYY-MM-DD'
  foodId: string;
  foodName: string; // snapshot: renaming the food later won't rewrite history
  grams: number;
  units?: number; // set when logged by count (e.g. 3 eggs)
  protein: number; // snapshot, grams of protein
  createdAt: number;
}

export interface MuscleGroup {
  id: string;
  name: string;
  order: number;
}

export interface Exercise {
  id: string;
  muscleGroupId: string;
  name: string;
  order: number;
  archived: boolean; // deleted exercises with history are archived, not removed
}

export interface WorkoutSession {
  id: string;
  muscleGroupId: string;
  date: string; // 'YYYY-MM-DD'
  startedAt: number;
  finishedAt?: number;
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  createdAt: number;
}
