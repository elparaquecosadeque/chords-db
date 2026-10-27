import { strChord2array } from '../../tools.js';

// Close-position triads, generated rather than hand-written: for every
// three-note quality (major, minor, dim, aug, sus2, sus4…), the root-position
// and inverted voicing on each set of three adjacent strings, frets 0–15.
// They go after the hand-written positions, flagged `triad: true`, so a
// consumer can leave them out.

const TUNING = [40, 45, 50, 55, 59, 64]; // standard, low E first, as MIDI
const STRING_SETS = [[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5]];
const MAX_FRET = 15;
const MAX_STRETCH = 4;
const KEY_PC = { C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
const DEGREE_SEMITONES = {
  1: 0, b2: 1, b9: 1, 2: 2, 9: 2, '#9': 3, b3: 3, 3: 4, 4: 5, 11: 5,
  '#11': 6, b5: 6, 5: 7, '#5': 8, b13: 8, 6: 9, 13: 9, bb7: 9, b7: 10, 7: 11,
};

const toCode = (frets) => frets.map((fret) => (fret < 0 ? 'x' : fret.toString(16))).join('');

// The lowest fret takes finger 1 (as a barre when several strings share it);
// every other note gets the next finger, lower frets first, then low strings.
const fingering = (frets) => {
  const fretted = frets.filter((fret) => fret > 0);
  if (!fretted.length) return { fingers: '000000' };
  const lowest = Math.min(...fretted);
  const fingers = frets.map((fret) => (fret === lowest ? 1 : 0));
  frets
    .map((fret, string) => ({ fret, string }))
    .filter(({ fret }) => fret > lowest)
    .sort((a, b) => a.fret - b.fret || a.string - b.string)
    .forEach(({ string }, i) => (fingers[string] = i + 2));
  const barre = fingers.filter((finger) => finger === 1).length > 1 ? lowest : undefined;
  return { fingers: fingers.join(''), ...(barre ? { barres: barre } : {}) };
};

export const closeTriads = (rootPc, semitones) => {
  const pitchClasses = semitones.map((semitone) => (rootPc + semitone) % 12);
  return STRING_SETS.flatMap((strings) => {
    const triads = [];
    for (let inversion = 0; inversion < 3; inversion++) {
      const order = [0, 1, 2].map((i) => pitchClasses[(i + inversion) % 3]);
      const options = strings.map((string, i) =>
        [0, 12]
          .map((octave) => ((order[i] - TUNING[string] + 120) % 12) + octave)
          .filter((fret) => fret <= MAX_FRET)
      );
      for (const a of options[0])
        for (const b of options[1])
          for (const c of options[2]) {
            const chosen = [a, b, c];
            const midi = chosen.map((fret, i) => TUNING[strings[i]] + fret);
            if (!(midi[0] < midi[1] && midi[1] < midi[2] && midi[2] - midi[0] < 12)) continue;
            if (Math.max(...chosen) - Math.min(...chosen) > MAX_STRETCH) continue;
            const frets = Array(6).fill(-1);
            strings.forEach((string, i) => (frets[string] = chosen[i]));
            triads.push(frets);
          }
    }
    const lowest = (frets) => Math.min(...frets.filter((fret) => fret >= 0));
    return triads.sort((x, y) => lowest(x) - lowest(y));
  });
};

export const addTriads = (chords, formulas) =>
  Object.fromEntries(
    Object.entries(chords).map(([key, family]) => [
      key,
      family.map((chord) => {
        const entry = formulas[chord.suffix];
        if (!entry || entry.formula.length !== 3) return chord;
        const existing = new Set(chord.positions.map((position) => strChord2array(position.frets).join()));
        const triads = closeTriads(
          KEY_PC[chord.key],
          entry.formula.map((degree) => DEGREE_SEMITONES[degree])
        )
          .filter((frets) => !existing.has(frets.join()))
          .map((frets) => ({ frets: toCode(frets), ...fingering(frets), triad: true }));
        return { ...chord, positions: [...chord.positions, ...triads] };
      }),
    ])
  );
