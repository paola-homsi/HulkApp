// Reusable data hooks. useLiveQuery re-runs the query and re-renders
// whenever the tables it reads change, so screens are always up to date.
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { DEFAULT_SETTINGS } from './seed';
import type { Exercise, Settings, WorkoutSession } from '../types';
import type { ExerciseSession } from '../lib/strength';

export function useSettings(): Settings {
  return useLiveQuery(() => db.settings.get('singleton'), []) ?? DEFAULT_SETTINGS;
}

export async function updateSettings(changes: Partial<Settings>) {
  const current = (await db.settings.get('singleton')) ?? DEFAULT_SETTINGS;
  await db.settings.put({ ...current, ...changes, id: 'singleton' });
}

export function useMuscleGroups() {
  return useLiveQuery(() => db.muscleGroups.orderBy('order').toArray(), []);
}

/** Active (not archived) exercises of a group, in the user's order. */
export async function getExercises(muscleGroupId: string): Promise<Exercise[]> {
  const list = await db.exercises.where('muscleGroupId').equals(muscleGroupId).toArray();
  return list.filter((e) => !e.archived).sort((a, b) => a.order - b.order);
}

export function useExercises(muscleGroupId: string | undefined) {
  return useLiveQuery(() => (muscleGroupId ? getExercises(muscleGroupId) : []), [muscleGroupId]);
}

/** The unfinished session, if any (most recent first). */
export async function getActiveSession(): Promise<WorkoutSession | undefined> {
  const recent = await db.sessions.orderBy('startedAt').reverse().limit(5).toArray();
  return recent.find((s) => !s.finishedAt);
}

/** Every session in which this exercise has sets, oldest first. */
export async function getExerciseHistory(exerciseId: string): Promise<ExerciseSession[]> {
  const sets = await db.sets.where('exerciseId').equals(exerciseId).toArray();
  const sessionIds = [...new Set(sets.map((s) => s.sessionId))];
  const sessions = (await db.sessions.bulkGet(sessionIds)).filter(Boolean) as WorkoutSession[];
  return sessions
    .sort((a, b) => a.date.localeCompare(b.date) || a.startedAt - b.startedAt)
    .map((session) => ({ session, sets: sets.filter((s) => s.sessionId === session.id) }));
}

export function useExerciseHistory(exerciseId: string | undefined) {
  return useLiveQuery(() => (exerciseId ? getExerciseHistory(exerciseId) : []), [exerciseId]);
}
