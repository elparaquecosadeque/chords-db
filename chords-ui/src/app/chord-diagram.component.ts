import { Component, Input } from '@angular/core';

export interface ChordPosition {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres: number[];
  capo?: boolean;
  midi?: number[];
}

export interface InstrumentInfo {
  strings: number;
  fretsOnChord: number;
  name: string;
}

const CW = 26;  // cell width (string spacing)
const CH = 28;  // cell height (fret spacing)
const PT = 44;  // pad top (open/muted row)
const PL = 28;  // pad left (baseFret label)
const PR = 12;  // pad right
const PB = 10;  // pad bottom
const DR = 10;  // dot radius

@Component({
  selector: 'app-chord-diagram',
  standalone: true,
  template: `
    <svg [attr.viewBox]="viewBox" xmlns="http://www.w3.org/2000/svg" class="chord-svg">
      <!-- Fret grid -->
      @for (line of fretLines; track $index) {
        <line [attr.x1]="line.x1" [attr.y1]="line.y" [attr.x2]="line.x2" [attr.y2]="line.y"
              [attr.stroke]="'#333'"
              [attr.stroke-width]="line.isNut ? 5 : 1" />
      }
      <!-- String lines -->
      @for (s of stringLines; track $index) {
        <line [attr.x1]="s.x" [attr.y1]="s.y1" [attr.x2]="s.x" [attr.y2]="s.y2"
              stroke="#333" stroke-width="1" />
      }
      <!-- Open / muted indicators -->
      @for (om of openMuted; track $index) {
        @if (om.open) {
          <circle [attr.cx]="om.x" [attr.cy]="om.y" [attr.r]="7"
                  fill="none" stroke="#333" stroke-width="1.5" />
        }
        @if (om.muted) {
          <text [attr.x]="om.x" [attr.y]="om.y + 5"
                text-anchor="middle" font-size="14" fill="#333" font-weight="bold">×</text>
        }
      }
      <!-- Barre bars -->
      @for (b of barreRects; track $index) {
        <rect [attr.x]="b.x" [attr.y]="b.y" [attr.width]="b.width" [attr.height]="b.height"
              [attr.rx]="dotRadius" fill="#333" />
        @if (b.finger) {
          <text [attr.x]="b.x + b.width / 2" [attr.y]="b.y + dotRadius + 4"
                text-anchor="middle" font-size="11" fill="white" font-weight="bold">{{ b.finger }}</text>
        }
      }
      <!-- Individual dots -->
      @for (d of dots; track $index) {
        <circle [attr.cx]="d.cx" [attr.cy]="d.cy" [attr.r]="dotRadius" fill="#333" />
        @if (d.label) {
          <text [attr.x]="d.cx" [attr.y]="d.cy + 4"
                text-anchor="middle" font-size="11" fill="white" font-weight="bold">{{ d.label }}</text>
        }
      }
      <!-- BaseFret label -->
      @if (baseFretLabel) {
        <text [attr.x]="baseFretLabel.x" [attr.y]="baseFretLabel.y"
              text-anchor="end" font-size="10" fill="#666">{{ baseFretLabel.text }}</text>
      }
    </svg>
  `,
  styles: [`
    .chord-svg { width: 100%; height: auto; }
  `]
})
export class ChordDiagramComponent {
  @Input({ required: true }) position!: ChordPosition;
  @Input({ required: true }) instrument!: InstrumentInfo;

  readonly dotRadius = DR;
  get strings() { return this.instrument.strings; }
  get fretsOnChord() { return this.instrument.fretsOnChord; }
  get gridW() { return (this.strings - 1) * CW; }
  get totalW() { return PL + this.gridW + PR; }
  get totalH() { return PT + this.fretsOnChord * CH + PB; }
  get viewBox() { return `0 0 ${this.totalW} ${this.totalH}`; }

  stringX(i: number) { return PL + i * CW; }
  fretLineY(j: number) { return PT + j * CH; }
  dotCY(fret: number) { return PT + (fret - 0.5) * CH; }

  get stringLines() {
    return Array.from({ length: this.strings }, (_, i) => ({
      x: this.stringX(i),
      y1: PT,
      y2: PT + this.fretsOnChord * CH,
    }));
  }

  get fretLines() {
    return Array.from({ length: this.fretsOnChord + 1 }, (_, j) => ({
      y: this.fretLineY(j),
      x1: PL,
      x2: PL + this.gridW,
      isNut: j === 0 && this.position.baseFret === 1,
    }));
  }

  get openMuted() {
    return this.position.frets
      .map((fret, i) => ({ x: this.stringX(i), y: PT - 16, open: fret === 0, muted: fret === -1 }))
      .filter(s => s.open || s.muted);
  }

  get barreRects() {
    const barreFingers: number[] = [];
    return this.position.barres.map(barre => {
      const barreStrings = this.position.frets
        .map((f, i) => ({ f, i }))
        .filter(s => s.f === barre);
      if (!barreStrings.length) return null;
      const minI = barreStrings[0].i;
      const maxI = barreStrings[barreStrings.length - 1].i;
      // Finger for the barre: the min finger value among barre strings
      const finger = Math.min(
        ...barreStrings.map(s => this.position.fingers?.[s.i] ?? 0).filter(f => f > 0)
      );
      return {
        x: this.stringX(minI) - DR,
        y: this.dotCY(barre) - DR,
        width: (maxI - minI) * CW + DR * 2,
        height: DR * 2,
        finger: isFinite(finger) ? finger : 0,
      };
    }).filter(Boolean) as BarreRect[];
  }

  get dots() {
    const barreSet = new Set(this.position.barres);
    return this.position.frets
      .map((fret, i) => ({ fret, i, finger: this.position.fingers?.[i] ?? 0 }))
      .filter(d => d.fret > 0 && !barreSet.has(d.fret))
      .map(d => ({
        cx: this.stringX(d.i),
        cy: this.dotCY(d.fret),
        label: d.finger > 0 ? d.finger : null,
      }));
  }

  get baseFretLabel() {
    if (this.position.baseFret <= 1) return null;
    return {
      x: PL - 4,
      y: this.fretLineY(0) + CH * 0.5 + 4,
      text: `${this.position.baseFret}fr`,
    };
  }
}

interface BarreRect { x: number; y: number; width: number; height: number; finger: number; }
