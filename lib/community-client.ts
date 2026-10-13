'use client';
import { addDoc, collection, doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { validateProposal, type Proposal } from './community';
let visitorId = '';
function visitor() {
  if (visitorId) return visitorId;
  try { visitorId = localStorage.getItem('chino-visitor') || crypto.randomUUID(); localStorage.setItem('chino-visitor',visitorId); }
  catch { visitorId = crypto.randomUUID(); }
  return visitorId;
}
export async function sendProposal(proposal: Proposal) {
  if (!navigator.onLine) throw new Error('No se pudo enviar. Revisa tu conexión e inténtalo otra vez.');
  const error = validateProposal(proposal); if (error) throw new Error(error);
  await addDoc(collection(getFirebaseDb(),'communityInbox'), {...proposal,status:'pending',createdAt:serverTimestamp()});
}
export function trackPractice(source: string, hanzi: string, correct: boolean) {
  if (!navigator.onLine) return;
  void addDoc(collection(getFirebaseDb(),'learningEvents'),{kind:'practice',source,hanzi:hanzi.slice(0,150),correct,visitor:visitor(),createdAt:serverTimestamp()}).catch(()=>{});
}
export function trackVisit() {
  try { if(sessionStorage.getItem('chino-visit-recorded')) return; } catch { /* Private mode. */ }
  void addDoc(collection(getFirebaseDb(),'learningEvents'),{kind:'visit',source:'site',hanzi:'',correct:true,visitor:visitor(),createdAt:serverTimestamp()}).then(()=>{
    try { sessionStorage.setItem('chino-visit-recorded','1'); } catch { /* Private mode. */ }
  }).catch(()=>{});
}
export async function registerProfile(uid: string, name: string) {
  const ref = doc(getFirebaseDb(),'communityProfiles',uid);
  if((await getDoc(ref)).exists()) return;
  await runTransaction(getFirebaseDb(),async transaction=>{
    if(!(await transaction.get(ref)).exists()) transaction.set(ref,{name:name.slice(0,80),createdAt:serverTimestamp()});
  });
}
