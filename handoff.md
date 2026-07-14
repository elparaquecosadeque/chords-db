# Handoff: Babel Removal, Angular UI, GitHub Pages & npm Package

**Created:** 2026-07-13 16:03 CDT  
**Branch:** `master`  
**Session Duration:** ~1.5 hours  

---

## Summary

This session modernized the `chords-db` library (removing Babel in favor of native Node.js ESM), built a full Angular 22 chord diagram viewer UI (`chords-ui/`), wired up GitHub Pages deployment via GitHub Actions, and prepared the library for npm publishing as `@gblp/chords-db`. All changes are committed and pushed; the GH Pages action is live.

---

## Work Completed

### Changes Made

- [x] Removed all Babel dependencies (`@babel/cli`, `@babel/core`, `@babel/node`, `@babel/preset-env`)
- [x] Added `"type": "module"` to `package.json` — native ESM
- [x] Replaced `babel-node` with `node` in build/stdout scripts
- [x] Fixed `__dirname` → `import.meta.dirname` in `src/generate.js`
- [x] Bulk-added `.js` extensions to all relative imports across `src/`
- [x] Fixed directory imports (`./guitar` → `./guitar/index.js`, `./chords` → `./chords/index.js`)
- [x] Renamed all files/dirs containing `#` to `sharp` (e.g. `7#9.js` → `7sharp9.js`, `C#/` → `Csharp/`)
- [x] URL-encoded `#` → `sharp` in all import paths
- [x] Fixed Jest script: `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js src`
- [x] Fixed JSON import in `piano.test.js` using `createRequire`
- [x] Scaffolded Angular 22 app at `chords-ui/` (standalone, no routing, CSS)
- [x] Built `chord-diagram.component.ts` — inline SVG fretboard renderer
- [x] Built `piano-diagram.component.ts` — inline SVG piano keyboard renderer
- [x] Built `app.ts` with Angular signals, `HttpClient` for lazy JSON loading
- [x] Built `app.html` — instrument tabs, key pills, chord card grid
- [x] Copied `lib/*.json` to `chords-ui/public/data/` for Angular asset serving
- [x] Added `chords-ui/dist`, `chords-ui/node_modules`, `chords-ui/.angular` to root `.gitignore`
- [x] Created `.github/workflows/pages.yml` — GitHub Actions deploy to GH Pages
- [x] Fixed GH Pages URL bug: changed `/data/${name}.json` → `data/${name}.json` (relative, respects `<base href>`)
- [x] Created root `index.js` — named ESM exports for `guitar`, `ukulele`, `piano`, `instruments`
- [x] Updated `package.json` for npm: name `@gblp/chords-db`, `files`, `exports`, `publishConfig`, `prepublishOnly`
- [x] Updated `README.md`: live demo link, CI badge, install/usage docs

### Key Decisions

| Decision | Rationale | Alternatives Considered |
|---|---|---|
| Drop Babel, use native ESM | Node 24 supports ESM natively; Babel was only transpiling `import/export` | Keep Babel, upgrade Babel |
| Rename `#` files to `sharp` | `#` in ESM URL paths is treated as a fragment separator, breaking both Node and Jest | URL-encode as `%23` (Node works, Jest breaks); use `createRequire` workaround |
| Angular assets via `public/data/` + relative URL | Simplest way to serve JSON; `data/` (no leading slash) respects `<base href>` for GH Pages | Import JSON at build time (huge bundle), separate API server |
| `createRequire` for JSON in `index.js` | Works in all Node ESM versions (18+) without import attributes flag | `with { type: 'json' }` import attributes (Node 22+ only) |
| `prepublishOnly` not `prepublish` | `prepublish` runs on `npm install` too (unexpected side-effect) | Keep `prepublish` |

---

## Files Affected

### Created

- `index.js` — root npm entry point; re-exports `guitar`, `ukulele`, `piano`, `instruments` via `createRequire`
- `.github/workflows/pages.yml` — CI/CD: builds chord data → Angular app → deploys to GH Pages
- `chords-ui/` — full Angular 22 app (scaffolded + all components written)
  - `src/app/chord-diagram.component.ts` — SVG fretboard diagram component
  - `src/app/piano-diagram.component.ts` — SVG piano keyboard component
  - `src/app/app.ts` — main component (signals state, HTTP data loading)
  - `src/app/app.html` — app template
  - `src/app/app.css` — app styles
  - `src/app/app.config.ts` — added `provideHttpClient()`
  - `public/data/guitar.json`, `ukulele.json`, `piano.json`, `instruments.json` — static assets

