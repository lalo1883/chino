import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitToneSyllables, withTone, listeningChoices } from '../lib/listening.ts';

test('joined pinyin separates neutral and marked syllables by character count', () => {
  for (const [pinyin, hanzi, expected] of [
    ['péngyou', '朋友', [['peng', 2], ['you', 5]]],
    ['jiějie', '姐姐', [['jie', 3], ['jie', 5]]],
    ['Zhōngguó', '中国', [['zhong', 1], ['guo', 2]]],
    ['xuéxí', '学习', [['xue', 2], ['xi', 2]]],
    ['gōngzuò', '工作', [['gong', 1], ['zuo', 4]]],
    ['lǜsè', '绿色', [['lü', 4], ['se', 4]]],
    ['nǐ hǎo', '你好', [['ni', 3], ['hao', 3]]],
    ['Xī’ān', '西安', [['xi', 1], ['an', 1]]],
  ]) assert.deepEqual(splitToneSyllables(pinyin, hanzi).map(({ base, tone }) => [base, tone]), expected);
});
test('variant or malformed pinyin never becomes a graded tone question', () => {
  assert.deepEqual(splitToneSyllables('shuí / shéi', '谁'), []);
  assert.deepEqual(splitToneSyllables('invalid', '你'), []);
  assert.deepEqual(splitToneSyllables('nǐ hǎo', '你'), []);
});
test('tone rendering places marks on the correct vowel and preserves umlauts', () => {
  assert.equal(withTone('hao', 3), 'hǎo');
  assert.equal(withTone('gui', 4), 'guì');
  assert.equal(withTone('liu', 2), 'liú');
  assert.equal(withTone('dou', 1), 'dōu');
  assert.equal(withTone('lü', 4), 'lǜ');
  assert.equal(withTone('ma', 5), 'ma');
});
test('meaning choices include the answer once and exclude duplicate translations', () => {
  const pool = [{ id: 'a', meaning: 'Hello' }, { id: 'b', meaning: ' hello ' }, { id: 'c', meaning: 'Thanks' }, { id: 'd', meaning: 'Goodbye' }, { id: 'e', meaning: 'Water' }];
  const choices = listeningChoices(pool[0], pool, item => item.meaning);
  assert.equal(choices.length, 4);
  assert.equal(choices.filter(item => item.id === 'a').length, 1);
  assert.equal(choices.some(item => item.id === 'b'), false);
  assert.deepEqual(choices, listeningChoices(pool[0], pool, item => item.meaning));
});
