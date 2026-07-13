import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChordDiagramComponent, type InstrumentInfo } from './chord-diagram.component';
import { PianoDiagramComponent } from './piano-diagram.component';

interface ChordDb {
  main: InstrumentInfo;
  keys: string[];
  suffixes: string[];
  chords: Record<string, ChordEntry[]>;
}

interface ChordEntry {
  key: string;
  suffix: string;
  positions: ChordPosition[];
}

interface ChordPosition {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres: number[];
  capo?: boolean;
  midi?: number[];
}

interface ChordCard {
  key: string;
  suffix: string;
  position: ChordPosition;
  posIndex: number;
  total: number;
}

const INSTRUMENTS = ['guitar', 'ukulele', 'piano'] as const;
type InstrumentName = typeof INSTRUMENTS[number];

// JSON chords use "Csharp"/"Fsharp" keys but the keys array uses "C#"/"F#"
const toChordKey = (k: string) => k.replace('#', 'sharp');

@Component({
  selector: 'app-root',
  imports: [ChordDiagramComponent, PianoDiagramComponent, TitleCasePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private http = inject(HttpClient);

  readonly instruments = INSTRUMENTS;
  selectedInstrument = signal<InstrumentName>('guitar');
  selectedKey = signal('C');

  dbs = signal<Partial<Record<InstrumentName, ChordDb>>>({});

  currentDb = computed(() => this.dbs()[this.selectedInstrument()]);

  keys = computed(() => this.currentDb()?.keys ?? []);

  chordCards = computed((): ChordCard[] => {
    const db = this.currentDb();
    if (!db) return [];
    const chordsForKey = db.chords[toChordKey(this.selectedKey())] ?? [];
    return chordsForKey.flatMap(entry =>
      entry.positions.map((pos, i) => ({
        key: entry.key,
        suffix: entry.suffix,
        position: pos,
        posIndex: i,
        total: entry.positions.length,
      }))
    );
  });

  isPiano = computed(() => this.selectedInstrument() === 'piano');

  ngOnInit() {
    for (const name of INSTRUMENTS) {
      this.http.get<ChordDb>(`/data/${name}.json`).subscribe(data => {
        this.dbs.update(prev => ({ ...prev, [name]: data }));
      });
    }
  }

  selectInstrument(name: InstrumentName) {
    this.selectedInstrument.set(name);
    const keys = this.currentDb()?.keys ?? [];
    if (!keys.includes(this.selectedKey())) this.selectedKey.set(keys[0] ?? 'C');
  }

  selectKey(key: string) { this.selectedKey.set(key); }
}
