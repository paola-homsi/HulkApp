// Enter an amount (grams or units) for a food and see the protein live.
// Used both when adding a new entry and when editing an existing one.
import { useState } from 'react';
import { plural, proteinFor, type FoodLike } from '../../lib/protein';

export interface Amount {
  grams: number;
  units?: number;
  protein: number;
}

export default function AmountForm(props: {
  food: FoodLike;
  initialGrams?: number;
  initialUnits?: number;
  submitLabel: string;
  onSubmit: (a: Amount) => void;
}) {
  const { food } = props;
  const [mode, setMode] = useState<'units' | 'grams'>(
    food.unit && (props.initialUnits || !props.initialGrams) ? 'units' : 'grams',
  );
  const [text, setText] = useState(
    String(mode === 'units' ? props.initialUnits ?? 1 : props.initialGrams ?? 100),
  );

  const n = parseFloat(text.replace(',', '.'));
  const valid = Number.isFinite(n) && n > 0;
  const grams = !valid ? 0 : mode === 'units' && food.unit ? n * food.unit.grams : n;
  const protein = proteinFor(food.proteinPer100g, grams);

  const quick = mode === 'units' ? [1, 2, 3, 4, 6] : [50, 100, 150, 200, 250];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) props.onSubmit({ grams, units: mode === 'units' ? n : undefined, protein });
      }}
    >
      {food.unit && (
        <div className="segmented" style={{ marginBottom: 14 }}>
          <button type="button" className={mode === 'units' ? 'on' : ''} onClick={() => { setMode('units'); setText('1'); }}>
            {plural(food.unit.label, 2)}
          </button>
          <button type="button" className={mode === 'grams' ? 'on' : ''} onClick={() => { setMode('grams'); setText('100'); }}>
            grams
          </button>
        </div>
      )}

      <div className="field">
        <label htmlFor="amount">
          {mode === 'units' && food.unit ? `Number of ${plural(food.unit.label, 2)} (1 = ${food.unit.grams} g)` : 'Grams'}
        </label>
        <input
          id="amount"
          className="input"
          inputMode="decimal"
          autoFocus
          value={text}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setText(e.target.value)}
          style={{ fontSize: '1.4rem', fontWeight: 700 }}
        />
      </div>

      <div className="chips" style={{ marginBottom: 16 }}>
        {quick.map((q) => (
          <button type="button" key={q} className={`chip ${n === q ? 'on' : ''}`} onClick={() => setText(String(q))}>
            {q}{mode === 'grams' ? ' g' : ''}
          </button>
        ))}
      </div>

      <p style={{ fontSize: '1.2rem', margin: '0 0 16px' }}>
        = <strong>{protein} g protein</strong>
        <span className="muted"> · {food.proteinPer100g} g per 100 g</span>
      </p>

      <button className="btn primary" disabled={!valid}>{props.submitLabel}</button>
    </form>
  );
}
