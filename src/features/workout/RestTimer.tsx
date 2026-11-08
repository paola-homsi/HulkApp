// 30-second rest timer: Start / Stop only. Vibrates and beeps when it reaches 0.
//
// The timer state lives in this module (not inside a component), so it keeps running
// when you close the set sheet or open another screen.
import { useEffect, useState, useSyncExternalStore } from 'react';

const REST_SECONDS = 30;

// ---- the store ----
// We keep the END time, not a counter, so the timer stays correct even if the phone
// slows the page down in the background.
let state = { endsAt: null as number | null, finished: false };
let doneTimeout: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function setState(next: typeof state) {
  state = next;
  listeners.forEach((l) => l());
}

function start() {
  clearTimeout(doneTimeout);
  const endsAt = Date.now() + REST_SECONDS * 1000;
  doneTimeout = setTimeout(() => {
    setState({ endsAt: null, finished: true });
    alertDone();
  }, REST_SECONDS * 1000);
  setState({ endsAt, finished: false });
}

function stop() {
  clearTimeout(doneTimeout);
  setState({ endsAt: null, finished: false });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function alertDone() {
  navigator.vibrate?.([250, 120, 250]);
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    /* sound not available: vibration only */
  }
}

// ---- the hook components use ----
export interface RestTimerState {
  secondsLeft: number;
  running: boolean;
  finished: boolean;
  start: () => void;
  stop: () => void;
}

export function useRestTimer(): RestTimerState {
  const { endsAt, finished } = useSyncExternalStore(subscribe, () => state);
  const [now, setNow] = useState(Date.now());

  // Re-render a few times per second while running, to update the countdown.
  useEffect(() => {
    if (endsAt === null) return;
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(tick);
  }, [endsAt]);

  const secondsLeft = finished ? 0 : endsAt === null ? REST_SECONDS : Math.max(0, Math.ceil((endsAt - now) / 1000));
  return { secondsLeft, running: endsAt !== null, finished, start, stop };
}

export function RestTimer() {
  const timer = useRestTimer();
  return (
    <div className={`timer ${timer.running ? 'running' : ''} ${timer.finished ? 'finished' : ''}`}>
      <span className="muted" style={{ fontSize: '0.85rem' }}>Rest</span>
      <span className="timer-time">
        {timer.finished ? 'Go! 💪' : `0:${String(timer.secondsLeft).padStart(2, '0')}`}
      </span>
      {timer.running ? (
        <button className="btn" onClick={timer.stop}>Stop</button>
      ) : (
        <button className="btn primary" onClick={timer.start}>Start</button>
      )}
    </div>
  );
}
