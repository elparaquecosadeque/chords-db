import { Component, Input } from '@angular/core';

export interface PianoPosition {
  frets: string[];
  midi: number[];
  baseFret?: number;
  fingers?: number[];
  barres?: number[];
}

// MIDI 60 = C4. White key layout per octave: C D E F G A B
const WHITE_ORDER = [0, 2, 4, 5, 7, 9, 11]; // semitone offsets in an octave
// Black keys: C#=1, D#=3, F#=6, G#=8, A#=10
const BLACK_OFFSETS: Record<number, number> = { 1: 0.6, 3: 1.6, 6: 3.6, 8: 4.6, 10: 5.6 };

const WK = 18;   // white key width
const WH = 62;   // white key height
const BK = 12;   // black key width
const BH = 38;   // black key height
const OCTAVES = 2;
const START_OCTAVE = 3; // show octaves 3 and 4 (C3–B4, midi 48–71)

@Component({
  selector: 'app-piano-diagram',
  standalone: true,
  template: `
    <svg [attr.viewBox]="viewBox" xmlns="http://www.w3.org/2000/svg" class="piano-svg">
      <!-- White keys -->
      @for (k of whiteKeys; track k.midi) {
        <rect [attr.x]="k.x" y="0" [attr.width]="WK - 1" [attr.height]="WH"
              [attr.fill]="k.active ? '#4299e1' : 'white'"
              stroke="#aaa" stroke-width="1" rx="2" />
      }
      <!-- Black keys (drawn on top) -->
      @for (k of blackKeys; track k.midi) {
        <rect [attr.x]="k.x" y="0" [attr.width]="BK" [attr.height]="BH"
              [attr.fill]="k.active ? '#2b6cb0' : '#222'"
              rx="2" />
      }
      <!-- Note labels on active keys -->
      @for (k of activeLabels; track k.midi) {
        <text [attr.x]="k.x" [attr.y]="k.y" text-anchor="middle"
              font-size="8" [attr.fill]="k.black ? 'white' : '#333'">{{ k.label }}</text>
      }
    </svg>
  `,
  styles: [`
    .piano-svg { width: 100%; height: auto; }
  `]
})
export class PianoDiagramComponent {
  @Input({ required: true }) position!: PianoPosition;

  readonly WK = WK;
  readonly WH = WH;
  readonly BK = BK;
  readonly BH = BH;

  get activeSet() { return new Set(this.position.midi ?? []); }

  get totalWhiteKeys() { return OCTAVES * 7; }
  get totalW() { return this.totalWhiteKeys * WK; }
  get viewBox() { return `0 0 ${this.totalW} ${WH}`; }

  whiteKeyX(octaveIndex: number, noteIndex: number) {
    return (octaveIndex * 7 + noteIndex) * WK;
  }

  get whiteKeys(): { x: number; midi: number; active: boolean }[] {
    const keys: { x: number; midi: number; active: boolean }[] = [];
    for (let o = 0; o < OCTAVES; o++) {
      WHITE_ORDER.forEach((semitone, i) => {
        const midi = (START_OCTAVE + o) * 12 + semitone;
        keys.push({ x: this.whiteKeyX(o, i), midi, active: this.activeSet.has(midi) });
      });
    }
    return keys;
  }

  get blackKeys(): { x: number; midi: number; active: boolean }[] {
    const keys: { x: number; midi: number; active: boolean }[] = [];
    for (let o = 0; o < OCTAVES; o++) {
      Object.entries(BLACK_OFFSETS).forEach(([semitone, offset]) => {
        const midi = (START_OCTAVE + o) * 12 + Number(semitone);
        const x = (o * 7 + offset) * WK - BK / 2;
        keys.push({ x, midi, active: this.activeSet.has(midi) });
      });
    }
    return keys;
  }

  get activeLabels() {
    const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const labels = [];
    for (const k of this.whiteKeys) {
      if (k.active) {
        labels.push({ x: k.x + (WK - 1) / 2, y: WH - 6, midi: k.midi,
          label: NOTE_NAMES[k.midi % 12], black: false });
      }
    }
    for (const k of this.blackKeys) {
      if (k.active) {
        labels.push({ x: k.x + BK / 2, y: BH - 4, midi: k.midi,
          label: NOTE_NAMES[k.midi % 12], black: true });
      }
    }
    return labels;
  }
}
