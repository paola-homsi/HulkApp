// History: every workout, newest first, grouped by day. Tap an exercise to edit or remove it.
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useMuscleGroups } from '../../db/queries';
import { formatDay } from '../../lib/dates';
import { formatSets } from '../../lib/strength';
import { deleteSession } from '../../lib/workouts';
import { Empty } from '../../components/ui';
import SetSheet from '../workout/SetSheet';
import type { Exercise, WorkoutSession, WorkoutSet } from '../../types';

export default function HistoryScreen() {
  const groups = useMuscleGroups() ?? [];
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ exercise: Exercise; session: WorkoutSession } | null>(null);

  // Load everything once; the data is small (hundreds of rows), so plain arrays are fine.
  const data = useLiveQuery(async () => {
    const [sessions, sets, exercises] = await Promise.all([db.sessions.toArray(), db.sets.toArray(), db.exercises.toArray()]);
    return { sessions, sets, exercises };
  }, []);
  if (!data) return null;

  const exerciseById = new Map(data.exercises.map((e) => [e.id, e]));
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const setsBySession = new Map<string, WorkoutSet[]>();
  for (const s of data.sets) {
    if (!setsBySession.has(s.sessionId)) setsBySession.set(s.sessionId, []);
    setsBySession.get(s.sessionId)!.push(s);
  }

  const sessions = data.sessions
    .filter((s) => !groupFilter || s.muscleGroupId === groupFilter)
    .filter((s) => (setsBySession.get(s.id)?.length ?? 0) > 0)
    .sort((a, b) => b.date.localeCompare(a.date) || a.startedAt - b.startedAt);

  // Group sessions by day: [['2026-11-07', [session, session]], ...]
  const days: [string, WorkoutSession[]][] = [];
  for (const s of sessions) {
    const last = days[days.length - 1];
    if (last && last[0] === s.date) last[1].push(s);
    else days.push([s.date, [s]]);
  }

  async function onDeleteSession(s: WorkoutSession) {
    if (confirm(`Delete the whole ${groupName.get(s.muscleGroupId)} workout of ${formatDay(s.date)}?`)) await deleteSession(s.id);
  }

  return (
    <>
      <h1>History</h1>
      <div className="chips" style={{ marginBottom: 8 }}>
        <button className={`chip ${!groupFilter ? 'on' : ''}`} onClick={() => setGroupFilter(null)}>All</button>
        {groups.map((g) => (
          <button key={g.id} className={`chip ${groupFilter === g.id ? 'on' : ''}`} onClick={() => setGroupFilter(g.id)}>{g.name}</button>
        ))}
      </div>
      <p className="muted" style={{ fontSize: '0.85rem', marginTop: 0 }}>
        {sessions.length} workout{sessions.length === 1 ? '' : 's'} · tap an exercise to edit or remove it
      </p>

      {days.length === 0 && <Empty>No workouts logged yet.</Empty>}

      {days.map(([date, daySessions]) => (
        <section key={date}>
          <h3>{formatDay(date)} · {date.split('-').reverse().join('/')}</h3>
          <div className="list">
            {daySessions.map((s) => {
              const sets = setsBySession.get(s.id) ?? [];
              const exerciseIds = [...new Set([...sets].sort((a, b) => a.createdAt - b.createdAt).map((x) => x.exerciseId))];
              return (
                <div key={s.id} className="card" style={{ padding: '10px 6px 6px 14px' }}>
                  <div className="header-row" style={{ marginBottom: 2 }}>
                    <strong>{groupName.get(s.muscleGroupId) ?? 'Workout'}</strong>
                    <button className="icon-btn" aria-label="Delete workout" onClick={() => onDeleteSession(s)} style={{ color: 'var(--danger)' }}>🗑</button>
                  </div>
                  {exerciseIds.map((id) => {
                    const ex = exerciseById.get(id);
                    return (
                      <button
                        key={id}
                        className="history-line"
                        onClick={() => ex && setEditing({ exercise: ex, session: s })}
                      >
                        <span>{ex?.name ?? 'Deleted exercise'}</span>
                        <span className="muted">{formatSets(sets.filter((x) => x.exerciseId === id))}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {editing && (
        <SetSheet exercise={editing.exercise} session={editing.session} showTimer={false} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
