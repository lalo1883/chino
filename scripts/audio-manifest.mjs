// Imprime { audio, text } de cada tarjeta y ejemplo para generar los mp3 con generate-library-audio.py
import { library, handwrittenExamples } from '../app/content.ts';

const items = [...library.map((item) => ({ audio: item.audio, text: item.hanzi })), ...handwrittenExamples.map((example) => ({ audio: example.audio, text: example.hanzi }))];
console.log(JSON.stringify(items));
