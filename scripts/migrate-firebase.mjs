import { Pool } from 'pg';
import { initializeApp, applicationDefault, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { Firestore } from '@google-cloud/firestore';
import { OAuth2Client } from 'google-auth-library';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { legacyFirebaseUser, legacyHashOptions } from './legacy-firebase-user.mjs';
import { sanitizeProgress, mergeProgress } from '../lib/progress.ts';

const apply = process.argv.includes('--apply');
const projectId = 'chino-web';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for the one-time import.');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10000 });
let users, accounts, progress;
try {
  await pool.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  users = (await pool.query('SELECT id, name, email, "emailVerified", image FROM "user"')).rows;
  accounts = (await pool.query('SELECT "userId", "providerId", "accountId", password FROM account')).rows;
  progress = (await pool.query('SELECT user_id, records, study_days, speed FROM user_progress')).rows;
  await pool.query('COMMIT');
} finally { await pool.end(); }
// Validate the entire import before any Firebase mutation.
const planned = users.map(user => ({ user, record: legacyFirebaseUser(user, accounts.filter(a => a.userId === user.id)) }));
console.log(JSON.stringify({ projectId, users: users.length, passwordAccounts: planned.filter(p => p.record.passwordHash).length, progressDocuments: progress.length, mode: apply ? 'apply' : 'dry-run' }));
if (!apply) process.exit(0);

// Uses a service account/ADC when configured; otherwise reuses the local CLI login.
let credential, firestoreClient;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) credential = applicationDefault();
else {
  const config = JSON.parse(await readFile(`${homedir()}/.config/configstore/firebase-tools.json`, 'utf8'));
  const cliAuth = await import('firebase-tools/lib/auth.js');
  const cliApi = await import('firebase-tools/lib/api.js');
  const authClient = new OAuth2Client(cliApi.clientId(), cliApi.clientSecret());
  authClient.setCredentials({ refresh_token: config.tokens?.refresh_token });
  firestoreClient = new Firestore({ projectId, authClient });
  credential = {
    async getAccessToken() {
      const token = await cliAuth.getAccessToken(config.tokens?.refresh_token, ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']);
      return { access_token: token.access_token, expires_in: Math.max(60, Math.floor((token.expires_at - Date.now()) / 1000)) };
    },
  };
}
const app = initializeApp({ credential, projectId });
const firebaseAuth = getAuth(app);
const db = firestoreClient || getFirestore(app);
// Preflight both target services before importing accounts.
await firebaseAuth.listUsers(1);
await db.collection('userProgress').limit(1).get();
let imported = 0, existing = 0, synced = 0;
for (const { user, record } of planned) {
  let target;
  try { target = await firebaseAuth.getUserByEmail(user.email); }
  catch (error) { if (error.code !== 'auth/user-not-found') throw error; }
  if (target) {
    if (target.uid !== user.id && !target.emailVerified) throw new Error('An unverified Firebase account collides with a legacy email. Resolve it before importing progress.');
    existing++;
  } else {
    const result = await firebaseAuth.importUsers([record], legacyHashOptions);
    if (result.failureCount) throw new Error(`Account import failed: ${result.errors[0].error.code}`);
    target = { uid: user.id };
    imported++;
  }
  const old = progress.find(p => p.user_id === user.id);
  if (!old) continue;
  const source = sanitizeProgress({ records: old.records, studyDays: old.study_days, speed: old.speed });
  const ref = db.collection('userProgress').doc(target.uid);
  await db.runTransaction(async transaction => {
    const remote = await transaction.get(ref);
    const next = remote.exists ? mergeProgress({ ...source, speed: remote.data().speed }, sanitizeProgress(remote.data())) : source;
    transaction.set(ref, { ...next, updatedAt: FieldValue.serverTimestamp() });
  });
  synced++;
}
console.log(JSON.stringify({ importedUsers: imported, existingUsers: existing, copiedProgress: synced, sourceModified: false }));
await db.terminate();
await deleteApp(app);
process.exit(0);
