// Small shared UI pieces.
import { useEffect, useState, type ReactNode } from 'react';
import { round1 } from '../lib/protein';

/** Number field with big − / + buttons. Typing is allowed too (opens the number keypad). */
export function Stepper(props: {
  label: string;
  value: number;
  step: number;
  min?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const { label, value, step, min = 0, suffix, onChange } = props;
  // Local text lets you type "3." without it being reformatted mid-typing.
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const commit = (v: number) => onChange(Math.max(min, round1(v)));

  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <div className="stepper-row">
        <button type="button" className="step-btn" aria-label={`Decrease ${label}`} onClick={() => commit(value - step)}>−</button>
        <input
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value.replace(',', '.'))}
          onBlur={() => {
            const n = parseFloat(text);
            if (Number.isFinite(n)) commit(n);
            else setText(String(value));
          }}
          onFocus={(e) => e.target.select()}
        />
        {suffix && <span className="stepper-suffix">{suffix}</span>}
        <button type="button" className="step-btn" aria-label={`Increase ${label}`} onClick={() => commit(value + step)}>+</button>
      </div>
    </div>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className={`progress-fill ${pct >= 100 ? 'complete' : ''}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Panel that slides up from the bottom of the screen. */
export function Sheet(props: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!props.open) return null;
  return (
    <div className="sheet-backdrop" onClick={props.onClose}>
      <div className="sheet" role="dialog" aria-label={props.title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h2>{props.title}</h2>
          <button className="icon-btn" aria-label="Close" onClick={props.onClose}>✕</button>
        </div>
        <div className="sheet-body">{props.children}</div>
      </div>
    </div>
  );
}

/** Bottom message with an optional action (used for Undo). Disappears after 5 s. */
export function Toast(props: { message: string; actionLabel?: string; onAction?: () => void; onDone: () => void }) {
  const { onDone } = props;
  useEffect(() => {
    const t = setTimeout(onDone, 5000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast">
      <span>{props.message}</span>
      {props.actionLabel && (
        <button className="toast-action" onClick={() => { props.onAction?.(); onDone(); }}>{props.actionLabel}</button>
      )}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}
