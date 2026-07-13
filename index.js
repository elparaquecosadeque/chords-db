import { createRequire } from 'module';

// ponytail: createRequire lets us load JSON in ESM without import attributes,
// which keeps compatibility with Node 18+
const require = createRequire(import.meta.url);

export const guitar = require('./lib/guitar.json');
export const ukulele = require('./lib/ukulele.json');
export const piano = require('./lib/piano.json');
export const instruments = require('./lib/instruments.json');

export default { guitar, ukulele, piano };
