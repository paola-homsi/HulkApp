// Users ("profiles") on this device. Each user has their OWN IndexedDB database,
// so their data never mixes. The list of users and the current user are kept in localStorage.
//
// A user can have a PIN. It keeps people from casually opening someone else's data in the app,
// but it is NOT strong security: everything is stored on the phone, and there is no server.
import Dexie from 'dexie';
import { slug } from './seed';

export interface Profile {
  id: string;
  name: string;
  dbName: string; // IndexedDB database holding this user's data
  createdAt: number;
  photo?: string; // small JPEG as a data: URL, chosen from the phone (stays on this device)
  pinHash?: string; // SHA-256 of the PIN (the PIN itself is never stored)
}

export const DEFAULT_HULK_PIN = '123456789';
const UNLOCKED_KEY = 'fittrack.unlocked.'; // sessionStorage: unlocked until the app is closed
const REMEMBER_KEY = 'fittrack.rememberPin.'; // localStorage: "remember on this phone"

const PROFILES_KEY = 'fittrack.profiles';
const CURRENT_KEY = 'fittrack.currentProfile';

/** Hulk's database (the one used before users existed). */
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

// ----- PIN -----

export async function hashPin(profileId: string, pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(`hulkapp:${profileId}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const isValidPin = (pin: string) => /^\d{4,12}$/.test(pin);

export function isRemembered(p: Profile): boolean {
  return !!p.pinHash && localStorage.getItem(REMEMBER_KEY + p.id) === p.pinHash;
}

/** True when the user has a PIN that hasn't been entered yet (this session, or remembered). */
export function needsPin(p: Profile): boolean {
  if (!p.pinHash) return false;
  return sessionStorage.getItem(UNLOCKED_KEY + p.id) !== p.pinHash && !isRemembered(p);
}

/** Check the PIN. If correct, unlock for this session (and remember it on this phone if asked). */
export async function unlock(p: Profile, pin: string, remember: boolean): Promise<boolean> {
  const hash = await hashPin(p.id, pin);
  if (hash !== p.pinHash) return false;
  sessionStorage.setItem(UNLOCKED_KEY + p.id, hash);
  if (remember) localStorage.setItem(REMEMBER_KEY + p.id, hash);
  return true;
}

export function rememberOnThisPhone(p: Profile) {
  if (p.pinHash) localStorage.setItem(REMEMBER_KEY + p.id, p.pinHash);
}

export function forgetOnThisPhone(p: Profile) {
  localStorage.removeItem(REMEMBER_KEY + p.id);
}

/** Set a new PIN. Stays unlocked (and remembered, if it was) on this phone. */
export async function setPin(id: string, pin: string) {
  const p = listProfiles().find((x) => x.id === id);
  if (!p) return;
  const wasRemembered = isRemembered(p);
  const hash = await hashPin(id, pin);
  saveProfiles(listProfiles().map((x) => (x.id === id ? { ...x, pinHash: hash } : x)));
  sessionStorage.setItem(UNLOCKED_KEY + id, hash);
  if (wasRemembered) localStorage.setItem(REMEMBER_KEY + id, hash);
}

export function setProfilePhoto(id: string, photo: string | undefined) {
  saveProfiles(listProfiles().map((p) => (p.id === id ? { ...p, photo } : p)));
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
 * Hulk is built in: listed on every phone. Choosing Hulk opens the original database ("fittrack"),
 * which is filled with Hulk's gym notes the first time it's created (see db.ts → populate).
 * On the phone that already had data, that data simply becomes Hulk's and Hulk is selected.
 */
export async function initProfiles() {
  const firstRun = localStorage.getItem(PROFILES_KEY) === null;
  let profiles = listProfiles();
  if (!profiles.some((p) => p.id === HULK_ID)) {
    profiles = [{ id: HULK_ID, name: 'Hulk', dbName: LEGACY_DB, createdAt: Date.now() }, ...profiles];
  }
  // Hulk starts with the PIN 123456789 (change it in Settings → User).
  const hulk = profiles.find((p) => p.id === HULK_ID)!;
  if (!hulk.pinHash) hulk.pinHash = await hashPin(HULK_ID, DEFAULT_HULK_PIN);
  saveProfiles(profiles);
  // Phone that used the app before users existed: open straight into Hulk, as before.
  if (firstRun && (await Dexie.exists(LEGACY_DB))) localStorage.setItem(CURRENT_KEY, HULK_ID);
}
