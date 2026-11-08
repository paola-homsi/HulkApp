import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import ProfilePicker from './features/profiles/ProfilePicker';
import { openDatabase } from './db/db';
import { currentProfile, initProfiles } from './db/profiles';
import './styles.css';

// Registers the service worker that caches the app for offline use.
// With 'autoUpdate', a new version is picked up the next time the app opens.
registerSW({ immediate: true });

// Ask the browser not to evict our IndexedDB data when the phone is low on space.
navigator.storage?.persist?.();

async function start() {
  // Which user? If none is chosen yet, show the "Who's training?" screen.
  await initProfiles();
  const profile = currentProfile();
  if (profile) openDatabase(profile.dbName);

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>{profile ? <App /> : <ProfilePicker />}</React.StrictMode>,
  );
}

start();
