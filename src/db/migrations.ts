// Database upgrades. Each runs ONCE on a device, when the app opens with a newer schema version.
import type { Table, Transaction } from 'dexie';
import myHistory from './my-history.json';
import type { Exercise, MuscleGroup, WorkoutSession, WorkoutSet } from '../types';

/**
 * Version 2: give imported exercises back their original names (as written in the gym notes).
 * Only exact matches are renamed, so anything you renamed yourself is left alone.
 */
export const ORIGINAL_NAMES: Record<string, string> = {
  'Smith machine': 'Smith',
  'Développé couché haltères': 'Développé couché',
  'Lat pulldown': 'Latpull down',
  'Rowing back': 'Rowingback',
  'Élévation frontale': 'Épaule élévation frontale',
  "Arrière d'épaule poulie": 'Épaule arrière poulie',
  'Épaule barre': 'Épaule barree',
  'Faisceau complet haltères': 'Faisceau complet altère épaule',
  'Gainage (sec)': 'Gainage',
  'Leg curl': 'Legcurl',
  'Leg extension': 'Leg extensions',
  'Glute machine': 'Glute',
  'Bayesian curl': 'Baeysian curl',
  'Triceps poulie tête': 'Triceps tête',
  'Avant-bras poignée basse': 'Avant bras poignée bas',
  'Avant-bras poignée haute': 'Avant bras poignée haut',
  'Avant-bras poulie': 'Avant bras poulie',
};

export async function v2RestoreOriginalNames(tx: Transaction) {
  // Only exercises that have logged sets (i.e. your imported history), never the untouched starter list.
  const withHistory = new Set((await tx.table('sets').toArray()).map((s: { exerciseId: string }) => s.exerciseId));
  await tx.table('exercises').toCollection().modify((ex: { id: string; name: string }) => {
    const original = ORIGINAL_NAMES[ex.name];
    if (original && withHistory.has(ex.id)) ex.name = original;
  });
}

// ---------------------------------------------------------------------------
// Version 3: your gym notes (13/10 → 7/11) are bundled with the app and loaded automatically,
// so there's nothing to import. Also: "Biceps curl" entries were the machine → merged.
// ---------------------------------------------------------------------------

const HISTORY = myHistory as {
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
  sessions: WorkoutSession[];
  sets: WorkoutSet[];
};

/** Anything with .table(name): the database itself, or a transaction during an upgrade. */
type Tables = { table: (name: string) => Table<any, string> };

export async function hasMyHistory(t: Tables): Promise<boolean> {
  return (await t.table('sessions').filter((s: WorkoutSession) => s.id.startsWith('imp-')).count()) > 0;
}

/** Load the bundled history: your groups, your exercise names, all sessions and sets. */
export async function loadMyHistory(t: Tables) {
  const mine = new Set(HISTORY.exercises.map((e) => e.id));
  const used = new Set((await t.table('sets').toArray()).map((s: WorkoutSet) => s.exerciseId));
  // Remove starter exercises you never used, so the library is exactly your list.
  const current: Exercise[] = await t.table('exercises').toArray();
  await t.table('exercises').bulkDelete(current.filter((e) => !mine.has(e.id) && !used.has(e.id)).map((e) => e.id));
  await t.table('muscleGroups').bulkPut(HISTORY.muscleGroups);
  await t.table('exercises').bulkPut(HISTORY.exercises);
  await t.table('sessions').bulkPut(HISTORY.sessions);
  await t.table('sets').bulkPut(HISTORY.sets);
}

export async function v3LoadMyHistory(tx: Transaction) {
  if (await hasMyHistory(tx)) {
    // History was already imported: only apply the biceps fix (keeps any edits you made).
    await tx.table('sets').where('exerciseId').equals('ex-arms-biceps-curl').modify({ exerciseId: 'ex-arms-biceps-curl-machine' });
    await tx.table('exercises').delete('ex-arms-biceps-curl');
    return;
  }
  await loadMyHistory(tx);
}

// ---------------------------------------------------------------------------
// Version 4: Abducteur belongs to Legs (it was filed under Glutes). Moves the exercise and its
// sets into that day's Legs workout. Adducteur and Abducteur stay two separate exercises.
// ---------------------------------------------------------------------------
export async function v4AbducteurInLegs(t: Tables) {
  const OLD = 'ex-glutes-abducteur';
  const NEW = 'ex-legs-abducteur';
  const old: Exercise | undefined = await t.table('exercises').get(OLD);
  if (!old) return;

  // 1. The exercise: new id in Legs, placed right after Adducteur.
  const legs: Exercise[] = (await t.table('exercises').where('muscleGroupId').equals('mg-legs').toArray())
    .filter((e: Exercise) => !e.archived)
    .sort((a: Exercise, b: Exercise) => a.order - b.order);
  const moved: Exercise = { ...old, id: NEW, muscleGroupId: 'mg-legs' };
  const at = legs.findIndex((e) => e.name === 'Adducteur');
  legs.splice(at >= 0 ? at + 1 : legs.length, 0, moved);
  await t.table('exercises').delete(OLD);
  await t.table('exercises').bulkPut(legs.map((e, i) => ({ ...e, order: i })));

  // 2. Its sets: move each one to the Legs workout of the same day (create one if missing).
  const sets: WorkoutSet[] = await t.table('sets').where('exerciseId').equals(OLD).toArray();
  for (const set of sets) {
    const from: WorkoutSession = await t.table('sessions').get(set.sessionId);
    const sameDay: WorkoutSession[] = await t.table('sessions').where('date').equals(from.date).toArray();
    let target = sameDay.find((s) => s.muscleGroupId === 'mg-legs');
    if (!target) {
      target = { ...from, id: `${from.id}-legs`, muscleGroupId: 'mg-legs' };
      await t.table('sessions').put(target);
    }
    await t.table('sets').update(set.id, { exerciseId: NEW, sessionId: target.id });
    // A Glutes workout left empty (e.g. 6/11, Abducteur only) is removed.
    if ((await t.table('sets').where('sessionId').equals(from.id).count()) === 0) await t.table('sessions').delete(from.id);
  }
}
