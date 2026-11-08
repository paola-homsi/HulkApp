// "Who's training?": choose a user or create a new one. Shown when no user is selected.
import { useState } from 'react';
import { TrackerDB } from '../../db/db';
import { DEFAULT_SETTINGS } from '../../db/seed';
import { addProfile, listProfiles, needsPin, switchTo, type Profile } from '../../db/profiles';
import PinForm from './PinForm';
import Avatar from '../../components/Avatar';

export default function ProfilePicker() {
  const profiles = listProfiles();
  const [adding, setAdding] = useState(profiles.length === 0);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [asking, setAsking] = useState<Profile | null>(null); // user whose PIN we're asking for

  // Users with a PIN must enter it first (unless remembered on this phone).
  const choose = (p: Profile) => (needsPin(p) ? setAsking(p) : switchTo(p.id));

  if (asking) {
    return (
      <main className="screen" style={{ paddingBottom: 32 }}>
        <h1 style={{ marginTop: 24 }}>Enter PIN</h1>
        <PinForm profile={asking} onUnlocked={() => switchTo(asking.id)} onCancel={() => setAsking(null)} />
      </main>
    );
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const profile = addProfile(name);
    // Create the new user's database now (starter foods & exercises) and save their body weight.
    const userDb = new TrackerDB(profile.dbName);
    await userDb.open();
    const w = parseFloat(weight.replace(',', '.'));
    if (Number.isFinite(w) && w > 0) await userDb.settings.put({ ...DEFAULT_SETTINGS, bodyWeightKg: w });
    userDb.close();
    switchTo(profile.id);
  }

  return (
    <main className="screen" style={{ paddingBottom: 32 }}>
      <h1 style={{ marginTop: 24 }}>Who's training?</h1>
      <p className="muted" style={{ marginTop: -4 }}>Each user has their own workouts, foods and settings on this phone.</p>

      <div className="list">
        {profiles.map((p) => (
          <button key={p.id} className="row" onClick={() => choose(p)} style={{ minHeight: 68 }}>
            <Avatar profile={p} size={48} />
            <div className="row-main"><div className="row-title" style={{ fontSize: '1.15rem' }}>{p.name}</div></div>
            {p.pinHash && <span className="muted" aria-label="Protected by PIN">🔒</span>}
            <span className="muted">›</span>
          </button>
        ))}
      </div>

      <div className="spacer" />
      {adding ? (
        <form className="card" onSubmit={create}>
          <h2 style={{ marginBottom: 12 }}>New user</h2>
          <div className="field">
            <label htmlFor="pn">Name</label>
            <input id="pn" className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="pw">Body weight (kg), for the protein target</label>
            <input id="pw" className="input" inputMode="decimal" placeholder={String(DEFAULT_SETTINGS.bodyWeightKg)} value={weight} onChange={(e) => setWeight(e.target.value)} />
          </div>
          <button className="btn primary" disabled={!name.trim()}>Create and start</button>
          {profiles.length > 0 && (<><div className="spacer" /><button type="button" className="btn" onClick={() => setAdding(false)}>Cancel</button></>)}
        </form>
      ) : (
        <button className="btn" onClick={() => setAdding(true)}>+ New user</button>
      )}
    </main>
  );
}
