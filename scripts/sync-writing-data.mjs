import { mkdir, copyFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { library } from '../app/content.ts';
const destination = resolve('public/hanzi');
await mkdir(destination, { recursive: true });
const characters = new Set(library.flatMap(item => Array.from(item.hanzi).filter(char => /\p{Script=Han}/u.test(char))));
let copied = 0;
for (const character of characters) {
  try {
    await copyFile(resolve('node_modules/hanzi-writer-data', `${character}.json`), resolve(destination, `${character}.json`));
    copied++;
  } catch { console.warn(`No stroke data: ${character}`); }
}
for (const filename of ['ARPHICPL.TXT']) {
  try { await copyFile(resolve('node_modules/hanzi-writer-data', filename), resolve(destination, filename)); } catch { /* Package license names vary. */ }
}
const packageInfo = JSON.parse(await readFile('node_modules/hanzi-writer-data/package.json', 'utf8'));
await import('node:fs/promises').then(fs => fs.writeFile(resolve(destination, 'ATTRIBUTION.txt'), `Stroke data: Hanzi Writer Data ${packageInfo.version}\nhttps://github.com/chanind/hanzi-writer-data\nDerived from Make Me a Hanzi (Arphic fonts, redistribution under Arphic Public License). See ARPHICPL.TXT.\n`));
console.log(`Prepared local stroke data for ${copied}/${characters.size} characters.`);
