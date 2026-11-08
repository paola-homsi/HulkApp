# FitTrack: Workout & Protein Tracker

A personal, offline-first PWA for logging protein and gym workouts.
React + TypeScript + Vite. Data is stored on the phone in IndexedDB (via Dexie). No backend, no login.

## Run it

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm test         # unit tests for the calculation functions
npm run build    # production build in dist/
npm run preview  # serve the production build locally
```

To try it on your phone while developing: `npm run dev -- --host`, then open the
"Network" URL on your phone (same Wi-Fi). Installing as an app requires HTTPS (see Deploy).

## How the code is organized

```
src/
  types.ts           Data shapes. One interface = one table.
  db/
    db.ts            Database schema (Dexie). Tables + indexed fields.
    seed.ts          Built-in foods, muscle groups and exercises (loaded on first launch).
    queries.ts       Reusable data hooks: useSettings, useExercises, useExerciseHistory…
  lib/               Logic, no UI. Read these to understand the rules.
    protein.ts       Daily target, protein per entry, "close the gap" suggestions.
    strength.ts      Estimated 1RM, personal best, chart points, set prefill.
    library.ts       6–9 exercise rule, reorder, add, delete/archive.
    dates.ts         Day strings, week start (Monday), "3 days ago".
    backup.ts        Export / import JSON.
    lib.test.ts      Unit tests for the above.
  components/        Shared UI: Stepper (− value +), ProgressBar, Sheet (bottom panel), Toast.
  features/          One folder per screen.
    today/           Today screen, Add food sheet, Amount form.
    foods/           Food list + food editor.
    library/         Muscle groups + group editor.
    workout/         Start / session checklist, set logging, rest timer, "Not yet done".
    exercise/        Exercise detail with chart.
    settings/        Weight, target, step, theme, backup.
  App.tsx            Routes + bottom tab bar + theme.
  main.tsx           Entry point. Registers the service worker (offline).
  styles.css         All styling. Colors are CSS variables at the top (dark + light).
```

### Three ideas to know

1. **Screens read data with `useLiveQuery`.** It re-runs when the data changes, so after
   `db.sets.add(...)` every screen showing sets updates by itself. There's no global state store.
2. **Rules live in `lib/`, appearance lives in `features/`.** To change how suggestions are
   rounded, edit `lib/protein.ts`. To change how the Today screen looks, edit `features/today/`.
3. **Computed values are never stored.** PB, "done", the target and chart points are calculated from
   the raw sets and entries, so nothing can get out of sync. The one exception is on purpose:
   food entries keep a snapshot of the name and protein, so editing a food doesn't rewrite your history.

### Common changes

| I want to… | Edit |
|---|---|
| Change the colors | `styles.css`, the variables at the top |
| Change the rest timer length | `REST_SECONDS` in `features/workout/RestTimer.tsx` |
| Change the 6–9 exercise rule | `MIN_EXERCISES` / `MAX_EXERCISES` in `lib/library.ts` |
| Change the default foods/exercises | `db/seed.ts` (only applies to a fresh install) |
| Add a field to a table | `types.ts`, then add `this.version(2).stores({...})` in `db/db.ts` |

## Deploy (GitHub Pages, free)

1. Create a GitHub repo and push this folder to the `main` branch.
2. In the repo, go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Every push to `main` builds, tests and publishes it (see `.github/workflows/deploy.yml`).
   The site appears at `https://<username>.github.io/<repo>/`.
4. On your phone, open that URL. On Android/Chrome, use **Add to Home screen / Install app**.
   On iPhone/Safari, use **Share → Add to Home Screen**.

## Backup

Settings → **Export all data** downloads a JSON file. **Import** replaces all data with a backup.
Data lives only on the device, so export now and then.
