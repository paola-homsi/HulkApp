// Line chart of one value per session (Recharts).
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useSettings } from '../../db/queries';
import { parseISODate } from '../../lib/dates';
import type { ChartPoint } from '../../lib/strength';

// SVG attributes can't read CSS variables directly, so we read the current theme colors here.
function themeColor(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const shortDate = (iso: string) =>
  parseISODate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export default function ProgressChart({ points, unit }: { points: ChartPoint[]; unit: string }) {
  useSettings(); // re-render when the theme changes
  const accent = themeColor('--accent');
  const muted = themeColor('--muted');
  const border = themeColor('--border');
  const surface = themeColor('--surface');

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={points} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={border} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} stroke={muted} fontSize={12} tickMargin={6} />
        <YAxis stroke={muted} fontSize={12} width={40} domain={['auto', 'auto']} />
        <Tooltip
          labelFormatter={(d) => shortDate(String(d))}
          formatter={(v) => [`${v} ${unit}`, '']}
          contentStyle={{ background: surface, border: `1px solid ${border}`, borderRadius: 10 }}
        />
        <Line type="monotone" dataKey="value" stroke={accent} strokeWidth={3} dot={{ r: 4, fill: accent }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
