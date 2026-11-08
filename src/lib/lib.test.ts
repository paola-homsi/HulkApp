import { describe, expect, it } from 'vitest';
import { dailyTarget, gapSuggestions, proteinFor } from './protein';
import { chartPoints, e1rm, formatSets, personalBest, prefillSet } from './strength';
import { addDays, daysBetween, startOfWeek } from './dates';
import { checkGroupSize } from './library';
import type { Food, WorkoutSet } from '../types';

const food = (name: string, p: number, unit?: Food['unit']): Food => ({ id: name, name, proteinPer100g: p, unit, isFavorite: true, isBuiltIn: true });
const set = (n: number, w: number, r: number, sessionId = 's1'): WorkoutSet => ({ id: `${sessionId}-${n}`, sessionId, exerciseId: 'e', setNumber: n, weightKg: w, reps: r, createdAt: 0 });

describe('protein', () => {
  it('computes the daily target', () => expect(dailyTarget({ bodyWeightKg: 62, proteinPerKg: 1.6 })).toBe(99));
  it('computes protein for grams', () => expect(proteinFor(31, 150)).toBe(46.5));
  it('suggests amounts that close the gap', () => {
    const s = gapSuggestions(37, [food('Chicken', 31), food('Egg', 12.6, { label: 'egg', grams: 50 }), food('Yogurt', 10)]);
    expect(s.map((x) => x.label)).toEqual(['120 g', '6 eggs', '370 g']);
  });
  it('no suggestions when target reached', () => expect(gapSuggestions(0, [food('Chicken', 31)])).toEqual([]));
});

describe('strength', () => {
  it('e1rm (Epley)', () => {
    expect(e1rm(10, 10)).toBe(13.3);
    expect(e1rm(20, 1)).toBe(20);
    expect(e1rm(0, 12)).toBe(0);
  });
  it('personal best picks heaviest, tie → more reps', () => {
    const pb = personalBest([set(1, 8, 12), set(2, 10, 6), set(3, 10, 8)]);
    expect(pb.heaviest?.reps).toBe(8);
    expect(pb.bestE1rm).toBe(12.7);
  });
  it('formats sets', () => {
    expect(formatSets([set(1, 8, 10), set(2, 8, 10), set(3, 8, 10)])).toBe('3 × 10 @ 8 kg');
    expect(formatSets([set(1, 8, 10), set(2, 9, 8)])).toBe('8×10 · 9×8');
    expect(formatSets([set(1, 3.5, 12)])).toBe('1 × 12 @ 3.5 kg');
  });
  it('prefills from last session, then from current', () => {
    const last = [set(1, 8, 10), set(2, 9, 8)];
    expect(prefillSet(1, last, [])).toEqual({ weightKg: 8, reps: 10 });
    expect(prefillSet(2, last, [set(1, 8.5, 10, 's2')])).toEqual({ weightKg: 9, reps: 8 });
    expect(prefillSet(3, last, [set(1, 8.5, 10, 's2'), set(2, 9.5, 7, 's2')])).toEqual({ weightKg: 9.5, reps: 7 });
    expect(prefillSet(1, [], [])).toEqual({ weightKg: 0, reps: 10 });
  });
  it('chart points per session', () => {
    const s = (id: string, date: string) => ({ id, muscleGroupId: 'g', date, startedAt: 0 });
    const pts = chartPoints([{ session: s('a', '2026-11-02'), sets: [set(1, 8, 10)] }, { session: s('b', '2026-11-09'), sets: [set(1, 9, 10, 'b')] }], 'top');
    expect(pts).toEqual([{ date: '2026-11-02', value: 8 }, { date: '2026-11-09', value: 9 }]);
  });
});

describe('dates', () => {
  it('week starts Monday', () => {
    expect(startOfWeek('2026-11-08')).toBe('2026-11-02'); // Sunday → Monday before
    expect(startOfWeek('2026-11-02')).toBe('2026-11-02');
  });
  it('adds days across months', () => expect(addDays('2026-10-31', 1)).toBe('2026-11-01'));
  it('days between', () => expect(daysBetween('2026-11-01', '2026-11-08')).toBe(7));
});

describe('library rules', () => {
  it('warns below 6 and above 9', () => {
    expect(checkGroupSize(5).ok).toBe(false);
    expect(checkGroupSize(6).ok).toBe(true);
    expect(checkGroupSize(9).ok).toBe(true);
    expect(checkGroupSize(10).message).toContain('Remove 1');
  });
});

describe('reps not recorded (imported notes)', () => {
  it('shows weight only', () => {
    expect(formatSets([set(1, 23, 0)])).toBe('23 kg');
    expect(formatSets([set(1, 18, 0), set(2, 25, 0)])).toBe('18 kg · 25 kg');
  });
  it('prefills 10 reps when last time had none', () => {
    expect(prefillSet(1, [set(1, 23, 0)], [])).toEqual({ weightKg: 23, reps: 10 });
  });
});
