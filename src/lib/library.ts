// Exercise library rules and edits.
import { db, newId } from '../db/db';
import { getExercises } from '../db/queries';

export const MIN_EXERCISES = 6;
export const MAX_EXERCISES = 9;

export interface GroupCheck {
  ok: boolean;
  badge: string;   // short text for the badge
  message?: string; // longer warning, only when not ok
}

export function checkGroupSize(count: number): GroupCheck {
  if (count < MIN_EXERCISES) {
    const missing = MIN_EXERCISES - count;
    return { ok: false, badge: `${count}/${MIN_EXERCISES}`, message: `Add ${missing} more exercise${missing > 1 ? 's' : ''} (minimum ${MIN_EXERCISES}).` };
  }
  if (count > MAX_EXERCISES) {
    const extra = count - MAX_EXERCISES;
    return { ok: false, badge: `${count}/${MAX_EXERCISES}`, message: `Remove ${extra} exercise${extra > 1 ? 's' : ''} (maximum ${MAX_EXERCISES}).` };
  }
  return { ok: true, badge: `${count} ✓` };
}

/** Rewrite order = 0, 1, 2… so positions never have gaps or duplicates. */
async function saveOrder(ids: string[]) {
  await db.transaction('rw', db.exercises, async () => {
    await Promise.all(ids.map((id, i) => db.exercises.update(id, { order: i })));
  });
}

export async function moveExercise(muscleGroupId: string, exerciseId: string, direction: -1 | 1) {
  const ids = (await getExercises(muscleGroupId)).map((e) => e.id);
  const i = ids.indexOf(exerciseId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await saveOrder(ids);
}

export async function addExercise(muscleGroupId: string, name: string) {
  const list = await getExercises(muscleGroupId);
  await db.exercises.add({ id: newId(), muscleGroupId, name: name.trim(), order: list.length, archived: false });
}

/** Exercises with logged sets are archived (history kept); others are deleted. */
export async function deleteExercise(muscleGroupId: string, exerciseId: string) {
  const hasHistory = (await db.sets.where('exerciseId').equals(exerciseId).count()) > 0;
  if (hasHistory) await db.exercises.update(exerciseId, { archived: true });
  else await db.exercises.delete(exerciseId);
  await saveOrder((await getExercises(muscleGroupId)).map((e) => e.id));
}
