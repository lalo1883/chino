'use client';

import { doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from './firebase';
import { mergeProgress, sanitizeProgress, type StoredProgress } from './progress';

function ownProgress(uid: string) {
  if (getFirebaseAuth().currentUser?.uid !== uid) throw new Error('Not signed in as the progress owner');
  if (!navigator.onLine) throw new Error('Offline');
  return doc(getFirebaseDb(), 'userProgress', uid);
}

export async function loadProgress(uid: string) {
  const snapshot = await getDocFromServer(ownProgress(uid));
  return { ...sanitizeProgress(snapshot.data()), hasProgress: snapshot.exists() };
}

export async function saveProgress(uid: string, progress: StoredProgress) {
  const ref = ownProgress(uid);
  return runTransaction(getFirebaseDb(), async transaction => {
    const snapshot = await transaction.get(ref);
    const next = snapshot.exists() ? mergeProgress(progress, sanitizeProgress(snapshot.data())) : sanitizeProgress(progress);
    transaction.set(ref, { ...next, updatedAt: serverTimestamp() });
    return next;
  });
}

export async function clearProgress(uid: string, speed: number, resetAt = Date.now()) {
  const ref = ownProgress(uid);
  return runTransaction(getFirebaseDb(), async transaction => {
    const snapshot = await transaction.get(ref);
    const nextResetAt = Math.max(resetAt, sanitizeProgress(snapshot.data()).resetAt || 0);
    transaction.set(ref, { records: {}, studyDays: [], speed, resetAt: nextResetAt, updatedAt: serverTimestamp() });
    return nextResetAt;
  });
}
