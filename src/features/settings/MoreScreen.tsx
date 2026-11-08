// "More" tab: the screens you use less often.
import { Link } from 'react-router-dom';
import { currentProfile, setProfilePhoto, switchTo } from '../../db/profiles';
import Avatar from '../../components/Avatar';

const ITEMS = [
  { to: '/library', title: 'Exercise library', sub: 'Muscle groups and exercises: add, rename, reorder' },
  { to: '/foods', title: 'Foods', sub: 'Protein per 100 g, units, favorites' },
  { to: '/settings', title: 'Settings', sub: 'Body weight, protein target, theme, backup' },
];

export default function MoreScreen() {
  const profile = currentProfile()!;
  return (
    <>
      <h1>More</h1>
      <div className="row" style={{ cursor: 'default', marginBottom: 16 }}>
        <Avatar profile={profile} size={56} editable />
        <div className="row-main">
          <div className="row-title">{profile.name}</div>
          <div className="row-sub">
            Tap the picture to change it
            {profile.photo && (<> · <button className="link-btn" style={{ padding: 0 }} onClick={() => { setProfilePhoto(profile.id, undefined); location.reload(); }}>remove</button></>)}
          </div>
        </div>
        <button className="btn small" onClick={() => switchTo(null)}>Switch user</button>
      </div>
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
