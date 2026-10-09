import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scheduleReview, makeSession, DAY } from '../lib/learning.ts';

const now = new Date(2026, 9, 9, 12).getTime();
test('recall grows over separate days, not repeated clicks', () => {
  const first = scheduleReview(undefined, true, now);
  assert.equal(first.interval, 1);
  assert.equal(scheduleReview(first, true, now + 1000).interval, 1);
  const second = scheduleReview(first, true, now + DAY);
  assert.equal(second.interval, 2);
  assert.equal(scheduleReview(second, true, now + 3 * DAY).interval, 4);
  assert.equal(scheduleReview(second, false, now + 3 * DAY).interval, 10 / 1440);
});
test('sessions prioritize due reviews, cap new cards and exclude future reviews', () => {
  const items = Array.from({length:30}, (_, i) => ({id:String(i)}));
  const records = Object.fromEntries(items.slice(0,10).map(item => [item.id, scheduleReview(undefined, true, now - 2 * DAY)]));
  records['29'] = scheduleReview(undefined, true, now);
  const session = makeSession(items, records, now);
  assert.equal(session.length, 12);
  assert.equal(new Set(session.map(x => x.id)).size, 12);
  assert.equal(session.filter(x => records[x.id]).length, 8);
  assert.ok(!session.some(x => x.id === '29'));
  assert.equal(makeSession(items, records, now, true).length, 10);
  assert.equal(makeSession([{id:'29'}], records, now).length, 0);
});
test('session size is configurable', () => {
  const items = Array.from({length:60}, (_, i) => ({id:String(i)}));
  assert.equal(makeSession(items, {}, now, false, 6).length, 6);
  assert.equal(makeSession(items, {}, now, false, 24).length, 24);
  assert.equal(makeSession(items.slice(0, 3), {}, now, false, 24).length, 3);
});
