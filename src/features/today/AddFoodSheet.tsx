// Add a food entry: search → pick → amount → add.
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, newId } from '../../db/db';
import { normalize } from '../../lib/protein';
import { Sheet } from '../../components/ui';
import AmountForm, { type Amount } from './AmountForm';
import type { Food } from '../../types';

export async function addEntry(date: string, food: Food, a: Amount) {
  await db.foodEntries.add({
    id: newId(),
    date,
    foodId: food.id,
    foodName: food.name,
    grams: a.grams,
    units: a.units,
    protein: a.protein,
    createdAt: Date.now(),
  });
}

export default function AddFoodSheet(props: { date: string; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Food | null>(null);
  const [newProtein, setNewProtein] = useState('');

  const foods = useLiveQuery(() => db.foods.toArray(), []) ?? [];
  // Recently used food ids, most recent first (from the last 60 entries).
  const recentIds = useLiveQuery(async () => {
    const recent = await db.foodEntries.orderBy('date').reverse().limit(60).toArray();
    return [...new Set(recent.sort((a, b) => b.createdAt - a.createdAt).map((e) => e.foodId))];
  }, []) ?? [];

  // Ranking: favorites first, then recently used, then alphabetical.
  const rank = (f: Food) => (f.isFavorite ? 0 : 1000) + (recentIds.includes(f.id) ? recentIds.indexOf(f.id) : 500);
  const q = normalize(query);
  const results = foods
    .filter((f) => (q ? normalize(f.name).includes(q) : f.isFavorite || recentIds.includes(f.id)))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name))
    .slice(0, 8);

  async function createFood() {
    const protein = parseFloat(newProtein.replace(',', '.'));
    if (!query.trim() || !Number.isFinite(protein)) return;
    const food: Food = { id: newId(), name: query.trim(), proteinPer100g: protein, isFavorite: false, isBuiltIn: false };
    await db.foods.add(food);
    setPicked(food);
  }

  return (
    <Sheet open title={picked ? picked.name : 'Add food'} onClose={props.onClose}>
      {picked ? (
        <>
          <AmountForm
            food={picked}
            submitLabel="Add"
            onSubmit={async (a) => {
              await addEntry(props.date, picked, a);
              props.onClose();
            }}
          />
          <button className="link-btn" onClick={() => setPicked(null)}>← Choose another food</button>
        </>
      ) : (
        <>
          <input
            className="input"
            placeholder="Search food… (e.g. chicken)"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          {!q && results.length > 0 && <h3 style={{ marginTop: 0 }}>Favorites & recent</h3>}
          <div className="list">
            {results.map((f) => (
              <button key={f.id} className="row" onClick={() => setPicked(f)}>
                <div className="row-main">
                  <div className="row-title">{f.isFavorite ? '★ ' : ''}{f.name}</div>
                  <div className="row-sub">
                    {f.proteinPer100g} g / 100 g{f.unit ? ` · 1 ${f.unit.label} = ${f.unit.grams} g` : ''}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {q && results.length === 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              <p style={{ marginTop: 0 }}>No food called “{query.trim()}”. Create it:</p>
              <div className="field">
                <label htmlFor="np">Protein per 100 g</label>
                <input id="np" className="input" inputMode="decimal" value={newProtein} onChange={(e) => setNewProtein(e.target.value)} />
              </div>
              <button className="btn primary" onClick={createFood} disabled={!newProtein}>Create and log</button>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
