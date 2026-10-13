import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
let env;
before(async () => {
  env = await initializeTestEnvironment({projectId:'demo-chino-web',firestore:{rules:await readFile('firestore.rules','utf8')}});
});
after(async () => { await env?.cleanup(); });
const payload = () => ({records:{},studyDays:[],speed:-15,resetAt:0,updatedAt:serverTimestamp()});
test('only the owner can read or write a progress document; lists are denied',async () => {
  const owner = env.authenticatedContext('owner').firestore();
  const other = env.authenticatedContext('other').firestore();
  const guest = env.unauthenticatedContext().firestore();
  await assertSucceeds(setDoc(doc(owner,'userProgress','owner'),payload()));
  await assertSucceeds(getDoc(doc(owner,'userProgress','owner')));
  await assertFails(getDoc(doc(other,'userProgress','owner')));
  await assertFails(getDoc(doc(guest,'userProgress','owner')));
  await assertFails(setDoc(doc(other,'userProgress','owner'),payload()));
  await assertFails(getDocs(collection(owner,'userProgress')));
});
test('rules reject invalid fields, out-of-range speed, deletes and lower reset markers',async () => {
  const db = env.authenticatedContext('validation').firestore();
  const ref = doc(db,'userProgress','validation');
  await assertFails(setDoc(ref,{...payload(),speed:100}));
  await assertFails(setDoc(ref,{...payload(),extra:'unexpected'}));
  await assertFails(setDoc(ref,{...payload(),updatedAt:0}));
  await assertSucceeds(setDoc(ref,{...payload(),resetAt:20}));
  await assertFails(setDoc(ref,{...payload(),resetAt:10}));
  await assertFails(deleteDoc(ref));
  const result = await getDoc(ref);
  assert.equal(result.data().resetAt,20);
});

test('guests can propose but cannot read private inbox or approve their own changes',async()=>{
 const guest=env.unauthenticatedContext().firestore();
 const ref=doc(guest,'communityInbox','guest-correction');
 const proposal={kind:'correction',status:'pending',hanzi:'你好',pinyin:'nǐ hǎo',original:'Hola',proposed:'Hola, saludo',language:'es',vocabularyType:'word',message:'',author:'',createdAt:serverTimestamp()};
 await assertSucceeds(setDoc(ref,proposal));
 await assertFails(getDoc(ref));await assertFails(getDocs(collection(guest,'communityInbox')));
 await assertFails(setDoc(doc(guest,'communityInbox','self-approved'),{...proposal,status:'approved'}));
 await assertFails(setDoc(doc(guest,'communityInbox','extra'),{...proposal,admin:true}));
 await assertFails(setDoc(doc(guest,'publishedContent','bad'),{hanzi:'你好',meaning:'bad'}));
});
test('only admin claims can atomically approve and publish; private analytics stay private',async()=>{
 const admin=env.authenticatedContext('admin',{admin:true}).firestore();
 const other=env.authenticatedContext('normal').firestore();
 const ref=doc(admin,'communityInbox','guest-correction');
 await assertSucceeds(getDoc(ref));
 const {runTransaction}=await import('firebase/firestore');
 await assertSucceeds(runTransaction(admin,async transaction=>{
  await transaction.get(ref);
  transaction.update(ref,{status:'approved',reviewedAt:serverTimestamp(),reviewNote:'Revisada',approvedText:'Hola, saludo'});
  transaction.set(doc(admin,'publishedContent','es-hello'),{hanzi:'你好',pinyin:'nǐ hǎo',meaning:'Hola, saludo',language:'es',vocabularyType:'word',kind:'correction',proposalId:'guest-correction',publishedAt:serverTimestamp()});
 }));
 await assertSucceeds(getDoc(doc(other,'publishedContent','es-hello')));
 await assertFails(getDocs(collection(other,'userProgress')));
 await assertSucceeds(getDocs(collection(admin,'userProgress')));
 const event={kind:'practice',source:'flashcards',hanzi:'你好',correct:false,visitor:'12345678-1234-1234-1234-123456789012',createdAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(other,'learningEvents','attempt'),event));
 await assertFails(getDocs(collection(other,'learningEvents')));
 await assertSucceeds(getDocs(collection(admin,'learningEvents')));
 await assertFails(setDoc(doc(other,'learningEvents','wrong'),{...event,source:'invalid'}));
});