### Modified

- `package.json` — name → `@gblp/chords-db`; version → `1.0.0`; removed Babel deps; added `type: module`, `files`, `exports`, `publishConfig`, updated URLs, `prepublishOnly`
- `src/generate.js` — `__dirname` → `import.meta.dirname`; all imports got `.js` extensions
- `src/db.js` — updated instrument imports to explicit `./db/guitar/index.js` paths
- `src/db/guitar.test.js`, `ukulele.test.js`, `piano.test.js` — `.js` extensions; directory → `index.js` paths; piano uses `createRequire` for JSON
- `src/db/guitar/index.js`, `ukulele/index.js`, `piano/index.js` — `./chords.js` → `./chords/index.js`
- `src/db/guitar/chords/index.js`, `ukulele/chords/index.js`, `piano/chords/index.js` — key subdirs use explicit `index.js`
- All `src/db/*/chords/[KEY]/index.js` files — `#` → `sharp` in import paths
- `src/tools.js` — `.js` extensions on all relative imports
- `.gitignore` — added `chords-ui/dist`, `chords-ui/node_modules`, `chords-ui/.angular`
- `README.md` — rewrote: added badge, live demo link, install docs, usage examples, local run instructions

### Deleted / Renamed (on disk)

- All files and directories with `#` in name renamed: `#` → `sharp`
  - `src/db/guitar/chords/C#/` → `Csharp/`
  - `src/db/guitar/chords/F#/` → `Fsharp/`
  - Same for piano
  - Per-key chord files: `7#9.js` → `7sharp9.js`, `9#11.js` → `9sharp11.js`, `maj7#5.js` → `maj7sharp5.js`, `_C#.js` → `_Csharp.js`, `_F#.js` → `_Fsharp.js`, etc.
  - Ukulele additionally: `7b9#5.js` → `7b9sharp5.js`, `b13#9.js` → `b13sharp9.js`

---

## Technical Context

### Architecture / Design Notes

