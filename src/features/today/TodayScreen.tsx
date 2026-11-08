// Today: protein progress, gap suggestions and the food log for the chosen day.
import { useCallback, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useSettings } from '../../db/queries';
import { addDays, formatDay, today } from '../../lib/dates';
import { dailyTarget, gapSuggestions, plural, round1, type FoodLike } from '../../lib/protein';
import { Empty, ProgressBar, Sheet, Toast } from '../../components/ui';
import AddFoodSheet, { addEntry } from './AddFoodSheet';
import AmountForm from './AmountForm';
import type { FoodEntry } from '../../types';

export default function TodayScreen() {
  const settings = useSettings();
  const [date, setDate] = useState(today());
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [deleted, setDeleted] = useState<FoodEntry | null>(null);
  const clearToast = useCallback(() => setDeleted(null), []);

  const entries = useLiveQuery(() => db.foodEntries.where('date').equals(date).sortBy('createdAt'), [date]) ?? [];
  const foods = useLiveQuery(() => db.foods.toArray(), []) ?? [];

  const target = dailyTarget(settings);
  const eaten = round1(entries.reduce((sum, e) => sum + e.protein, 0));
  const remaining = round1(Math.max(0, target - eaten));
  const suggestions = gapSuggestions(remaining, foods.filter((f) => f.isFavorite));

  async function remove(entry: FoodEntry) {
    await db.foodEntries.delete(entry.id);
    setEditing(null);
    setDeleted(entry);
  }

  // Rebuild a "food" from an entry so editing uses the protein value it was logged with.
  function foodFromEntry(e: FoodEntry): FoodLike {
    const food = foods.find((f) => f.id === e.foodId);
    const unit = e.units ? { label: food?.unit?.label ?? 'unit', grams: e.grams / e.units } : food?.unit;
    return { name: e.foodName, proteinPer100g: e.grams > 0 ? round1((e.protein / e.grams) * 100) : 0, unit };
  }

  const isToday = date === today();

  return (
    <>
      <div className="header-row">
        <button className="icon-btn" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>‹</button>
        <h1 style={{ flex: 1, textAlign: 'center' }} onClick={() => setDate(today())}>{formatDay(date)}</h1>
        <button className="icon-btn" aria-label="Next day" disabled={isToday} onClick={() => setDate(addDays(date, 1))} style={{ opacity: isToday ? 0.3 : 1 }}>›</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <span className="big-number">{eaten}</span>
            <span className="muted"> / {target} g protein</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            {remaining > 0 ? (
              <><strong>{remaining} g</strong><div className="muted" style={{ fontSize: '0.85rem' }}>to go</div></>
            ) : (
              <strong style={{ color: 'var(--success)' }}>Target reached ✓</strong>
            )}
          </div>
        </div>
        <ProgressBar value={eaten} max={target} />
      </div>

      {suggestions.length > 0 && (
        <>
          <h3>Close the gap with</h3>
          <div className="chips">
            {suggestions.map((s) => (
              <button
                key={s.food.id}
                className="chip"
                title="Tap to log"
                onClick={() => addEntry(date, s.food, { grams: s.grams, units: s.units, protein: round1((s.food.proteinPer100g * s.grams) / 100) })}
              >
                {s.label} {s.units ? "" : s.food.name}
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: '0.8rem', margin: '6px 0 0' }}>Each option alone covers what's left. Tap one to log it.</p>
        </>
      )}

      <div className="spacer" />
      <button className="btn primary" onClick={() => setAdding(true)}>+ Add food</button>

      <h3>Eaten {isToday ? 'today' : 'this day'}</h3>
      {entries.length === 0 ? (
        <Empty>Nothing logged yet.</Empty>
      ) : (
        <div className="list">
          {entries.map((e) => (
            <button key={e.id} className="row" onClick={() => setEditing(e)}>
              <div className="row-main">
                <div className="row-title">{e.foodName}</div>
                <div className="row-sub">
                  {e.units ? `${e.units} ${plural(foodFromEntry(e).unit?.label ?? 'unit', e.units)} · ` : ''}{round1(e.grams)} g
                </div>
              </div>
              <div className="row-end">{e.protein} g</div>
            </button>
          ))}
        </div>
      )}

      {adding && <AddFoodSheet date={date} onClose={() => setAdding(false)} />}

      <Sheet open={!!editing} title={editing?.foodName ?? ''} onClose={() => setEditing(null)}>
        {editing && (
          <>
            <AmountForm
              food={foodFromEntry(editing)}
              initialGrams={editing.grams}
              initialUnits={editing.units}
              submitLabel="Save"
              onSubmit={async (a) => {
                await db.foodEntries.update(editing.id, { grams: a.grams, units: a.units, protein: a.protein });
                setEditing(null);
              }}
            />
            <div className="spacer" />
            <button className="btn danger" onClick={() => remove(editing)}>Delete entry</button>
          </>
        )}
      </Sheet>

      {deleted && (
        <Toast
          message={`Deleted ${deleted.foodName}`}
          actionLabel="Undo"
          onAction={() => db.foodEntries.add(deleted)}
          onDone={clearToast}
        />
      )}
    </>
  );
}
