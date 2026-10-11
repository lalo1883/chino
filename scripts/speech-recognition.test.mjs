import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSpeechAttempt } from '../lib/speech-recognition.ts';
function fixture() {
  const timers = new Map(); let id = 0; const statuses=[], errors=[], results=[], transcripts=[];
  const recognition = { start(){}, stop(){}, abort(){} };
  const attempt = createSpeechAttempt({ recognition, onStatus:s=>statuses.push(s), onError:e=>errors.push(e), onResult:r=>results.push(r), onTranscript:t=>transcripts.push(t), schedule:fn=>{timers.set(++id,fn);return id;}, cancel:key=>timers.delete(key) });
  const expire = () => { const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn()); };
  return {attempt,recognition,statuses,errors,results,transcripts,expire,timers};
}
test('a permission/start stall releases controls and explains the problem',()=>{const f=fixture();f.attempt.start();assert.equal(f.statuses.at(-1),'starting');f.expire();assert.equal(f.statuses.at(-1),'idle');assert.match(f.errors.at(-1),/permiso/i);});
test('ending without a result reports silence instead of silently doing nothing',()=>{const f=fixture();f.attempt.start();f.recognition.onstart();f.recognition.onend();assert.equal(f.statuses.at(-1),'idle');assert.match(f.errors.at(-1),/voz/i);});
test('network and permission failures give different actionable errors',()=>{for(const [error,pattern]of [['network',/conexión/i],['not-allowed',/permiso/i],['audio-capture',/micrófono/i]]){const f=fixture();f.attempt.start();f.recognition.onerror({error});f.recognition.onend();assert.equal(f.errors.length,1);assert.match(f.errors[0],pattern);assert.equal(f.statuses.at(-1),'idle');}});
test('interim speech is visible and stopping still accepts the final result',()=>{const f=fixture();f.attempt.start();f.recognition.onstart();const interim=Object.assign([{transcript:'你好'}],{isFinal:false});f.recognition.onresult({resultIndex:0,results:[interim]});assert.deepEqual(f.transcripts,['你好']);assert.equal(f.results.length,0);f.attempt.stop();assert.equal(f.statuses.at(-1),'processing');const final=Object.assign([{transcript:'你好'}],{isFinal:true});f.recognition.onresult({resultIndex:0,results:[final]});assert.deepEqual(f.results,[['你好']]);assert.equal(f.statuses.at(-1),'idle');assert.equal(f.timers.size,0);});
test('cancel/dispose discards late callbacks and releases timers',()=>{const f=fixture();f.attempt.start();f.attempt.dispose();f.recognition.onstart();f.recognition.onerror({error:'aborted'});assert.equal(f.errors.length,0);assert.equal(f.timers.size,0);assert.equal(f.statuses.at(-1),'starting');});
