// Log sets for one exercise in the current session.
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, newId } from '../../db/db';
import { useExerciseHistory, useSettings } from '../../db/queries';
import { formatDay } from '../../lib/dates';
import { fmtKg, formatBest, formatSets, personalBest, prefillSet } from '../../lib/strength';
import { Sheet, Stepper } from '../../components/ui';
import { RestTimer } from './RestTimer';
import type { Exercise, WorkoutSession } from '../../types';

export default function SetSheet(props: {
  exercise: Exercise;
  session: WorkoutSession;
  onClose: () => void;
}) {
  const { exercise, session } = props;
  const { weightStepKg } = useSettings();
  const history = useExerciseHistory(exercise.id) ?? [];
  const sets = useLiveQuery(
    () => db.sets.where('sessionId').equals(session.id).filter((s) => s.exerciseId === exercise.id).sortBy('setNumber'),
    [session.id, exercise.id],
  ) ?? [];

  const past = history.filter((h) => h.session.id !== session.id);
  const last = past[past.length - 1];
  const pb = personalBest(past.flatMap((h) => h.sets));

  async function addSet() {
    const setNumber = sets.length + 1;
    const values = prefillSet(setNumber, last?.sets ?? [], sets);
    await db.sets.add({ id: newId(), sessionId: session.id, exerciseId: exercise.id, setNumber, ...values, createdAt: Date.now() });
  }

  async function deleteSet(id: string) {
    await db.sets.delete(id);
    // Renumber the remaining sets 1, 2, 3…
    const rest = sets.filter((s) => s.id !== id);
    await Promise.all(rest.map((s, i) => db.sets.update(s.id, { setNumber: i + 1 })));
  }

  return (
    <Sheet open title={exercise.name} onClose={props.onClose}>
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">Last time{last ? ` · ${formatDay(last.session.date)}` : ''}</div>
          <div className="stat-value">{last ? formatSets(last.sets) : '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Personal best</div>
          <div className="stat-value">
            {pb.heaviest && pb.heaviest.weightKg > 0
              ? formatBest(pb.heaviest)
              : pb.maxReps > 0 ? `${pb.maxReps} reps` : '—'}
          </div>
          {pb.bestE1rm > 0 && <div className="stat-label">est. 1RM {fmtKg(pb.bestE1rm)}</div>}
        </div>
      </div>

      <div className="spacer" />
      <RestTimer />

      {sets.map((s) => (
        <div key={s.id} className="set-row">
          <span className="set-num">{s.setNumber}</span>
          <Stepper label="kg" value={s.weightKg} step={weightStepKg} onChange={(v) => db.sets.update(s.id, { weightKg: v })} />
          <Stepper label="reps" value={s.reps} step={1} onChange={(v) => db.sets.update(s.id, { reps: Math.round(v) })} />
          <button className="icon-btn" aria-label={`Delete set ${s.setNumber}`} onClick={() => deleteSet(s.id)} style={{ marginBottom: 4 }}>✕</button>
        </div>
      ))}

      <div className="spacer" />
      <button className="btn primary" onClick={addSet}>
        + Set{sets.length === 0 && last ? ' (from last time)' : ''}
      </button>
      <div className="spacer" />
      <div className="btn-row">
        <Link to={`/exercise/${exercise.id}`} className="btn">📈 Progress</Link>
        <button className="btn" onClick={props.onClose}>Done</button>
      </div>
    </Sheet>
  );
}
