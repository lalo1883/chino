import { auth } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { headers } from 'next/headers';

type Review = {
  rating: 'difícil' | 'dudosa' | 'fácil';
  interval: number;
  due: number;
  reviews: number;
  updatedAt: number;
};

const ratings = new Set<Review['rating']>(['difícil', 'dudosa', 'fácil']);

async function currentUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id;
}

function sanitizeRecords(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

  return Object.fromEntries(
    Object.entries(input)
      .slice(0, 500)
      .filter(([id, value]) => {
        if (!id || id.length > 100 || !value || typeof value !== 'object' || Array.isArray(value)) return false;
        const review = value as Partial<Review>;
        return Boolean(
          review.rating && ratings.has(review.rating) &&
          Number.isFinite(review.interval) && review.interval! >= 0 && review.interval! <= 3650 &&
          Number.isFinite(review.due) && review.due! >= 0 &&
          Number.isInteger(review.reviews) && review.reviews! >= 0 && review.reviews! <= 100_000 &&
          Number.isFinite(review.updatedAt) && review.updatedAt! >= 0,
        );
      }),
  ) as Record<string, Review>;
}

function sanitizeDays(input: unknown) {
  if (!Array.isArray(input)) return [];
  const validDate = /^\d{4}-\d{2}-\d{2}$/;
  return [...new Set(input.filter((day): day is string => typeof day === 'string' && validDate.test(day)))].slice(-1000);
}

function sanitizeSpeed(input: unknown) {
  const speed = typeof input === 'number' && Number.isFinite(input) ? Math.round(input) : -15;
  return Math.max(-40, Math.min(20, speed));
}

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const result = await getPool().query(
    'SELECT records, study_days, speed, updated_at FROM user_progress WHERE user_id = $1',
    [userId],
  );
  const row = result.rows[0];

  return Response.json(row ? {
    hasProgress: true,
    records: row.records,
    studyDays: row.study_days,
    speed: row.speed,
    updatedAt: row.updated_at,
  } : {
    hasProgress: false,
    records: {},
    studyDays: [],
    speed: -15,
  });
}

export async function PUT(request: Request) {
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const records = sanitizeRecords(data.records);
  const studyDays = sanitizeDays(data.studyDays);
  const speed = sanitizeSpeed(data.speed);

  await getPool().query(
    `INSERT INTO user_progress (user_id, records, study_days, speed, updated_at)
     VALUES ($1, $2::jsonb, $3::jsonb, $4, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       records = EXCLUDED.records,
       study_days = EXCLUDED.study_days,
       speed = EXCLUDED.speed,
       updated_at = NOW()`,
    [userId, JSON.stringify(records), JSON.stringify(studyDays), speed],
  );

  return Response.json({ ok: true });
}

export async function DELETE() {
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: 'No autorizado' }, { status: 401 });

  await getPool().query('DELETE FROM user_progress WHERE user_id = $1', [userId]);
  return Response.json({ ok: true });
}
