// Date helpers. We store local calendar days as 'YYYY-MM-DD' strings.

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: string): string {
  const d = parseISODate(iso);
  const dayFromMonday = (d.getDay() + 6) % 7; // Sunday=6, Monday=0
  return addDays(iso, -dayFromMonday);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86_400_000);
}

export function formatDay(iso: string, now = today()): string {
  const diff = daysBetween(iso, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return parseISODate(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function daysAgoLabel(iso: string | undefined, now = today()): string {
  if (!iso) return 'never';
  const diff = daysBetween(iso, now);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return `${diff} days ago`;
}
