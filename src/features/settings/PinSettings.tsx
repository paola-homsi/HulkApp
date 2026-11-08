// Settings → PIN: set or change the PIN, and remember it on this phone.
import { useState } from 'react';
import {
  currentProfile, forgetOnThisPhone, hashPin, isRemembered, isValidPin, rememberOnThisPhone, setPin,
} from '../../db/profiles';

export default function PinSettings() {
  const [profile, setProfile] = useState(currentProfile()!);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [msg, setMsg] = useState('');
  const hasPin = !!profile.pinHash;
  const digits = (v: string) => v.replace(/\D/g, '');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (hasPin && (await hashPin(profile.id, current)) !== profile.pinHash) return setMsg('Current PIN is wrong.');
    if (!isValidPin(next)) return setMsg('The new PIN must be 4 to 12 digits.');
    if (next !== repeat) return setMsg("The two new PINs don't match.");
    await setPin(profile.id, next);
    setProfile(currentProfile()!);
    setOpen(false); setCurrent(''); setNext(''); setRepeat('');
    setMsg('PIN saved ✓');
  }

  return (
    <>
      <div className="spacer" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span>🔒 PIN: <strong>{hasPin ? 'on' : 'off'}</strong></span>
        <button className="btn small" onClick={() => { setOpen(!open); setMsg(''); }}>{hasPin ? 'Change PIN' : 'Set a PIN'}</button>
      </div>

      {open && (
        <form onSubmit={save} style={{ marginTop: 12 }}>
          {hasPin && (
            <div className="field">
              <label htmlFor="pc">Current PIN</label>
              <input id="pc" className="input" type="password" inputMode="numeric" value={current} onChange={(e) => setCurrent(digits(e.target.value))} />
            </div>
          )}
          <div className="field">
            <label htmlFor="pnew">New PIN (4–12 digits)</label>
            <input id="pnew" className="input" type="password" inputMode="numeric" value={next} onChange={(e) => setNext(digits(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="prep">Repeat new PIN</label>
            <input id="prep" className="input" type="password" inputMode="numeric" value={repeat} onChange={(e) => setRepeat(digits(e.target.value))} />
          </div>
          <button className="btn primary">Save PIN</button>
        </form>
      )}

      {hasPin && (
        <label className="check">
          <input
            type="checkbox"
            checked={isRemembered(profile)}
            onChange={(e) => { if (e.target.checked) rememberOnThisPhone(profile); else forgetOnThisPhone(profile); setProfile({ ...profile }); }}
          />
          Remember PIN on this phone
        </label>
      )}
      {msg && <p style={{ margin: '6px 0 0', fontWeight: 600 }}>{msg}</p>}
      <p className="muted" style={{ fontSize: '0.8rem', margin: '6px 0 0' }}>
        A new PIN applies to this phone only. On other phones, the old PIN stays until you change it there.
      </p>
    </>
  );
}
