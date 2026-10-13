'use client';

import { useSyncExternalStore } from 'react';
import {
  createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged,
  sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { registerProfile } from './community-client';
import { authErrorMessage } from './auth-errors';

type Session = { user: { id: string; name: string; email: string; emailVerified: boolean } };
type Snapshot = { data: Session | null; isPending: boolean };
const initial: Snapshot = { data: null, isPending: true };
let snapshot = initial;
const listeners = new Set<() => void>();
let unsubscribe: (() => void) | undefined;

function publish(user: User | null) {
  if (user) void registerProfile(user.uid,user.displayName || '').catch(()=>{});
  snapshot = { data: user ? { user: { id: user.uid, name: user.displayName || '', email: user.email || '', emailVerified: user.emailVerified } } : null, isPending: false };
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!unsubscribe) {
    unsubscribe = onAuthStateChanged(getFirebaseAuth(), publish, () => publish(null));
  }
  return () => { listeners.delete(listener); };
}

async function refetchSession() {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  publish(auth.currentUser);
}

function useSession() {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => initial);
  return { ...state, refetch: refetchSession };
}

async function authResult(action: () => Promise<unknown>) {
  try {
    await action();
    return { error: null };
  } catch (error) {
    const code = (error as { code?: string }).code || '';
    return { error: { code, message: authErrorMessage(code), status: code === 'auth/too-many-requests' ? 429 : 400 } };
  }
}

// Keep the existing interface while replacing cookies and PostgreSQL with Firebase.
export const authClient = {
  useSession,
  signIn: {
    email: ({ email, password }: { email: string; password: string }) => authResult(async () => {
      try {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      } catch (error) {
        const code = (error as { code?: string }).code;
        // Legacy Better Auth hashes used NFKC. Native Firebase/reset passwords use raw text.
        if (password.normalize('NFKC') === password || !['auth/invalid-credential', 'auth/wrong-password'].includes(code || '')) throw error;
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password.normalize('NFKC'));
      }
    }),
    social: () => authResult(async () => {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(getFirebaseAuth(), provider);
    }),
  },
  signUp: {
    email: ({ email, password, name }: { email: string; password: string; name: string }) => authResult(async () => {
      if (password.length < 8) throw { code: 'auth/weak-password' };
      const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      await updateProfile(result.user, { displayName: name });
      publish(result.user);
    }),
  },
  resetPassword: (email: string) => authResult(() => sendPasswordResetEmail(getFirebaseAuth(), email)),
  signOut: () => signOut(getFirebaseAuth()),
};
