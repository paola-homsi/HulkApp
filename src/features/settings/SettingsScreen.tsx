// Settings: body weight, protein target, theme, backup.
import { useRef, useState } from 'react';
import { updateSettings, useSettings } from '../../db/queries';
import { dailyTarget } from '../../lib/protein';
import { downloadJson, exportAll, importAll, parseBackup, summarize, type BackupFile } from '../../lib/backup';
import { today } from '../../lib/dates';
import { Sheet, Stepper } from '../../components/ui';
import { db } from '../../db/db';
import { hasMyHistory, loadMyHistory } from '../../db/migrations';
import { HULK_ID, currentProfile, deleteProfile, renameProfile, switchTo } from '../../db/profiles';

export default function SettingsScreen() {
  const s = useSettings();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [message, setMessage] = useState('');
  const profile = currentProfile()!;
  const [userName, setUserName] = useState(profile.name);

  async function onDeleteUser() {
    const typed = prompt(`This deletes ${profile.name} and ALL their data on this phone. Type the name to confirm:`);
    if (typed?.trim() !== profile.name) return;
    await deleteProfile(profile.id);
    switchTo(null);
  }

  async function onExport() {
    downloadJson(await exportAll(), `hulkapp-${profile.id}-${today()}.json`);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      setPending(parseBackup(await file.text()));
    } catch (err) {
      setMessage((err as Error).message);
    }
    if (fileInput.current) fileInput.current.value = '';
  }

  // Safety net: if the phone ever clears the app's storage, this puts the gym notes back.
  async function restoreHistory() {
    const tables = [db.muscleGroups, db.exercises, db.sessions, db.sets];
    const done = await db.transaction('rw', tables, async () => {
      if (await hasMyHistory(db)) return false;
      await loadMyHistory(db);
      return true;
    });
    setMessage(done ? 'Gym history restored ✓' : 'Your gym history is already in the app ✓');
  }

  async function confirmImport() {
    if (!pending) return;
    await importAll(pending);
    setPending(null);
    setMessage('Import complete ✓');
  }

  return (
    <>
      <h1>Settings</h1>

      <h3>User</h3>
      <div className="card">
        <div className="field">
          <label htmlFor="un">Name</label>
          <input id="un" className="input" value={userName} onChange={(e) => setUserName(e.target.value)}
            onBlur={() => userName.trim() && renameProfile(profile.id, userName)} />
        </div>
        <button className="btn danger" onClick={onDeleteUser}>Delete this user and their data</button>
      </div>

      <h3>Protein target</h3>
      <div className="card">
        <Stepper label="Body weight" suffix="kg" value={s.bodyWeightKg} step={0.5} onChange={(v) => updateSettings({ bodyWeightKg: v })} />
        <div className="spacer" />
        <Stepper label="Protein per kg of body weight" suffix="g/kg" value={s.proteinPerKg} step={0.1} onChange={(v) => updateSettings({ proteinPerKg: v })} />
        <p style={{ margin: '14px 0 0' }}>
          Daily target: <strong>{dailyTarget(s)} g protein</strong>
          <span className="muted"> ({s.bodyWeightKg} × {s.proteinPerKg})</span>
        </p>
      </div>

      <h3>Workout</h3>
      <div className="card">
        <Stepper label="Weight +/− step" suffix="kg" value={s.weightStepKg} step={0.5} min={0.5} onChange={(v) => updateSettings({ weightStepKg: v })} />
      </div>

      <h3>Appearance</h3>
      <div className="segmented">
        <button className={s.theme === 'dark' ? 'on' : ''} onClick={() => updateSettings({ theme: 'dark' })}>🌙 Dark</button>
        <button className={s.theme === 'light' ? 'on' : ''} onClick={() => updateSettings({ theme: 'light' })}>☀️ Light</button>
      </div>

      <h3>Backup</h3>
      <div className="list">
        <button className="btn" onClick={onExport}>⬇ Export all data (JSON)</button>
        <button className="btn" onClick={() => fileInput.current?.click()}>⬆ Import from backup…</button>
        {profile.id === HULK_ID && (
          <button className="btn" onClick={restoreHistory}>↺ Restore Hulk's gym notes (13/10 – 7/11)</button>
        )}
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {message && <p style={{ textAlign: 'center' }}>{message}</p>}
      <p className="muted" style={{ fontSize: '0.85rem' }}>
        Data of this user only. It stays on this phone. Export a backup now and then, and before changing phones.
      </p>

      <Sheet open={!!pending} title="Import backup?" onClose={() => setPending(null)}>
        {pending && (
          <>
            <p>This file contains {summarize(pending)}.</p>
            <p className="warning-box">Importing replaces ALL data currently in the app.</p>
            <button className="btn primary" onClick={confirmImport}>Replace my data</button>
            <div className="spacer" />
            <button className="btn" onClick={() => setPending(null)}>Cancel</button>
          </>
        )}
      </Sheet>
    </>
  );
}
