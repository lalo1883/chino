import { test } from 'node:test';
import assert from 'node:assert/strict';
import { library } from '../app/content.ts';
import { parseWritingSelection, resolveWritingSelection, writingCandidates } from '../lib/writing-selection.ts';

test('saved writing selection tolerates malformed storage and deduplicates ids', () => {
  for (const value of [null, '{broken', '{}', '42']) assert.deepEqual(parseWritingSelection(value), []);
  assert.deepEqual(parseWritingSelection('["word-a",null,7,"word-a","phrase-b"]'), ['word-a', 'phrase-b']);
});

test('exam practice keeps only selected words and phrases in selection order', () => {
  const word = library.find(item => item.hanzi === '每天' && item.type === 'word');
  const phrase = library.find(item => item.hanzi === '我每天六点半起床。' && item.type === 'phrase');
  assert.ok(word && phrase);
  const ids = [phrase.id, 'removed-item', word.id, phrase.id];
  const restored = parseWritingSelection(JSON.stringify(ids));
  assert.deepEqual(resolveWritingSelection(library, restored), [phrase, word]);
  assert.deepEqual(resolveWritingSelection(library, []), []);
  for (const item of resolveWritingSelection(library, restored)) {
    const characters = Array.from(item.hanzi).filter(character => /\p{Script=Han}/u.test(character));
    assert.ok(characters.length > 0);
    assert.ok(characters.every(character => character !== '。'));
  }
});

test('picker searches unmarked pinyin, meanings and hanzi across words and phrases', () => {
  const lesson = { from: 9, to: 9 };
  for (const query of ['mei tian', 'měitiān', '每天', 'cada dia']) {
    assert.ok(writingCandidates(library, query, 'word', lesson).some(item => item.hanzi === '每天'), query);
  }
  const phrases = writingCandidates(library, '起床', 'phrase', lesson);
  assert.ok(phrases.some(item => item.hanzi === '我每天六点半起床。'));
  assert.ok(phrases.every(item => item.type === 'phrase' && item.lessons.includes(9)));
  assert.equal(writingCandidates(library, 'no-such-word-xyz', 'all').length, 0);
});
