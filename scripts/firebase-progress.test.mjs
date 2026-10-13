import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { mergeProgress, sanitizeProgress } from '../lib/progress.ts';
import { legacyFirebaseUser, legacyHashOptions } from './legacy-firebase-user.mjs';
import { authErrorMessage } from '../lib/auth-errors.ts';
const review = updatedAt => ({ rating:'fácil', interval:7, due:5000, reviews:4, updatedAt });
const progress = (records, resetAt = 0) => ({records,studyDays:['2026-10-13'],speed:-15,resetAt});

test('merging two devices keeps all cards and the latest review of each', () => {
  const result = mergeProgress(progress({a:review(20),b:review(10)}),progress({a:review(30),c:review(15)}));
  assert.equal(result.records.a.updatedAt,30);
  assert.deepEqual(Object.keys(result.records).sort(),['a','b','c']);
  assert.deepEqual(result.studyDays,['2026-10-13']);
});
test('reset prevents an old device resurrecting deleted reviews and days', () => {
  const result = mergeProgress(progress({a:review(10)}),{records:{},studyDays:[],speed:-15,resetAt:20});
  assert.deepEqual(result.records,{});
  assert.deepEqual(result.studyDays,[]);
  assert.equal(result.resetAt,20);
});
test('an offline reset wins when reconnecting, and later practice survives', () => {
  const result = mergeProgress({...progress({b:review(30)},20),studyDays:['2026-10-14']},progress({a:review(10)}));
  assert.deepEqual(Object.keys(result.records),['b']);
  assert.deepEqual(result.studyDays,['2026-10-14']);
});
test('cloud and local progress rejects malformed records and bounds settings', () => {
  const result = sanitizeProgress({records:{valid:review(2),invalid:{...review(2),rating:'unknown'},bad:{...review(2),due:Infinity}},studyDays:['2026-10-13','2026-10-13','wrong'],speed:100});
  assert.deepEqual(Object.keys(result.records),['valid']);
  assert.deepEqual(result.studyDays,['2026-10-13']);
  assert.equal(result.speed,20);
});
test('legacy passwords retain the original scrypt bytes and UTF-8 hex salt', () => {
  const salt = '0123456789abcdef0123456789abcdef';
  const hash = scryptSync('password',salt,64,{N:16384,r:16,p:1,maxmem:67108864});
  const record = legacyFirebaseUser({id:'old-id',email:'example@example.test'},[{providerId:'credential',password:`${salt}:${hash.toString('hex')}`}]);
  assert.equal(record.uid,'old-id');
  assert.equal(record.passwordSalt.toString('utf8'),salt);
  assert.deepEqual(record.passwordHash,hash);
  assert.equal(legacyHashOptions.hash.memoryCost,16384);
  assert.throws(() => legacyFirebaseUser({id:'x'},[{providerId:'credential',password:'unsupported'}]));
});
test('Google cancellation stays quiet; collisions and domain errors are actionable', () => {
  assert.equal(authErrorMessage('auth/popup-closed-by-user'),'');
  assert.match(authErrorMessage('auth/account-exists-with-different-credential'),/otro método/);
  assert.match(authErrorMessage('auth/unauthorized-domain'),/dirección/);
});

test('practice after another device reset retains the later study day', () => {
  const reset = new Date(2026,9,12,12).getTime();
  const practiced = new Date(2026,9,13,12).getTime();
  const result = mergeProgress(progress({new:review(practiced)}),{records:{},studyDays:[],speed:-15,resetAt:reset});
  assert.deepEqual(result.studyDays,['2026-10-13']);
  assert.equal(result.records.new.updatedAt,practiced);
});
