import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { library, filterLibrary, categoriesFor, ALL_CATEGORIES, analyze } from '../app/content.ts';
import { courseEntries, normalizeLessonHanzi, LESSONS, bookSupplementEntries } from '../app/course-lessons.ts';
import { newCourseEntries } from '../app/new-course-lessons.ts';
import { lessonSixSupplement } from '../app/lesson-six-supplement.ts';
import { makeSession } from '../lib/learning.ts';
import bookReference from '../app/book-reference.json' with { type: 'json' };

const entryKey = entry => `${entry.type}:${normalizeLessonHanzi(entry.hanzi)}`;
const uniqueEntries = entries => [...new Map(entries.map(entry => [entryKey(entry), entry])).values()];

const base = { kind: 'all', book: false, category: ALL_CATEGORIES };

test('digital book entries retain page provenance and complete lesson 1–11 coverage', () => {
  assert.equal(bookReference.source.isbn, '9787561930762');
  const bounds = [[1, 8], [9, 17], [18, 26], [27, 38], [39, 49], [50, 61], [62, 74], [75, 87], [88, 100], [101, 112], [113, 123]];
  const counts = [[14, 5], [32, 9], [30, 14], [28, 21], [31, 21], [47, 2], [48, 22], [48, 20], [43, 26], [43, 21], [42, 30]];
  for (const lesson of LESSONS) {
    const entries = bookReference.entries.filter(entry => entry.lesson === lesson);
    assert.deepEqual(['word', 'phrase'].map(type => entries.filter(entry => entry.type === type).length), counts[lesson - 1]);
    for (const entry of entries) {
      assert.ok(entry.page >= bounds[lesson - 1][0] && entry.page <= bounds[lesson - 1][1], entry.hanzi);
      assert.ok(entry.pinyin && entry.spanish && entry.english, entry.hanzi);
      const card = library.find(item => entryKey(item) === entryKey(entry));
      assert.ok(card?.lessons.includes(lesson), `${lesson}: ${entry.hanzi}`);
      if (entry.type === 'phrase') assert.deepEqual(analyze(entry.hanzi).unknown, [], entry.hanzi);
    }
  }
});

test('lesson 11 supports vocabulary, phrase, search and study filters', () => {
  const lessons = { from: 11, to: 11 };
  const words = filterLibrary(library, { ...base, kind: 'word', book: true, lessons });
  const phrases = filterLibrary(library, { ...base, kind: 'phrase', book: true, lessons });
  assert.equal(words.length, 42);
  assert.equal(phrases.length, 30);
  assert.ok(words.some(item => item.hanzi === '同屋'));
  assert.ok(words.some(item => item.hanzi === '从……到……'));
  assert.ok(phrases.some(item => item.hanzi === '我在学校食堂吃饭。'));
  assert.ok(filterLibrary(library, { ...base, query: 'roommate', lessons }).some(item => item.hanzi === '同屋'));
  assert.ok(makeSession([...words, ...phrases], {}, Date.now(), false, 24).every(item => item.lessons.includes(11)));
});

test('lesson 6 includes the photographed vocabulary and dialogues without duplicate cards', () => {
  assert.equal(lessonSixSupplement.filter(entry => entry.type === 'word').length, 31);
  assert.equal(lessonSixSupplement.filter(entry => entry.type === 'phrase').length, 42);
  const lesson = filterLibrary(library, { ...base, lessons: { from: 6, to: 6 } });
  assert.equal(lesson.length, 108);
  for (const entry of lessonSixSupplement) {
    const matches = lesson.filter(item => entryKey(item) === entryKey(entry));
    assert.equal(matches.length, 1, entry.hanzi);
    assert.ok(matches[0].pinyin && matches[0].spanish, entry.hanzi);
  }
  for (const hanzi of ['香蕉', '苹果', '矿泉水', '公斤', '西瓜怎么卖？', '一共三十二块八毛。']) {
    assert.ok(lesson.some(item => item.hanzi === hanzi), hanzi);
  }
});

