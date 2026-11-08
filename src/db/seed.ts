import type { Transaction } from 'dexie';
import type { Exercise, Food, MuscleGroup, Settings } from '../types';

export const DEFAULT_SETTINGS: Settings = {
  id: 'singleton',
  bodyWeightKg: 62,
  proteinPerKg: 1.6,
  weightStepKg: 0.5,
  theme: 'dark',
};

// [name, protein per 100 g, unit?, favorite?]  Values are typical, cooked weight unless noted.
type FoodRow = [string, number, { label: string; grams: number }?, boolean?];

const FOODS: FoodRow[] = [
  ['Chicken breast', 31, undefined, true],
  ['Turkey breast', 29],
  ['Lean beef mince 5%', 26],
  ['Salmon', 25],
  ['Tuna (canned, water)', 25, undefined, true],
  ['Shrimp', 24],
  ['Egg', 12.6, { label: 'egg', grams: 50 }, true],
  ['Egg whites', 11],
  ['Greek yogurt 0%', 10, undefined, true],
  ['Skyr', 11],
  ['Cottage cheese', 11],
  ['Milk', 3.4, { label: 'glass', grams: 250 }],
  ['Emmental', 28],
  ['Mozzarella', 22],
  ['Whey protein', 80, { label: 'scoop', grams: 30 }],
  ['Tofu (firm)', 15],
  ['Lentils', 9],
  ['Chickpeas', 9],
  ['Oats (dry)', 13],
  ['Wholemeal bread', 9, { label: 'slice', grams: 35 }],
  ['Pasta', 5.8],
  ['Rice', 2.7],
  ['Quinoa', 4.4],
  ['Almonds', 21],
  ['Peanut butter', 25, { label: 'tbsp', grams: 16 }],
];

const GROUPS: [string, string[]][] = [
  ['Arms', ['Dumbbell curl', 'Hammer curl', 'Preacher curl', 'Cable triceps pushdown', 'Overhead triceps extension', 'Bench dips']],
  ['Chest', ['Bench press', 'Incline dumbbell press', 'Push-ups', 'Machine chest fly', 'Cable crossover', 'Dumbbell pullover']],
  ['Back', ['Lat pulldown', 'Seated cable row', 'One-arm dumbbell row', 'Assisted pull-up', 'Back extension', 'Face pull']],
  ['Legs', ['Goblet squat', 'Leg press', 'Romanian deadlift', 'Leg extension', 'Leg curl', 'Walking lunges', 'Calf raise']],
  ['Shoulders', ['Dumbbell shoulder press', 'Lateral raise', 'Front raise', 'Rear delt fly', 'Arnold press', 'Upright row']],
  ['Abs', ['Crunches', 'Hanging knee raise', 'Lying leg raise', 'Russian twist', 'Cable crunch', 'Dead bug']],
  ['Glutes', ['Hip thrust', 'Glute bridge', 'Cable kickback', 'Bulgarian split squat', 'Hip abduction machine', 'Step-ups']],
];

// Stable, readable ids for built-in data ("food-chicken-breast", "mg-arms", "ex-arms-hammer-curl").
export const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function builtInFoods(): Food[] {
  return FOODS.map(([name, protein, unit, fav]) => ({
    id: `food-${slug(name)}`,
    name,
    proteinPer100g: protein,
    unit,
    isFavorite: !!fav,
    isBuiltIn: true,
  }));
}

export function builtInLibrary(): { groups: MuscleGroup[]; exercises: Exercise[] } {
  const groups: MuscleGroup[] = [];
  const exercises: Exercise[] = [];
  GROUPS.forEach(([groupName, names], gi) => {
    const groupId = `mg-${slug(groupName)}`;
    groups.push({ id: groupId, name: groupName, order: gi });
    names.forEach((name, i) =>
      exercises.push({ id: `ex-${slug(groupName)}-${slug(name)}`, muscleGroupId: groupId, name, order: i, archived: false }),
    );
  });
  return { groups, exercises };
}

export async function seedDatabase(tx: Transaction) {
  const { groups, exercises } = builtInLibrary();
  await tx.table('settings').add(DEFAULT_SETTINGS);
  await tx.table('foods').bulkAdd(builtInFoods());
  await tx.table('muscleGroups').bulkAdd(groups);
  await tx.table('exercises').bulkAdd(exercises);
}
