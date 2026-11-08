// Enter a user's PIN, with "Remember on this phone".
import { useState } from 'react';
import { unlock, type Profile } from '../../db/profiles';
import Avatar from '../../components/Avatar';

export default function PinForm(props: { profile: Profile; onUnlocked: () => void; onCancel?: () => void; cancelLabel?: string }) {
  const { profile } = props;
  const [pin, setPin] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (await unlock(profile, pin, remember)) props.onUnlocked();
    else {
      setError('Wrong PIN, try again.');
      setPin('');
    }
  }

  return (
    <form className="card" onSubmit={submit} style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><Avatar profile={profile} size={72} /></div>
      <h2 style={{ marginBottom: 14 }}>{profile.name}</h2>
      <input
        className="input pin-input"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        placeholder="PIN"
        aria-label={`PIN for ${profile.name}`}
        value={pin}
        onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
      />
      {error && <p style={{ color: 'var(--danger)', margin: '8px 0 0', fontWeight: 600 }}>{error}</p>}
      <label className="check" style={{ justifyContent: 'center' }}>
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember on this phone
      </label>
      <button className="btn primary" disabled={pin.length < 4}>Unlock</button>
      {props.onCancel && (<><div className="spacer" /><button type="button" className="btn" onClick={props.onCancel}>{props.cancelLabel ?? 'Cancel'}</button></>)}
    </form>
  );
}
