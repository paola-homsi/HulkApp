// Settings: body weight, protein target, theme, backup.
import { useRef, useState } from 'react';
import { updateSettings, useSettings } from '../../db/queries';
import { dailyTarget } from '../../lib/protein';
import { downloadJson, exportAll, importAll, parseBackup, summarize, type BackupFile } from '../../lib/backup';
import { today } from '../../lib/dates';
import { Sheet, Stepper } from '../../components/ui';

export default function SettingsScreen() {
  const s = useSettings();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [message, setMessage] = useState('');

  async function onExport() {
    downloadJson(await exportAll(), `fittrack-backup-${today()}.json`);
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

  async function confirmImport() {
    if (!pending) return;
    await importAll(pending);
    setPending(null);
    setMessage('Import complete ✓');
  }

  return (
    <>
      <h1>Settings</h1>

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
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
      {message && <p style={{ textAlign: 'center' }}>{message}</p>}
      <p className="muted" style={{ fontSize: '0.85rem' }}>
        Your data stays on this phone only. Export a backup now and then, and before changing phones.
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
