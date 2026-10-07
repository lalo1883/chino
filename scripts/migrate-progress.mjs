import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const migration = await readFile(new URL('../db/migrations/001_user_progress.sql', import.meta.url), 'utf8');

try {
  await pool.query(migration);
  console.log('Progress schema is ready.');
} finally {
  await pool.end();
}
