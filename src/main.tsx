import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles.css';

// Registers the service worker that caches the app for offline use.
// With 'autoUpdate', a new version is picked up the next time the app opens.
registerSW({ immediate: true });

// Ask the browser not to evict our IndexedDB data when the phone is low on space.
navigator.storage?.persist?.();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