test('all course entries have a unique library card in the correct lesson', () => {
  assert.equal(courseEntries.length, 222 + lessonSixSupplement.length + bookSupplementEntries.length);
  assert.equal(new Set(courseEntries.map(entry => `${entry.lesson}:${entryKey(entry)}`)).size, courseEntries.length);
  assert.deepEqual(LESSONS, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
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
  for (let from = 1; from <= 11; from++) for (let to = from; to <= 11; to++) {
    const actual = filterLibrary(library, { ...base, lessons: { from, to } });
    const expected = uniqueEntries(courseEntries.filter(entry => entry.lesson >= from && entry.lesson <= to));
    assert.equal(actual.length, expected.length, `${from}–${to}`);
    assert.deepEqual(actual.map(item => `${item.type}:${normalizeLessonHanzi(item.hanzi)}`).sort(), expected.map(entry => `${entry.type}:${normalizeLessonHanzi(entry.hanzi)}`).sort(), `${from}–${to}: exact vocabulary`);
    assert.ok(actual.every(item => item.lessons.some(lesson => lesson >= from && lesson <= to)));
  }
  assert.equal(filterLibrary(library, { ...base, lessons: { from: 1, to: 5 } }).length, uniqueEntries(courseEntries.filter(entry => entry.lesson <= 5)).length);
  assert.equal(filterLibrary(library, { ...base, lessons: { from: 6, to: 10 } }).length, uniqueEntries(courseEntries.filter(entry => entry.lesson >= 6 && entry.lesson <= 10)).length);
  assert.equal(filterLibrary(library, { ...base, lessons: { from: 1, to: 11 } }).length, uniqueEntries(courseEntries).length);
  assert.ok(filterLibrary(library, base).length > 222);
});

// Parse CSV quoting rather than splitting on commas inside Spanish definitions.
function csvRows(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if (char === '\n' && !quoted) { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += char;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  assert.equal(quoted, false, 'All CSV quoted fields must terminate');
  return rows;
}

test('all 140 supplied CSV rows retain their lesson, characters, pinyin and Spanish meaning', () => {
  const [header, ...rows] = csvRows(readFileSync(new URL('../table_20261012.csv', import.meta.url), 'utf8'));
  assert.deepEqual(header, ['Lección', 'Caracteres', 'Pinyin', 'Español']);
  assert.equal(rows.length, 140);
  const expected = rows.map(([lesson, hanzi, pinyin, spanish]) => ({ lesson: Number(lesson.slice(1)), type: /[。？！!?]/u.test(hanzi) ? 'phrase' : 'word', hanzi, pinyin, spanish }));
  assert.deepEqual(newCourseEntries, expected);
  assert.deepEqual(courseEntries.slice(82, 222), expected);
  assert.deepEqual([6, 7, 8, 9, 10].map(lesson => [lesson, expected.filter(entry => entry.lesson === lesson && entry.type === 'word').length, expected.filter(entry => entry.lesson === lesson && entry.type === 'phrase').length]), [[6, 26, 2], [7, 30, 3], [8, 23, 3], [9, 20, 3], [10, 27, 3]]);
  for (const kind of ['word', 'phrase']) {
    const actual = filterLibrary(library, { ...base, book: true, kind, lessons: { from: 6, to: 10 } });
    const supplied = expected.filter(entry => entry.type === kind);
    for (const entry of supplied) assert.ok(actual.some(item => normalizeLessonHanzi(item.hanzi) === normalizeLessonHanzi(entry.hanzi)), entry.hanzi);
  }
});

test('adding lessons preserves original card and audio identities across every existing source', () => {
  const originalCards = [
    ['我', 'w-001'], ['医生', 'w-141'], ['汉语', 'w-216'], ['你好', 'w-276'],
    ['我需要手机。', 'f-131'], ['我家有四口人。', 'l-014'],
    ['你叫什么名字？', 'course-3-50'], ['我叫杜丽。', 'course-3-51'],
    ['我有一个朋友。', 'n-001'],
  ];
  for (const [hanzi, id] of originalCards) {
    const card = library.find(item => item.hanzi === hanzi);
    assert.ok(card, hanzi);
    assert.equal(card.id, id, `${hanzi}: saved progress identity`);
    assert.equal(card.audio, id, `${hanzi}: existing recording identity`);
  }
});

test('lesson ranges combine with type, book, topic, search, category counts and session creation', () => {
  const lessons = { from: 4, to: 5 };
  const words = filterLibrary(library, { ...base, kind: 'word', book: true, lessons });
  assert.equal(words.length, 59);
  const categories = categoriesFor(library, 'word', true, lessons);
  assert.equal(categories.reduce((sum, [, count]) => sum + count, 0), words.length);
  const result = filterLibrary(library, { ...base, kind: 'word', category: 'Familia', query: 'mamá', lessons });
  assert.deepEqual(result.map(item => item.hanzi), ['妈妈']);
  assert.deepEqual(filterLibrary(library, { ...base, query: '水', lessons }), []);
  const session = makeSession(words, {}, Date.now(), false, 24);
  assert.equal(session.length, 24);
  assert.ok(session.every(item => words.includes(item)));
});
