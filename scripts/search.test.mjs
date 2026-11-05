import { test } from 'node:test';
import assert from 'node:assert/strict';
import { library, filterLibrary, ALL_CATEGORIES } from '../app/content.ts';
import { writingCandidates } from '../lib/writing-selection.ts';

const search = query => filterLibrary(library, { kind: 'all', book: false, category: ALL_CATEGORIES, query });

test('library search accepts pinyin with or without tones and syllable spaces', () => {
  for (const query of ['ni hao', 'nihao', 'nǐ hǎo', 'NI HAO', '  ni   hao  ', 'ni3 hao3', 'ni3hao3']) {
    assert.ok(search(query).some(item => item.hanzi === '你好！' || item.hanzi === '你好'), query);
  }
  for (const query of ['shui', 'shuǐ', 'shui3']) assert.ok(search(query).some(item => item.hanzi === '水'), query);
  for (const query of ['mei tian', 'meitian', 'měitiān']) assert.ok(search(query).some(item => item.hanzi === '每天'), query);
});

test('pinyin search accepts ü, u, v and u: spellings and optional apostrophes', () => {
  const daughter = { ...library[0], id:'daughter', hanzi:'女儿', pinyin:'nǚ’ér', spanish:'hija' };
  for (const query of ['nü', 'nu', 'nv', 'nu:', 'nǚ', 'nv3']) {
    assert.equal(filterLibrary([daughter], { kind:'all', book:false, category:ALL_CATEGORIES, query }).length, 1, query);
  }
  const item = { ...library[0], id: 'apostrophe', hanzi: '西安', pinyin: 'Xī’ān', spanish: 'Xi’an' };
  for (const query of ["xi'an", 'xi’an', 'xi an', 'xian']) {
    assert.equal(filterLibrary([item], { kind:'all', book:false, category:ALL_CATEGORIES, query }).length, 1, query);
  }
});

test('search retains Chinese, accent-insensitive meanings and existing filters', () => {
  assert.ok(search('水').some(item => item.hanzi === '水'));
  assert.ok(search('cafe').some(item => item.hanzi === '咖啡'));
  assert.ok(search('umbrella').some(item => item.hanzi === '雨伞'));
  assert.deepEqual(search('no-such-word-xyz'), []);
  assert.equal(search('   ').length, library.length);
  const result = filterLibrary(library, { kind:'word', book:true, category:ALL_CATEGORIES, lessons:{from:9,to:9}, query:'mei tian' });
  assert.ok(result.some(item => item.hanzi === '每天'));
  assert.ok(result.every(item => item.type === 'word' && item.book && item.lessons.includes(9)));
});

test('writing picker shares the same tone-free pinyin search', () => {
  for (const query of ['mei tian', 'mei3tian1', 'meitian']) {
    assert.ok(writingCandidates(library, query, 'word', {from:9,to:9}).some(item => item.hanzi === '每天'), query);
  }
});
