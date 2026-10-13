import englishContent from './english-content.json' with { type: 'json' };
import englishExamples from './english-examples.json' with { type: 'json' };
import interfaceEnglish from './interface-en.json' with { type: 'json' };

export type Language = 'es' | 'en';
let publishedMeanings = new Map<string,string>();
export function setPublishedMeanings(entries: Array<{hanzi:string;language:Language;meaning:string}>) {
  publishedMeanings = new Map(entries.map(entry => [`${entry.language}:${entry.hanzi}`,entry.meaning]));
}
const english: Record<string, string> = { ...englishContent, ...englishExamples };
const ui: Record<string, string> = interfaceEnglish;
const punctuation = /[\s。？！!?,，、；;：:]/gu;
const normalizedEnglish = new Map(Object.entries(english).map(([hanzi, meaning]) => [hanzi.replace(punctuation, ''), meaning]));

// Chinese nouns do not mark articles or number. Choose natural English forms for
// the generated object exercises instead of inserting a dictionary headword.
const pluralObjects: Record<string, string> = { 面条: 'noodles', 饺子: 'dumplings', 筷子: 'chopsticks', 衣服: 'clothes', 鞋: 'shoes', 钥匙: 'keys' };
const massObjects = new Set(['水', '茶', '咖啡', '米饭', '水果', '面包', '牛奶', '果汁', '啤酒', '纸', '药', '肥皂']);
function objectNoun(hanzi: string) {
  const word = pluralObjects[hanzi] || english[hanzi]?.split(' / ')[0];
  if (!word) return undefined;
  const plural = Boolean(pluralObjects[hanzi]);
  const mass = massObjects.has(hanzi);
  const indefinite = plural || mass ? word : `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;
  return { word, plural, mass, indefinite };
}

const numerals: Record<string, string> = { 一: 'one', 两: 'two', 二: 'two', 三: 'three', 四: 'four', 五: 'five', 六: 'six', 七: 'seven', 八: 'eight', 九: 'nine', 十: 'ten' };

export function englishFor(hanzi: string, fallback = ''): string {
  const published = publishedMeanings.get(`en:${hanzi}`);
  if(published) return published;
  if (english[hanzi]) return english[hanzi];
  const plain = hanzi.replace(punctuation, '');
  const known = normalizedEnglish.get(plain);
  if (known) return known;
  const patterns: Array<[RegExp, (noun: NonNullable<ReturnType<typeof objectNoun>>) => string]> = [
    [/^我需要(.+)$/, noun => `I need ${noun.indefinite}.`],
    [/^我在找(.+)$/, noun => `I am looking for ${noun.indefinite}.`],
    [/^这里有(.+)吗$/, noun => `${noun.plural ? 'Are' : 'Is'} there ${noun.plural || noun.mass ? `any ${noun.word}` : noun.indefinite} here?`],
    [/^(.+)在哪里$/, noun => `Where ${noun.plural ? 'are' : 'is'} the ${noun.word}?`],
    [/^请给我(.+)$/, noun => `Please give me ${noun.plural || noun.mass ? `some ${noun.word}` : noun.indefinite}.`],
  ];
  for (const [pattern, render] of patterns) {
    const match = plain.match(pattern);
    const noun = match && objectNoun(match[1]);
    if (noun) return render(noun);
  }
  const numberPatterns: Array<[RegExp, (number: string) => string]> = [
    [/^我有([一两三四五六七八九十])个朋友$/, n => `I have ${n} ${n === 'one' ? 'friend' : 'friends'}.`],
    [/^现在([一两三四五六七八九十])点$/, n => `It is ${n} o'clock.`],
    [/^这个([一两三四五六七八九十])块钱$/, n => `This costs ${n} yuan.`],
    [/^我要([一两三四五六七八九十])杯茶$/, n => `I want ${n} ${n === 'one' ? 'cup' : 'cups'} of tea.`],
  ];
  for (const [pattern, render] of numberPatterns) {
    const match = plain.match(pattern);
    if (match) return render(numerals[match[1]]);
  }
  return ui[fallback] ?? fallback;
}

export function meaningFor(item: { hanzi: string; spanish?: string; meaning?: string }, language: Language): string {
  const published = publishedMeanings.get(`${language}:${item.hanzi}`);
  if (published) return published;
  const spanish = item.spanish ?? item.meaning ?? '';
  return language === 'en' ? englishFor(item.hanzi, spanish) : spanish;
}

export function translate(text: string, language: Language): string {
  if (language === 'es') return text;
  if (ui[text]) return ui[text];
  if (ui[text.trim()]) return text.replace(text.trim(), ui[text.trim()]);
  return text
    .replace(/Lecciones (\d+) a (\d+)/g, 'Lessons $1 to $2')
    .replace(/Lección (\d+)/g, 'Lesson $1')
    .replace(/Escuchar (.+)/g, 'Listen to $1')
    .replace(/Desglose de (.+)/g, 'Breakdown of $1')
    .replace(/Ver detalle de (.+)/g, 'View details of $1')
    .replace(/Detalle de (.+)/g, 'Details of $1')
    .replace(/Caracteres de (.+)/g, 'Characters in $1')
    .replace(/Significado de (.+)/g, 'Meaning of $1')
    .replace(/(.+): ver significado/g, '$1: show meaning')
    .replace(/Sin resultados para (.+)/g, 'No results for $1')
    .replace(/(\d+) palabras\b/g, '$1 words')
    .replace(/(\d+) frases\b/g, '$1 phrases')
    .replace(/(\d+) tarjetas\b/g, '$1 cards');
}
