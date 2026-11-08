// Protein math. Pure functions: no React, no database. Easy to test (see protein.test.ts).
import type { Food, FoodUnit, Settings } from '../types';

export const round1 = (n: number) => Math.round(n * 10) / 10;

export function dailyTarget(s: Pick<Settings, 'bodyWeightKg' | 'proteinPerKg'>): number {
  return Math.round(s.bodyWeightKg * s.proteinPerKg);
}

export function proteinFor(proteinPer100g: number, grams: number): number {
  return round1((proteinPer100g * grams) / 100);
}

/** Anything with a protein value and optional unit (a Food, or a past entry turned into one). */
export interface FoodLike {
  name: string;
  proteinPer100g: number;
  unit?: FoodUnit;
}

export interface Suggestion {
  food: Food;
  grams: number;
  units?: number;
  label: string; // "120 g" or "6 eggs"
}

export function plural(label: string, n: number): string {
  if (n === 1) return label;
  return /(s|sh|ch|x)$/.test(label) ? `${label}es` : `${label}s`;
}

/**
 * How much of each favorite food would close the remaining gap.
 * Grams round UP to the nearest 5 g; units round UP to a whole number.
 */
export function gapSuggestions(remaining: number, favorites: Food[]): Suggestion[] {
  if (remaining <= 0) return [];
  return favorites
    .filter((f) => f.proteinPer100g > 0)
    .map((food): Suggestion => {
      const gramsNeeded = (remaining * 100) / food.proteinPer100g;
      if (food.unit) {
        const units = Math.ceil(gramsNeeded / food.unit.grams);
        return { food, units, grams: units * food.unit.grams, label: `${units} ${plural(food.unit.label, units)}` };
      }
      const grams = Math.ceil(gramsNeeded / 5) * 5;
      return { food, grams, label: `${grams} g` };
    })
    .filter((s) => s.grams <= 1500); // hide unrealistic amounts
}

/** Turn a search query and name into a comparable form: lowercase, no accents. */
export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
