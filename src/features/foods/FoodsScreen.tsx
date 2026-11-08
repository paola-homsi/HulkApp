// Food list: search, favorite (★), add, edit, delete.
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, newId } from '../../db/db';
import { normalize } from '../../lib/protein';
import { Sheet } from '../../components/ui';
import type { Food } from '../../types';

export default function FoodsScreen() {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Food | 'new' | null>(null);
  const foods = useLiveQuery(() => db.foods.orderBy('name').toArray(), []) ?? [];

  const q = normalize(query);
  const shown = foods
    .filter((f) => normalize(f.name).includes(q))
    .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || a.name.localeCompare(b.name));

  return (
    <>
      <div className="header-row">
        <h1>Foods</h1>
        <button className="btn small primary" onClick={() => setEditing('new')}>+ New</button>
      </div>
      <input className="input" placeholder="Search foods…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ marginBottom: 12 }} />

      <div className="list">
        {shown.map((f) => (
          <div key={f.id} className="row" onClick={() => setEditing(f)}>
            <button
              className="icon-btn"
              aria-label={f.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              style={{ color: f.isFavorite ? 'var(--warn)' : 'var(--muted)', fontSize: '1.4rem' }}
              onClick={(e) => { e.stopPropagation(); db.foods.update(f.id, { isFavorite: !f.isFavorite }); }}
            >
              {f.isFavorite ? '★' : '☆'}
            </button>
            <div className="row-main">
              <div className="row-title">{f.name}</div>
              <div className="row-sub">{f.unit ? `1 ${f.unit.label} = ${f.unit.grams} g` : f.isBuiltIn ? 'built-in' : 'custom'}</div>
            </div>
            <div className="row-end">{f.proteinPer100g} g</div>
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: '0.8rem', textAlign: 'center' }}>Protein per 100 g · ★ favorites appear in suggestions</p>

      {editing && <FoodForm food={editing === 'new' ? null : editing} initialName={query} onClose={() => setEditing(null)} />}
    </>
  );
}

function FoodForm(props: { food: Food | null; initialName: string; onClose: () => void }) {
  const f = props.food;
  const [name, setName] = useState(f?.name ?? props.initialName);
  const [protein, setProtein] = useState(f ? String(f.proteinPer100g) : '');
  const [hasUnit, setHasUnit] = useState(!!f?.unit);
  const [unitLabel, setUnitLabel] = useState(f?.unit?.label ?? '');
  const [unitGrams, setUnitGrams] = useState(f?.unit ? String(f.unit.grams) : '');
  const [favorite, setFavorite] = useState(f?.isFavorite ?? false);

  const p = parseFloat(protein.replace(',', '.'));
  const g = parseFloat(unitGrams.replace(',', '.'));
  const valid = name.trim() && Number.isFinite(p) && p >= 0 && (!hasUnit || (unitLabel.trim() && g > 0));

  async function save() {
    if (!valid) return;
    const food: Food = {
      id: f?.id ?? newId(),
      name: name.trim(),
      proteinPer100g: p,
      unit: hasUnit ? { label: unitLabel.trim(), grams: g } : undefined,
      isFavorite: favorite,
      isBuiltIn: f?.isBuiltIn ?? false,
    };
    await db.foods.put(food);
    props.onClose();
  }

  async function remove() {
    if (!f || !confirm(`Delete “${f.name}”? Past entries keep their values.`)) return;
    await db.foods.delete(f.id);
    props.onClose();
  }

  return (
    <Sheet open title={f ? 'Edit food' : 'New food'} onClose={props.onClose}>
      <div className="field">
        <label htmlFor="fn">Name</label>
        <input id="fn" className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="fp">Protein per 100 g</label>
        <input id="fp" className="input" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
      </div>
      <label className="check"><input type="checkbox" checked={hasUnit} onChange={(e) => setHasUnit(e.target.checked)} /> Can be counted in units (egg, scoop, slice…)</label>
      {hasUnit && (
        <div className="btn-row" style={{ marginTop: 8 }}>
          <div className="field">
            <label htmlFor="ul">Unit name</label>
            <input id="ul" className="input" placeholder="egg" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="ug">Grams per unit</label>
            <input id="ug" className="input" inputMode="decimal" value={unitGrams} onChange={(e) => setUnitGrams(e.target.value)} />
          </div>
        </div>
      )}
      <label className="check"><input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} /> Favorite ★</label>
      <div className="spacer" />
      <button className="btn primary" disabled={!valid} onClick={save}>Save</button>
      {f && (<><div className="spacer" /><button className="btn danger" onClick={remove}>Delete food</button></>)}
    </Sheet>
  );
}
