// "Not yet done": for a muscle group, which exercises are missing
// (a) in the current session and (b) this week (Monday–Sunday).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getActiveSession, useExercises, useMuscleGroups } from '../../db/queries';
import { daysAgoLabel, startOfWeek, today } from '../../lib/dates';
import { Empty } from '../../components/ui';

export default function NotDoneView() {
  const groups = useMuscleGroups() ?? [];
  const active = useLiveQuery(async () => (await getActiveSession()) ?? null, []);
  const current = active && active.date === today() ? active : null;
  const [picked, setPicked] = useState<string | null>(null);
  const groupId = picked ?? current?.muscleGroupId ?? groups[0]?.id;

  const exercises = useExercises(groupId) ?? [];

  // For each exercise of this group: last date done, and whether done in the current session.
  const info = useLiveQuery(async () => {
    if (!groupId) return null;
    const sessions = await db.sessions.where('muscleGroupId').equals(groupId).toArray();
    const dateOf = new Map(sessions.map((s) => [s.id, s.date]));
    const sets = await db.sets.where('sessionId').anyOf([...dateOf.keys()]).toArray();
    const lastDone: Record<string, string> = {};
    const inCurrent = new Set<string>();
    for (const set of sets) {
      const d = dateOf.get(set.sessionId)!;
      if (!lastDone[set.exerciseId] || d > lastDone[set.exerciseId]) lastDone[set.exerciseId] = d;
      if (current && set.sessionId === current.id) inCurrent.add(set.exerciseId);
    }
    return { lastDone, inCurrent };
  }, [groupId, current?.id]);

  const weekStart = startOfWeek(today());
  const notThisWeek = exercises.filter((e) => !info?.lastDone[e.id] || info.lastDone[e.id] < weekStart);
  const sessionIsThisGroup = current?.muscleGroupId === groupId;
  const notInSession = sessionIsThisGroup ? exercises.filter((e) => !info?.inCurrent.has(e.id)) : [];

  return (
    <>
      <Link to="/workout" className="link-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>← Workout</Link>
      <h1>Not yet done</h1>
      <div className="chips">
        {groups.map((g) => (
          <button key={g.id} className={`chip ${g.id === groupId ? 'on' : ''}`} onClick={() => setPicked(g.id)}>{g.name}</button>
        ))}
      </div>

      <h3>In the current session</h3>
      {!sessionIsThisGroup ? (
        <Empty>No {groups.find((g) => g.id === groupId)?.name ?? ''} workout in progress today.</Empty>
      ) : notInSession.length === 0 ? (
        <Empty>Everything done 🎉</Empty>
      ) : (
        <div className="list">
          {notInSession.map((e) => (
            <div key={e.id} className="row"><span className="status-dot" /><div className="row-main"><div className="row-title">{e.name}</div></div></div>
          ))}
        </div>
      )}

      <h3>This week (since Monday)</h3>
      {notThisWeek.length === 0 ? (
        <Empty>All done this week 🎉</Empty>
      ) : (
        <div className="list">
          {notThisWeek.map((e) => (
            <div key={e.id} className="row">
              <span className="status-dot" />
              <div className="row-main">
                <div className="row-title">{e.name}</div>
                <div className="row-sub">Last done: {daysAgoLabel(info?.lastDone[e.id])}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
