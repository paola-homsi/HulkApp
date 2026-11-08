// Strength math: estimated 1RM, personal bests, chart data. Pure functions.
import type { WorkoutSession, WorkoutSet } from '../types';
import { round1 } from './protein';

/** One session of one exercise: the session plus that exercise's sets in it. */
export interface ExerciseSession {
  session: WorkoutSession;
  sets: WorkoutSet[];
}

/** Epley formula: estimated one-rep max = weight × (1 + reps / 30). */
export function e1rm(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return round1(weightKg * (1 + reps / 30));
}

/** Heaviest set; on a tie, the one with more reps. */
export function topSet(sets: WorkoutSet[]): WorkoutSet | undefined {
  return [...sets].sort((a, b) => b.weightKg - a.weightKg || b.reps - a.reps)[0];
}

export interface PersonalBest {
  heaviest?: WorkoutSet;
  bestE1rm: number;
  maxReps: number;
}

export function personalBest(sets: WorkoutSet[]): PersonalBest {
  return {
    heaviest: topSet(sets),
    bestE1rm: Math.max(0, ...sets.map((s) => e1rm(s.weightKg, s.reps))),
    maxReps: Math.max(0, ...sets.map((s) => s.reps)),
  };
}

export type ChartMetric = 'e1rm' | 'top' | 'reps';

export interface ChartPoint {
  date: string;
  value: number;
}

/** One point per session, oldest first. */
export function chartPoints(history: ExerciseSession[], metric: ChartMetric): ChartPoint[] {
  return history
    .filter((h) => h.sets.length > 0)
    .map((h) => {
      const pb = personalBest(h.sets);
      const value =
        metric === 'e1rm' ? pb.bestE1rm : metric === 'top' ? pb.heaviest?.weightKg ?? 0 : pb.maxReps;
      return { date: h.session.date, value };
    })
    // Sessions without recorded reps have no 1RM estimate: leave them out of that chart.
    .filter((p) => metric !== 'e1rm' || p.value > 0);
}

export const fmtKg = (n: number) => `${round1(n)} kg`;

/**
 * "3 × 10 @ 8 kg" when all sets match, otherwise "8×10 · 9×8 · 9×6".
 * Bodyweight shows reps only. reps = 0 means "reps not recorded" and shows the weight only.
 */
export function formatSets(sets: WorkoutSet[]): string {
  if (sets.length === 0) return 'No sets';
  const sorted = [...sets].sort((a, b) => a.setNumber - b.setNumber);
  const first = sorted[0];
  const allSame = sorted.every((s) => s.weightKg === first.weightKg && s.reps === first.reps);
  const one = (s: WorkoutSet) =>
    s.reps === 0 ? fmtKg(s.weightKg) : s.weightKg > 0 ? `${round1(s.weightKg)}×${s.reps}` : `${s.reps} reps`;
  if (allSame && first.reps === 0) return sorted.length > 1 ? `${sorted.length} × ${fmtKg(first.weightKg)}` : fmtKg(first.weightKg);
  if (allSame) {
    return first.weightKg > 0
      ? `${sorted.length} × ${first.reps} @ ${fmtKg(first.weightKg)}`
      : `${sorted.length} × ${first.reps} reps`;
  }
  return sorted.map(one).join(' · ');
}

/** "8 kg × 12", or "8 kg" when reps weren't recorded. */
export function formatBest(set: WorkoutSet): string {
  return set.reps > 0 ? `${fmtKg(set.weightKg)} × ${set.reps}` : fmtKg(set.weightKg);
}

/**
 * Values for a new set, copied from the last session:
 * set N copies last session's set N; otherwise the last set entered today; otherwise defaults.
 */
export function prefillSet(
  setNumber: number,
  lastSessionSets: WorkoutSet[],
  currentSets: WorkoutSet[],
): { weightKg: number; reps: number } {
  const last = [...lastSessionSets].sort((a, b) => a.setNumber - b.setNumber);
  const current = [...currentSets].sort((a, b) => a.setNumber - b.setNumber);
  const source = last[setNumber - 1] ?? current[current.length - 1] ?? last[last.length - 1];
  // reps = 0 means reps weren't recorded; suggest 10 instead.
  return source ? { weightKg: source.weightKg, reps: source.reps || 10 } : { weightKg: 0, reps: 10 };
}
