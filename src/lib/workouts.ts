// Edits to logged workouts (used by the workout screen and History).
import { db } from '../db/db';

/** Remove an exercise from a workout: deletes all its sets in that session. */
export async function removeExerciseFromSession(sessionId: string, exerciseId: string) {
  await db.transaction('rw', db.sets, db.sessions, async () => {
    const sets = await db.sets.where('sessionId').equals(sessionId).toArray();
    await db.sets.bulkDelete(sets.filter((s) => s.exerciseId === exerciseId).map((s) => s.id));
    // A finished workout with nothing left in it is deleted too.
    const session = await db.sessions.get(sessionId);
    const remaining = sets.filter((s) => s.exerciseId !== exerciseId).length;
    if (session?.finishedAt && remaining === 0) await db.sessions.delete(sessionId);
  });
}

/** Delete a whole workout and all its sets. */
export async function deleteSession(sessionId: string) {
  await db.transaction('rw', db.sets, db.sessions, async () => {
    await db.sets.where('sessionId').equals(sessionId).delete();
    await db.sessions.delete(sessionId);
  });
}
