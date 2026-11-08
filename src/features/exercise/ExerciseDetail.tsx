// One exercise: last session, personal best, progression chart and full history.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useExerciseHistory } from '../../db/queries';
import { formatDay } from '../../lib/dates';
import { chartPoints, fmtKg, formatBest, formatSets, personalBest, type ChartMetric } from '../../lib/strength';
import { Empty } from '../../components/ui';
import ProgressChart from './ProgressChart';

export default function ExerciseDetail() {
  const { exerciseId = '' } = useParams();
  const navigate = useNavigate();
  const exercise = useLiveQuery(() => db.exercises.get(exerciseId), [exerciseId]);
  const history = useExerciseHistory(exerciseId) ?? [];
  const allSets = history.flatMap((h) => h.sets);
  const pb = personalBest(allSets);
  const last = history[history.length - 1];
  const bodyweight = allSets.length > 0 && allSets.every((s) => s.weightKg === 0);

  // Est. 1RM needs reps. If no set has reps recorded, only the top-set weight is meaningful.
  const hasReps = allSets.some((s) => s.reps > 0);
  const [metric, setMetric] = useState<ChartMetric>('top');
  const shownMetric: ChartMetric = bodyweight ? 'reps' : hasReps ? metric : 'top';
  const points = chartPoints(history, shownMetric);

  return (
    <>
      <button className="link-btn" onClick={() => navigate(-1)}>← Back</button>
      <h1>{exercise?.name}</h1>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">Last session{last ? ` · ${formatDay(last.session.date)}` : ''}</div>
          <div className="stat-value">{last ? formatSets(last.sets) : '—'}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Personal best</div>
          <div className="stat-value">
            {pb.heaviest && pb.heaviest.weightKg > 0 ? formatBest(pb.heaviest) : pb.maxReps ? `${pb.maxReps} reps` : '—'}
          </div>
          {pb.bestE1rm > 0 && <div className="stat-label">est. 1RM {fmtKg(pb.bestE1rm)}</div>}
        </div>
      </div>

      <h3>Progress</h3>
      {!bodyweight && hasReps && (
        <div className="segmented" style={{ marginBottom: 12 }}>
          <button className={metric === 'e1rm' ? 'on' : ''} onClick={() => setMetric('e1rm')}>Est. 1RM</button>
          <button className={metric === 'top' ? 'on' : ''} onClick={() => setMetric('top')}>Top set</button>
        </div>
      )}
      {points.length < 2 ? (
        <Empty>{points.length === 0 ? 'No sessions yet.' : 'Log one more session to see the chart.'}</Empty>
      ) : (
        <div className="card" style={{ padding: '12px 4px 4px 0' }}>
          <ProgressChart points={points} unit={shownMetric === 'reps' ? 'reps' : 'kg'} />
        </div>
      )}
      <p className="muted" style={{ fontSize: '0.8rem' }}>
        {shownMetric === 'e1rm' && 'Estimated 1-rep max (Epley): weight × (1 + reps ÷ 30), best set of each session.'}
        {shownMetric === 'top' && 'Heaviest weight lifted in each session.'}
        {shownMetric === 'reps' && 'Bodyweight exercise: most reps in a set, per session.'}
      </p>

      <h3>History</h3>
      {history.length === 0 ? <Empty>No sets logged yet.</Empty> : (
        <div className="list">
          {[...history].reverse().map((h) => (
            <div key={h.session.id} className="row" style={{ cursor: 'default' }}>
              <div className="row-main">
                <div className="row-title">{formatDay(h.session.date)}</div>
                <div className="row-sub">{formatSets(h.sets)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
