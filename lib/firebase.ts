import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Firebase web configuration is public. Authorization is enforced by Auth and rules.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBz41YqHp0zr1yCaoeYjtbtw4SPVnb_AnE',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'chino-web.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'chino-web',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'chino-web.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '540610863000',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:540610863000:web:f32cab6b916c172e2bd5ed',
};

export function getFirebaseApp() {
  return getApps().some(app => app.name === '[DEFAULT]') ? getApp() : initializeApp(firebaseConfig);
}

const emulatedAuth = new WeakSet();
const emulatedDb = new WeakSet();
const emulatorsEnabled = () => process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true' && typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

export function getFirebaseAuth() {
  const auth = getAuth(getFirebaseApp());
  if (emulatorsEnabled() && !emulatedAuth.has(auth)) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    emulatedAuth.add(auth);
  }
  return auth;
}
export function getFirebaseDb() {
  const db = getFirestore(getFirebaseApp());
  if (emulatorsEnabled() && !emulatedDb.has(db)) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    emulatedDb.add(db);
  }
  return db;
}
