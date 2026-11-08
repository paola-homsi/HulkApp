// "More" tab: the screens you use less often.
import { Link } from 'react-router-dom';

const ITEMS = [
  { to: '/library', title: 'Exercise library', sub: 'Muscle groups and exercises: add, rename, reorder' },
  { to: '/foods', title: 'Foods', sub: 'Protein per 100 g, units, favorites' },
  { to: '/settings', title: 'Settings', sub: 'Body weight, protein target, theme, backup' },
];

export default function MoreScreen() {
  return (
    <>
      <h1>More</h1>
      <div className="list">
        {ITEMS.map((i) => (
          <Link key={i.to} to={i.to} className="row" style={{ color: 'inherit', textDecoration: 'none' }}>
            <div className="row-main">
              <div className="row-title">{i.title}</div>
              <div className="row-sub">{i.sub}</div>
            </div>
            <span className="muted">›</span>
          </Link>
        ))}
      </div>
    </>
  );
}
