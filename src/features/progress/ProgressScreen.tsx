// Progress per muscle group: how each exercise moved from its first session to its latest.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useExercises, useMuscleGroups } from '../../db/queries';
import { daysAgoLabel } from '../../lib/dates';
import { exerciseProgress, type ExerciseSession } from '../../lib/strength';
import { Empty } from '../../components/ui';
import Sparkline from '../../components/Sparkline';

export default function ProgressScreen() {
  const groups = useMuscleGroups() ?? [];
  const [picked, setPicked] = useState<string | null>(null);
  const groupId = picked ?? groups[0]?.id;
  const exercises = useExercises(groupId) ?? [];

  // All sessions of this group, with their sets.
  const sessions = useLiveQuery(async () => {
    if (!groupId) return [];
    const list = (await db.sessions.where('muscleGroupId').equals(groupId).toArray())
      .sort((a, b) => a.date.localeCompare(b.date) || a.startedAt - b.startedAt);
    const sets = await db.sets.where('sessionId').anyOf(list.map((s) => s.id)).toArray();
    return list.map((session) => ({ session, sets: sets.filter((s) => s.sessionId === session.id) }));
  }, [groupId]) ?? [];

  const done = sessions.filter((s) => s.sets.length > 0);
  const rows = exercises.map((ex) => {
    const history: ExerciseSession[] = done
      .map((h) => ({ session: h.session, sets: h.sets.filter((s) => s.exerciseId === ex.id) }))
      .filter((h) => h.sets.length > 0);
    return { ex, p: exerciseProgress(history) };
  });

  const measurable = rows.filter((r) => r.p.points.length >= 2 && r.p.hasData);
  const improved = measurable.filter((r) => (r.p.change ?? 0) > 0).length;
  const pcts = measurable.map((r) => r.p.changePct).filter((n): n is number => n !== undefined);
  const avgPct = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : undefined;

  return (
    <>
      <h1>Progress</h1>
      <div className="chips" style={{ marginBottom: 14 }}>
        {groups.map((g) => (
          <button key={g.id} className={`chip ${g.id === groupId ? 'on' : ''}`} onClick={() => setPicked(g.id)}>{g.name}</button>
        ))}
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">Workouts</div>
          <div className="stat-value">{done.length}</div>
          <div className="stat-label">last: {daysAgoLabel(done[done.length - 1]?.session.date)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Exercises improved</div>
          <div className="stat-value">{measurable.length ? `${improved} of ${measurable.length}` : '—'}</div>
          {avgPct !== undefined && (
            <div className="stat-label">average {avgPct >= 0 ? '+' : ''}{avgPct}% since first session</div>
          )}
        </div>
      </div>

      <h3>Exercises · first → latest</h3>
      {rows.length === 0 && <Empty>No exercises in this group.</Empty>}
      <div className="list">
        {rows.map(({ ex, p }) => {
          const trend = p.change === undefined || p.points.length < 2 ? 'flat' : p.change > 0 ? 'up' : p.change < 0 ? 'down' : 'flat';
          return (
            <Link key={ex.id} to={`/exercise/${ex.id}`} className="row" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div className="row-main">
                <div className="row-title">{ex.name}</div>
                <div className="row-sub">
                  {p.points.length === 0 && 'Not done yet'}
                  {p.points.length > 0 && !p.hasData && `${p.points.length} session${p.points.length > 1 ? 's' : ''} · no weight recorded`}
                  {p.points.length === 1 && p.hasData && `${p.last} ${p.unit} · 1 session`}
                  {p.points.length >= 2 && p.hasData && (
                    <>
                      {p.first} → {p.last} {p.unit}{' '}
                      <span className={`trend-${trend}`}>
                        {p.change === 0
                          ? 'no change'
                          : `${p.change! > 0 ? '+' : ''}${p.change} ${p.unit}${p.changePct !== undefined ? ` (${p.changePct > 0 ? '+' : ''}${p.changePct}%)` : ''}`}
                      </span>
                      {' · '}{p.points.length} sessions
                    </>
                  )}
                </div>
              </div>
              <span style={{ color: 'var(--accent)' }}><Sparkline values={p.points.map((x) => x.value)} /></span>
            </Link>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: '0.8rem' }}>Based on the heaviest set of each session (reps for bodyweight exercises). Tap an exercise for its full chart.</p>
    </>
  );
}
