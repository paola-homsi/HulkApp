// Database upgrades. Each runs ONCE on a device, when the app opens with a newer schema version.
import type { Transaction } from 'dexie';

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
