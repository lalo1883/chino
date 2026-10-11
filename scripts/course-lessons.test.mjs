import { test } from 'node:test';
import assert from 'node:assert/strict';
import { library, filterLibrary, categoriesFor, ALL_CATEGORIES } from '../app/content.ts';
import { courseEntries, normalizeLessonHanzi } from '../app/course-lessons.ts';
import { makeSession } from '../lib/learning.ts';

const base = { kind: 'all', book: false, category: ALL_CATEGORIES };

test('all 82 course entries have a library card in the correct lesson', () => {
  assert.equal(courseEntries.length, 82);
  for (const entry of courseEntries) {
    const matches = library.filter(item => item.type === entry.type && normalizeLessonHanzi(item.hanzi) === normalizeLessonHanzi(entry.hanzi));
    assert.equal(matches.length, 1, `Unique card for ${entry.hanzi}`);
    assert.ok(matches[0].book);
    assert.ok(matches[0].lessons.includes(entry.lesson), entry.hanzi);
    assert.ok(matches[0].breakdown.every(part => part.pinyin !== '?' && part.meaning !== '?'), entry.hanzi);
  }
  assert.equal(new Set(library.map(item => item.id)).size, library.length);
});

test('single lessons and all inclusive ranges contain exactly the supplied entries', () => {
  for (let from = 1; from <= 5; from++) for (let to = from; to <= 5; to++) {
    const actual = filterLibrary(library, { ...base, lessons: { from, to } });
    const expected = courseEntries.filter(entry => entry.lesson >= from && entry.lesson <= to);
    assert.equal(actual.length, expected.length, `${from}–${to}`);
    assert.ok(actual.every(item => item.lessons.some(lesson => lesson >= from && lesson <= to)));
  }
  assert.equal(filterLibrary(library, { ...base, lessons: { from: 1, to: 5 } }).length, 82);
  assert.ok(filterLibrary(library, base).length > 82);
});

test('lesson ranges combine with type, book, topic, search, category counts and session creation', () => {
  const lessons = { from: 4, to: 5 };
  const words = filterLibrary(library, { ...base, kind: 'word', book: true, lessons });
  assert.equal(words.length, 25);
  const categories = categoriesFor(library, 'word', true, lessons);
  assert.equal(categories.reduce((sum, [, count]) => sum + count, 0), words.length);
  const result = filterLibrary(library, { ...base, kind: 'word', category: 'Familia', query: 'mamá', lessons });
  assert.deepEqual(result.map(item => item.hanzi), ['妈妈']);
  assert.deepEqual(filterLibrary(library, { ...base, query: '水', lessons }), []);
  const session = makeSession(words, {}, Date.now(), false, 24);
  assert.equal(session.length, 24);
  assert.ok(session.every(item => words.includes(item)));
});
