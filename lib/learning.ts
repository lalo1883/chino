export type Review = { rating: 'difícil' | 'dudosa' | 'fácil'; interval: number; due: number; reviews: number; updatedAt: number };
export const DAY = 86_400_000;

export function scheduleReview(old: Review | undefined, remembered: boolean, now: number): Review {
  // Same-day retries reinforce recall without promoting a card several days ahead.
  const sameDay = Boolean(old && new Date(old.updatedAt).toDateString() === new Date(now).toDateString());
  const interval = !remembered ? 10 / 1440 : sameDay ? Math.max(1, old!.interval) : !old || old.interval < 1 ? 1 : Math.min(180, Math.round(old.interval * 2));
  return { rating: remembered ? 'fácil' : 'difícil', interval, due: now + interval * DAY, reviews: (old?.reviews || 0) + 1, updatedAt: now };
}

export function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const SESSION_SIZES = [6, 12, 24] as const;

export function makeSession<T extends { id: string }>(items: T[], records: Record<string, Review>, now: number, onlyDue = false, size = 12): T[] {
  const due = shuffled(items.filter(item => records[item.id] && records[item.id].due <= now));
  if (onlyDue) return due.slice(0, size);
  const fresh = shuffled(items.filter(item => !records[item.id]));
  const dueShare = Math.round(size * 2 / 3);
  const chosen = [...due.slice(0, dueShare), ...fresh.slice(0, size - Math.min(dueShare, due.length))];
  // Fill spare slots with due cards, never with future reviews.
  return shuffled([...chosen, ...due.slice(dueShare, dueShare + Math.max(0, size - chosen.length))]);
}
