import type { LibraryItem } from '../app/content.ts';
import { matchesLessonRange, type LessonRange } from '../app/course-lessons.ts';
import { englishFor } from './translations.ts';

export const WRITING_SELECTION_KEY = 'chino-writing-selection:v1';

export function parseWritingSelection(value: string | null): string[] {
  try {
    const parsed: unknown = JSON.parse(value || 'null');
    return Array.isArray(parsed) ? [...new Set(parsed.filter((id): id is string => typeof id === 'string'))] : [];
  } catch { return []; }
}

export function resolveWritingSelection(items: LibraryItem[], ids: string[]) {
  const byId = new Map(items.filter(item => /\p{Script=Han}/u.test(item.hanzi)).map(item => [item.id, item]));
  return [...new Set(ids)].flatMap(id => byId.has(id) ? [byId.get(id)!] : []);
}

const searchText = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/\s+/g, '');

export function writingCandidates(items: LibraryItem[], query: string, kind: 'all' | 'word' | 'phrase', lessons?: LessonRange) {
  const search = searchText(query.trim());
  return items.filter(item => /\p{Script=Han}/u.test(item.hanzi)
    && (kind === 'all' || item.type === kind) && matchesLessonRange(item, lessons)
    && (!search || [item.hanzi, item.pinyin, item.spanish, englishFor(item.hanzi, item.spanish)].some(value => searchText(value).includes(search))));
}
