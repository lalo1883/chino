import { test } from 'node:test';
import assert from 'node:assert/strict';
import { library, handwrittenExamples, filterLibrary, ALL_CATEGORIES } from '../app/content.ts';
import { englishFor, meaningFor, translate } from '../lib/translations.ts';

test('every library item, handwritten example and breakdown has an English meaning', () => {
  const entries = [...library, ...handwrittenExamples];
  const segments = entries.flatMap(item => item.breakdown || []);
  const missing = [...entries, ...segments].filter(item => englishFor(item.hanzi, '__MISSING__') === '__MISSING__');
  assert.deepEqual(missing.map(item => item.hanzi), []);
  assert.equal(handwrittenExamples.length, 275);
});

test('all library categories translate without affecting Spanish labels', () => {
  for (const category of new Set(library.map(item => item.category))) {
    assert.notEqual(translate(category, 'en'), category, category);
    assert.equal(translate(category, 'es'), category);
  }
});

test('object exercises use articles and plural agreement naturally', () => {
  const cases = {
    '我需要雨伞。': 'I need an umbrella.',
    '我需要手机。': 'I need a mobile phone.',
    '我在找书。': 'I am looking for a book.',
    '这里有面条吗？': 'Are there any noodles here?',
    '这里有苹果吗？': 'Is there an apple here?',
    '这里有水吗？': 'Is there any water here?',
    '鞋在哪里？': 'Where are the shoes?',
    '杯子在哪里？': 'Where is the cup?',
    '请给我包子。': 'Please give me a steamed bun.',
  };
  for (const [hanzi, expected] of Object.entries(cases)) assert.equal(englishFor(hanzi), expected);
});

test('number exercises use singular and plural forms and support two variants', () => {
  assert.equal(englishFor('我有一个朋友。'), 'I have a friend.');
  assert.equal(englishFor('我有两个朋友。'), 'I have two friends.');
  assert.equal(englishFor('我要一杯茶。'), 'I want one cup of tea.');
  assert.equal(englishFor('我要三杯茶。'), 'I want three cups of tea.');
  assert.equal(englishFor('现在两点。'), "It is two o'clock.");
  assert.equal(englishFor('这个一块钱。'), 'This costs one yuan.');
});

test('meaning lookup supports punctuation variations, Spanish mode and unknown fallback', () => {
  assert.equal(englishFor('我会说汉语'), 'I can speak Chinese.');
  assert.equal(englishFor('你好!'), 'Hello!');
  assert.equal(meaningFor({hanzi:'面条',spanish:'fideos'},'es'),'fideos');
  assert.equal(meaningFor({hanzi:'面条',meaning:'fideos'},'en'),'noodles');
  assert.equal(englishFor('不存在的条目','Unknown item'),'Unknown item');
});

test('dynamic UI labels and lesson ranges translate while retaining content and spacing', () => {
  assert.equal(translate(' · Lección 7, 8','en'),' · Lesson 7, 8');
  assert.equal(translate('Lecciones 1 a 9','en'),'Lessons 1 to 9');
  assert.equal(translate('Ver detalle de 你好','en'),'View details of 你好');
  assert.equal(translate('Caracteres de 汉语','en'),'Characters in 汉语');
  assert.equal(translate('Escuchar 我好','en'),'Listen to 我好');
  assert.equal(translate('水: ver significado','en'),'水: show meaning');
  assert.equal(translate('  Todos los temas  ','en'),'  All topics  ');
  assert.equal(translate('No results for “water”','en'),'No results for “water”');
});

test('English vocabulary search matches translated nouns', () => {
  const found = filterLibrary(library, {kind:'word',book:false,category:ALL_CATEGORIES,query:'umbrella'});
  assert.ok(found.some(item => item.hanzi === '雨伞'));
});
