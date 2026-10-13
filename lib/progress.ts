export type Review = { rating: 'difícil' | 'dudosa' | 'fácil'; interval: number; due: number; reviews: number; updatedAt: number };
export type StoredProgress = { records: Record<string, Review>; studyDays: string[]; speed: number; resetAt?: number };
const ratings = new Set(['difícil', 'dudosa', 'fácil']);

export function sanitizeProgress(input: unknown): StoredProgress {
  const data = input && typeof input === 'object' && !Array.isArray(input) ? input as Record<string, unknown> : {};
  const records: Record<string, Review> = {};
  if (data.records && typeof data.records === 'object' && !Array.isArray(data.records)) {
    for (const [id, value] of Object.entries(data.records).slice(0, 5000)) {
      if (!id || id.length > 100 || id === '__proto__' || id === 'constructor' || !value || typeof value !== 'object') continue;
      const r = value as Review;
      if (!ratings.has(r.rating) || !Number.isFinite(r.interval) || r.interval < 0 || r.interval > 3650 ||
        !Number.isFinite(r.due) || r.due < 0 || !Number.isInteger(r.reviews) || r.reviews < 0 || r.reviews > 100000 ||
        !Number.isFinite(r.updatedAt) || r.updatedAt < 0) continue;
      records[id] = { rating: r.rating, interval: r.interval, due: r.due, reviews: r.reviews, updatedAt: r.updatedAt };
    }
  }
  const studyDays = Array.isArray(data.studyDays) ? [...new Set(data.studyDays.filter((day): day is string =>
    typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)))].sort().slice(-1000) : [];
  return {
    records, studyDays,
    speed: typeof data.speed === 'number' && Number.isFinite(data.speed) ? Math.max(-40, Math.min(20, Math.round(data.speed))) : -15,
    resetAt: typeof data.resetAt === 'number' && Number.isFinite(data.resetAt) && data.resetAt >= 0 ? data.resetAt : 0,
  };
}

/** A reset tombstone prevents another device from restoring deleted reviews. */
export function mergeProgress(localInput: StoredProgress, remoteInput: StoredProgress): StoredProgress {
  const local = sanitizeProgress(localInput);
  const remote = sanitizeProgress(remoteInput);
  const resetAt = Math.max(local.resetAt || 0, remote.resetAt || 0);
  const records: Record<string, Review> = {};
  for (const source of [remote.records, local.records]) {
    for (const [id, review] of Object.entries(source)) {
      if (resetAt > 0 && review.updatedAt <= resetAt) continue;
      if (!records[id] || review.updatedAt > records[id].updatedAt) records[id] = review;
    }
  }
  const survivingDays = new Set(Object.values(records).map(review => {
    const date = new Date(review.updatedAt);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }));
  const daysAfterReset = (source: StoredProgress) => (source.resetAt || 0) >= resetAt
    ? source.studyDays : source.studyDays.filter(day => survivingDays.has(day));
  const studyDays = [...new Set([...daysAfterReset(local), ...daysAfterReset(remote)])].sort().slice(-1000);
  return { records, studyDays, speed: local.speed, resetAt };
}
