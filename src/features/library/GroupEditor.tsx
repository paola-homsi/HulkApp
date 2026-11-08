// Edit one muscle group: add, rename, reorder (↑ ↓), delete exercises.
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useExercises } from '../../db/queries';
import { addExercise, checkGroupSize, deleteExercise, moveExercise } from '../../lib/library';
import type { Exercise } from '../../types';

export default function GroupEditor() {
  const { groupId = '' } = useParams();
  const group = useLiveQuery(() => db.muscleGroups.get(groupId), [groupId]);
  const exercises = useExercises(groupId) ?? [];
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);

  const check = checkGroupSize(exercises.length);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await addExercise(groupId, newName);
    setNewName('');
  }

  async function onDelete(ex: Exercise) {
    if (confirm(`Delete “${ex.name}”? Its workout history is kept.`)) await deleteExercise(groupId, ex.id);
  }

  return (
    <>
      <Link to="/library" className="link-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>← Library</Link>
      <div className="header-row">
        <h1>{group?.name}</h1>
        <span className={`badge ${check.ok ? 'ok' : 'warn'}`}>{check.badge}</span>
      </div>
      {check.message && <div className="warning-box">⚠ {check.message}</div>}

      <div className="list">
        {exercises.map((ex, i) => (
          <div key={ex.id} className="row compact" style={{ cursor: "default", paddingRight: 4 }}>
            <div className="row-main">
              {renaming === ex.id ? (
                <RenameField
                  initial={ex.name}
                  onDone={async (name) => {
                    if (name) await db.exercises.update(ex.id, { name });
                    setRenaming(null);
                  }}
                />
              ) : (
                <button className="row-title" style={{ background: 'none', border: 'none', padding: '8px 0', textAlign: 'left', width: '100%', cursor: 'pointer' }} onClick={() => setRenaming(ex.id)}>
                  {ex.name}
                </button>
              )}
            </div>
            <Link to={`/exercise/${ex.id}`} className="icon-btn" aria-label="Progress" style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}>📈</Link>
            <button className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => moveExercise(groupId, ex.id, -1)} style={{ opacity: i === 0 ? 0.25 : 1 }}>↑</button>
            <button className="icon-btn" aria-label="Move down" disabled={i === exercises.length - 1} onClick={() => moveExercise(groupId, ex.id, 1)} style={{ opacity: i === exercises.length - 1 ? 0.25 : 1 }}>↓</button>
            <button className="icon-btn" aria-label="Delete" onClick={() => onDelete(ex)} style={{ color: 'var(--danger)' }}>🗑</button>
          </div>
        ))}
      </div>
      <p className="muted" style={{ fontSize: '0.8rem' }}>Tap a name to rename it.</p>

      <form onSubmit={onAdd} className="btn-row" style={{ marginTop: 12 }}>
        <input className="input" placeholder="New exercise name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ flex: 2 }} />
        <button className="btn primary" disabled={!newName.trim()}>Add</button>
      </form>
    </>
  );
}

function RenameField({ initial, onDone }: { initial: string; onDone: (name: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onDone(value.trim()); }}>
      <input className="input" autoFocus value={value} onChange={(e) => setValue(e.target.value)} onBlur={() => onDone(value.trim())} />
    </form>
  );
}
