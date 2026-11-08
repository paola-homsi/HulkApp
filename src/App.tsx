import { useEffect } from 'react';
import { HashRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useSettings } from './db/queries';
import { TodayIcon, WorkoutIcon, LibraryIcon, FoodsIcon, SettingsIcon } from './components/icons';
import TodayScreen from './features/today/TodayScreen';
import FoodsScreen from './features/foods/FoodsScreen';
import LibraryScreen from './features/library/LibraryScreen';
import GroupEditor from './features/library/GroupEditor';
import WorkoutScreen from './features/workout/WorkoutScreen';
import NotDoneView from './features/workout/NotDoneView';
import ExerciseDetail from './features/exercise/ExerciseDetail';
import SettingsScreen from './features/settings/SettingsScreen';

const TABS = [
  { to: '/today', label: 'Today', Icon: TodayIcon },
  { to: '/workout', label: 'Workout', Icon: WorkoutIcon },
  { to: '/library', label: 'Library', Icon: LibraryIcon },
  { to: '/foods', label: 'Foods', Icon: FoodsIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export default function App() {
  const { theme } = useSettings();

  // Apply the theme: styles.css switches colors based on <html data-theme="...">.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f1115' : '#f5f6f8');
  }, [theme]);

  // HashRouter (URLs like #/today) works on any static host without server config.
  return (
    <HashRouter>
      <main className="screen">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayScreen />} />
          <Route path="/workout" element={<WorkoutScreen />} />
          <Route path="/workout/not-done" element={<NotDoneView />} />
          <Route path="/library" element={<LibraryScreen />} />
          <Route path="/library/:groupId" element={<GroupEditor />} />
          <Route path="/exercise/:exerciseId" element={<ExerciseDetail />} />
          <Route path="/foods" element={<FoodsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <nav className="tabbar">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </HashRouter>
  );
}
