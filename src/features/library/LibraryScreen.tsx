// Library: all muscle groups with their exercise count and validation badge.
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useMuscleGroups } from '../../db/queries';
import { checkGroupSize } from '../../lib/library';

export default function LibraryScreen() {
  const groups = useMuscleGroups() ?? [];
  const exercises = useLiveQuery(() => db.exercises.filter((e) => !e.archived).toArray(), []) ?? [];

  return (
    <>
      <h1>Exercise library</h1>
      <div className="list">
        {groups.map((g) => {
          const list = exercises.filter((e) => e.muscleGroupId === g.id);
          const check = checkGroupSize(list.length);
          return (
            <Link key={g.id} to={`/library/${g.id}`} className="row" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div className="row-main">
                <div className="row-title">{g.name}</div>
                <div className="row-sub">{list.sort((a, b) => a.order - b.order).slice(0, 3).map((e) => e.name).join(', ')}{list.length > 3 ? '…' : ''}</div>
              </div>
              <span className={`badge ${check.ok ? 'ok' : 'warn'}`}>{check.badge}</span>
            </Link>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: '0.85rem', textAlign: 'center' }}>Each group should have 6 to 9 exercises.</p>
    </>
  );
}