**ESM migration gotchas:**  
1. Node ESM requires explicit `.js` extensions on all relative imports — no auto-resolution.  
2. Directory imports (`./foo`) don't auto-resolve to `./foo/index.js` in ESM — must be explicit.  
3. `#` in filenames is a URL fragment separator in ESM — breaks both `node` (loader) and Jest (resolver). Renaming to `sharp` fixes both.  
4. Jest 30 with ESM requires `--experimental-vm-modules` passed to Node directly (not via `NODE_OPTIONS=` env syntax, which doesn't work on Windows `cmd.exe`).

**Data key mismatch:**  
The JSON `chords` object uses `Csharp`/`Fsharp` as property keys (because the source export variables are named `Csharp`/`Fsharp`), but `data.keys` still contains `"C#"`/`"F#"`. The Angular UI handles this with `toChordKey(k) => k.replace('#', 'sharp')`. This is a known inconsistency — see Known Issues below.

**Angular chord diagram SVG math:**  
- Constants: `CW=26` (string spacing), `CH=28` (fret spacing), `PT=44` (top pad), `PL=28` (left pad for baseFret label), `DR=10` (dot radius)
- `stringX(i) = PL + i * CW`
- `dotCY(fret) = PT + (fret - 0.5) * CH`
- Barre: drawn from min→max string index where `frets[i] === barre`; individual dots skipped for barre fret value

**GH Pages base-href:**  
Angular built with `--base-href /chords-db/`. HTTP calls use `data/${name}.json` (relative, no leading slash) so the browser resolves them against `<base href>` — works in both dev (`/`) and prod (`/chords-db/`).

### Dependencies

- Removed: `@babel/cli`, `@babel/core`, `@babel/node`, `@babel/preset-env`
- No new runtime dependencies added
- Angular app has its own `chords-ui/package.json` (Angular 22, standalone)

### Configuration Changes

- `package.json`: `"type": "module"` — all `.js` files in repo are now ESM
- Jest runs via `node --experimental-vm-modules` (not via PATH shim on Windows)
- GH Pages: must be set to **GitHub Actions** source in repo Settings → Pages

---

## Things to Know

### Gotchas & Pitfalls

- **Windows + npm scripts**: `KEY=value command` env syntax doesn't work on Windows. Used `node --experimental-vm-modules node_modules/jest-cli/bin/jest.js src` instead of `NODE_OPTIONS=... jest`.
- **`#` in ESM filenames**: Any future chord files with `#` in name must use `sharp` instead. The suffix *data value* (e.g. `suffix: '7#9'`) is fine — only filenames/import paths are affected.
- **Barre rendering**: The chord diagram skips individual dots for any fret in the `barres` array, drawing only the barre bar instead. This means a string at a barre fret with a different finger assignment won't show a separate dot — this matches standard chord diagram conventions.
- **Piano octave range**: `piano-diagram.component.ts` shows octaves 3–4 (MIDI 48–71). Chords with notes outside this range won't be highlighted. Adjust `START_OCTAVE` and `OCTAVES` constants if needed.

### Assumptions Made

- Node 18+ for package consumers (uses `createRequire` for JSON loading in `index.js`)
- GH Pages source set to "GitHub Actions" in repo settings (not branch-based)
- npm user `gblp` has already run `npm login` before publishing

### Known Issues

- **Key name mismatch in JSON**: `data.chords` uses `Csharp`/`Fsharp` as keys but `data.keys` has `C#`/`F#`. This is a cosmetic inconsistency caused by the `#`→`sharp` filename rename. Could be fixed in `generate.js` by forcing the chord object keys to use the actual key name (e.g., normalizing the export object). Low priority since the UI handles it transparently.
- **Commit messages**: All session commits were pushed with generic message `"master"` — history is not descriptive.
- **`lib/readme.md`**: An extra `readme.md` file exists in `lib/` (from original repo). It's harmless but gets included in the npm pack.

---

## Current State

### What's Working

- [x] All 48,751 tests pass: `npm test`
- [x] Build generates `lib/*.json`: `npm run build`
- [x] Angular UI builds clean: `cd chords-ui && npm run build`
- [x] Angular UI dev server: `cd chords-ui && npm start` → `http://localhost:4200`
- [x] GH Pages live at `https://elparaquecosadeque.github.io/chords-db/`
- [x] GitHub Actions workflow deploys on every push to `master`
- [x] `npm pack --dry-run` shows correct 9 files, 64kB
- [x] `index.js` exports work: `import { guitar } from '@gblp/chords-db'`

### What's Not Working

- Piano chords with notes outside MIDI 48–71 (octaves 3–4) won't show highlighted keys in the piano diagram

### Tests

- [x] Unit tests: 48,751 passing (`npm test`)
- [ ] Integration tests: none exist
- [x] Manual testing: Angular UI verified loading guitar/ukulele/piano data; GH Pages URL confirmed working after base-href fix

---

## Next Steps

### Immediate (Start Here)

1. **Publish to npm**: `npm login` (as `gblp`), then `npm publish` from repo root — `prepublishOnly` will auto-run `npm run build` first
2. **Fix key name mismatch** (optional): In `src/generate.js`, normalize chord object keys after generation to use `#` (e.g. replace `Csharp` → `C#` in output JSON keys). This would make `data.keys` and `data.chords` consistent without needing `toChordKey()` in consumers.
3. **Improve commit messages**: Consider squashing or adding meaningful tags for release tracking

### Subsequent

- Add chord position cycling in the UI (click a card to see next position) — currently all positions show as separate cards
- Add suffix search/filter input in the Angular UI (80+ suffixes per instrument is a lot to scroll)
- Expand piano diagram octave range or make it dynamic based on the chord's MIDI range
- Add `@gblp/chords-db` install instructions to `chords-ui/README.md` as a usage example
- Consider adding a `CHANGELOG.md` now that the repo is published

### Blocked On

- npm publish requires `npm login` as user `gblp` — cannot be done from this session

---

## Related Resources

### Documentation

- GH Pages live demo: https://elparaquecosadeque.github.io/chords-db/
- npm package (after publish): https://www.npmjs.com/package/@gblp/chords-db
- GitHub Actions run: https://github.com/elparaquecosadeque/chords-db/actions

### Commands to Run

```bash
# Run tests
npm test

# Build chord data JSON
npm run build

# Run Angular UI locally
cd chords-ui && npm start

# Check what npm publish would include
npm pack --dry-run

# Publish to npm (must be logged in as gblp)
npm publish

# Build Angular for GH Pages manually (base href required)
cd chords-ui && npx ng build --base-href /chords-db/
```

If you need to find more context:

- `grep -r "toChordKey" chords-ui/src/` — finds the key-name mismatch workaround
- `grep -r "sharp" src/db/guitar/chords/C/index.js` — shows renamed import paths
- `grep -r "createRequire" src/` — finds JSON import workarounds
- `grep -r "import.meta.dirname" src/` — finds `__dirname` replacement

---

*This handoff was generated at session end. Start a new session and use this document as initial context.*
