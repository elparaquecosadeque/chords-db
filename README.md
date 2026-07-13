# chords-db

[![Deploy to GitHub Pages](https://github.com/elparaquecosadeque/chords-db/actions/workflows/pages.yml/badge.svg)](https://github.com/elparaquecosadeque/chords-db/actions/workflows/pages.yml)

This is a javascript database of string instruments chords. Open, free to use, easily improved with more chords. 
Contributions are welcomed, still a lot of chords (and instruments) missing. 
Use the pull request feature of Github to add your desired chords if you want to contribute.

## Live demo

Browse the chord diagrams interactively:

**[https://elparaquecosadeque.github.io/chords-db/](https://elparaquecosadeque.github.io/chords-db/)**

Guitar, ukulele, and piano — pick a key and explore every chord position.

## Install

```
npm install @gblp/chords-db
```

## Usage

```js
import { guitar, ukulele, piano, instruments } from '@gblp/chords-db';

// all chord positions for C major on guitar
const cMajor = guitar.chords.C.find(c => c.suffix === 'major');
console.log(cMajor.positions);

// instrument metadata
console.log(guitar.main);    // { strings: 6, fretsOnChord: 4, name: 'guitar' }
console.log(guitar.keys);    // ['C', 'C#', 'D', ...]
console.log(guitar.suffixes); // ['major', 'minor', ...]

// instruments summary (chord counts)
console.log(instruments); // { guitar: { ... }, ukulele: { ... }, piano: { ... } }
```

You can also import the JSON files directly:

```js
import guitar from '@gblp/chords-db/lib/guitar.json' with { type: 'json' };
```


For example, let's take a look at the `Dsus2` chords of guitar. We can see this information in the `D/sus2.js` file:

```
export default {
  key: 'D',
  suffix: 'sus2',
  positions: [{
    frets: '0320xx',
    fingers: '031000'
  },
  {
    frets: '55775x',
    fingers: '114310',
    barres: 5,
    capo: true
  }]
}

```

Each *position* define a new chord variation of the `Dsus2` chord.
We must define the *frets* needed to obtain the chord in the respective strings.
We can define too the *fingers* information for easy reading of the chord.
If the chord need to barre some string, we will define if in the *barre* field. If
you want the barre be represented with capo, you can define the "capo" property too.

## How to build/contribute

This project uses *npm* as package manager. Three basic commands

```
npm run build
```
Generates a new version of the library when new chords are added.

```
npm test
```
Make some testing of the new added chords. Very useful to detect basic mistakes.

## How to use

All this information is packed in a JSON library, that you can use to render visually
with a utility able to parse this information.

The `chords-ui/` directory in this repo is an Angular 22 app that renders interactive
chord diagrams — it's what powers the live demo above.

To run it locally:

```
cd chords-ui
npm install
npm start
```
