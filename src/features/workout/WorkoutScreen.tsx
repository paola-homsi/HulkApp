// Workout: pick a muscle group to start, or continue today's session (checklist).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, newId } from '../../db/db';
import { getActiveSession, useExercises, useMuscleGroups } from '../../db/queries';
import { daysAgoLabel, formatDay, today } from '../../lib/dates';
import { formatSets } from '../../lib/strength';
import { Empty } from '../../components/ui';
import { RestTimer } from './RestTimer';
import SetSheet from './SetSheet';
import type { Exercise, WorkoutSession } from '../../types';

export default function WorkoutScreen() {
  // null = no active session; undefined = still loading.
  const active = useLiveQuery(async () => (await getActiveSession()) ?? null, []);
  if (active === undefined) return null;
  // Only today's unfinished session counts as "in progress". An old one is simply ignored.
  return active && active.date === today() ? <SessionView session={active} /> : <StartView />;
}

async function startWorkout(muscleGroupId: string) {
  // Close any old unfinished session first (only one active session at a time).
  const old = await getActiveSession();
  if (old) await db.sessions.update(old.id, { finishedAt: old.startedAt });
  await db.sessions.add({ id: newId(), muscleGroupId, date: today(), startedAt: Date.now() });
}

function StartView() {
  const groups = useMuscleGroups() ?? [];
  // Last training date per muscle group.
  const lastDates = useLiveQuery(async () => {
    const map: Record<string, string> = {};
    for (const s of await db.sessions.orderBy('date').toArray()) map[s.muscleGroupId] = s.date;
    return map;
  }, []) ?? {};

  return (
    <>
      <h1>Start a workout</h1>
      <p className="muted" style={{ marginTop: -6 }}>Choose today's muscle group</p>
      <div className="group-grid">
        {groups.map((g) => (
          <button key={g.id} className="group-btn" onClick={() => startWorkout(g.id)}>
            <strong>{g.name}</strong>
            <span>{lastDates[g.id] ? daysAgoLabel(lastDates[g.id]) : 'not trained yet'}</span>
          </button>
        ))}
      </div>
      <div className="spacer" />
      <Link to="/workout/not-done" className="btn">What haven't I done this week?</Link>
    </>
  );
}

function SessionView({ session }: { session: WorkoutSession }) {
  const group = useLiveQuery(() => db.muscleGroups.get(session.muscleGroupId), [session.muscleGroupId]);
  const exercises = useExercises(session.muscleGroupId) ?? [];
  const sets = useLiveQuery(() => db.sets.where('sessionId').equals(session.id).toArray(), [session.id]) ?? [];
  const [open, setOpen] = useState<Exercise | null>(null);

  const setsFor = (exerciseId: string) => sets.filter((s) => s.exerciseId === exerciseId);
  // An exercise is "done" as soon as it has at least one set in this session.
  const notDone = exercises.filter((e) => setsFor(e.id).length === 0);
  const done = exercises.filter((e) => setsFor(e.id).length > 0);

  async function finish() {
    if (sets.length === 0) {
      if (!confirm('No sets logged. Discard this workout?')) return;
      await db.sessions.delete(session.id);
      return;
    }
    await db.sessions.update(session.id, { finishedAt: Date.now() });
  }

  return (
    <>
      <div className="header-row">
        <div>
          <h1>{group?.name}</h1>
          <div className="muted">{formatDay(session.date)} · {done.length}/{exercises.length} done</div>
        </div>
        <Link to="/workout/not-done" className="btn small">Not done</Link>
      </div>

      <RestTimer />

      <h3>To do ({notDone.length})</h3>
      {notDone.length === 0 ? <Empty>All exercises done 🎉</Empty> : (
        <div className="list">
          {notDone.map((e) => (
            <button key={e.id} className="row" onClick={() => setOpen(e)}>
              <span className="status-dot" />
              <div className="row-main"><div className="row-title">{e.name}</div><div className="row-sub">Not done</div></div>
              <span className="muted">›</span>
            </button>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <>
          <h3>Done ({done.length})</h3>
          <div className="list">
            {done.map((e) => (
              <button key={e.id} className="row done" onClick={() => setOpen(e)}>
                <span className="status-dot">✓</span>
                <div className="row-main"><div className="row-title">{e.name}</div><div className="row-sub">{formatSets(setsFor(e.id))}</div></div>
                <span className="muted">›</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="spacer" />
      <button className="btn" onClick={finish}>Finish workout</button>

      {open && <SetSheet exercise={open} session={session} onClose={() => setOpen(null)} />}
    </>
  );
}
