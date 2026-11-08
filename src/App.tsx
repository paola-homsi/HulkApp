import { useEffect } from 'react';
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useSettings } from './db/queries';
import { TodayIcon, WorkoutIcon, HistoryIcon, ProgressIcon, MoreIcon } from './components/icons';
import TodayScreen from './features/today/TodayScreen';
import FoodsScreen from './features/foods/FoodsScreen';
import LibraryScreen from './features/library/LibraryScreen';
import GroupEditor from './features/library/GroupEditor';
import WorkoutScreen from './features/workout/WorkoutScreen';
import NotDoneView from './features/workout/NotDoneView';
import ExerciseDetail from './features/exercise/ExerciseDetail';
import SettingsScreen from './features/settings/SettingsScreen';
import MoreScreen from './features/settings/MoreScreen';
import HistoryScreen from './features/history/HistoryScreen';
import ProgressScreen from './features/progress/ProgressScreen';

// Each tab is highlighted for its own path and for the screens listed in `also`.
const TABS = [
  { to: '/today', label: 'Today', Icon: TodayIcon, also: [] as string[] },
  { to: '/workout', label: 'Workout', Icon: WorkoutIcon, also: [] },
  { to: '/history', label: 'History', Icon: HistoryIcon, also: [] },
  { to: '/progress', label: 'Progress', Icon: ProgressIcon, also: ['/exercise'] },
  { to: '/more', label: 'More', Icon: MoreIcon, also: ['/library', '/foods', '/settings'] },
];

function TabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="tabbar">
      {TABS.map(({ to, label, Icon, also }) => {
        const active = [to, ...also].some((p) => pathname.startsWith(p));
        return (
          <NavLink key={to} to={to} className={`tab ${active ? 'active' : ''}`}>
            <Icon />
            <span>{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

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
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/progress" element={<ProgressScreen />} />
          <Route path="/more" element={<MoreScreen />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
      <TabBar />
    </HashRouter>
  );
}
