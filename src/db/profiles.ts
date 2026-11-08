// Users ("profiles") on this device. Each user has their OWN IndexedDB database,
// so their data never mixes. The list of users and the current user are kept in localStorage.
//
// There is no password: anyone holding the phone can switch user. It separates data, it doesn't secure it.
import Dexie from 'dexie';
import { slug } from './seed';

export interface Profile {
  id: string;
  name: string;
  dbName: string; // IndexedDB database holding this user's data
  createdAt: number;
}

const PROFILES_KEY = 'fittrack.profiles';
const CURRENT_KEY = 'fittrack.currentProfile';

/** The database used before users existed. Its data belongs to Hulk. */
export const LEGACY_DB = 'fittrack';
export const HULK_ID = 'hulk';

export function listProfiles(): Profile[] {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveProfiles(profiles: Profile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function currentProfile(): Profile | undefined {
  const id = localStorage.getItem(CURRENT_KEY);
  return listProfiles().find((p) => p.id === id);
}

/** Switch user: remember the choice, then reload so the app opens that user's database. */
export function switchTo(id: string | null) {
  if (id) localStorage.setItem(CURRENT_KEY, id);
  else localStorage.removeItem(CURRENT_KEY);
  location.reload();
}

/** "Hulk" → "hulk"; if taken → "hulk-2", "hulk-3"… */
export function uniqueId(name: string, taken: string[]): string {
  const base = slug(name) || 'user';
  let id = base;
  for (let n = 2; taken.includes(id); n++) id = `${base}-${n}`;
  return id;
}

export function addProfile(name: string): Profile {
  const profiles = listProfiles();
  const id = uniqueId(name, profiles.map((p) => p.id));
  const profile: Profile = { id, name: name.trim(), dbName: `fittrack-${id}`, createdAt: Date.now() };
  saveProfiles([...profiles, profile]);
  return profile;
}

export function renameProfile(id: string, name: string) {
  saveProfiles(listProfiles().map((p) => (p.id === id ? { ...p, name: name.trim() } : p)));
}

/** Delete a user AND their whole database. */
export async function deleteProfile(id: string) {
  const p = listProfiles().find((x) => x.id === id);
  if (!p) return;
  await Dexie.delete(p.dbName);
  saveProfiles(listProfiles().filter((x) => x.id !== id));
  if (localStorage.getItem(CURRENT_KEY) === id) localStorage.removeItem(CURRENT_KEY);
}

/**
 * First launch after this update: the existing data (database "fittrack") becomes Hulk's,
 * and she is selected, so nothing changes for her.
 */
export async function initProfiles() {
  if (localStorage.getItem(PROFILES_KEY)) return;
  if (await Dexie.exists(LEGACY_DB)) {
    saveProfiles([{ id: HULK_ID, name: 'Hulk', dbName: LEGACY_DB, createdAt: Date.now() }]);
    localStorage.setItem(CURRENT_KEY, HULK_ID);
  } else {
    saveProfiles([]);
  }
}
