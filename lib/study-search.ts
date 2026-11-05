import { englishFor } from './translations.ts';

type SearchableEntry = { hanzi: string; pinyin: string; spanish: string };

const plainText = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/\s+/gu, ' ');

// Search broadly: ü can be entered as u, v or u:, and tone numbers are optional.
// Keep this separate from meanings so numbers in translations remain searchable.
const plainPinyin = (value: string) => plainText(value)
  .replace(/u:|v/gu, 'u')
  .replace(/([a-z])[0-5]/gu, '$1')
  .replace(/[\s'’‘ʼ\-‐‑]+/gu, '');

export function createStudySearch(query: string) {
  const text = plainText(query);
  const pinyin = plainPinyin(query);
  return (item: SearchableEntry) => !text
    || [item.hanzi, item.spanish, englishFor(item.hanzi, item.spanish)].some(value => plainText(value).includes(text))
    || Boolean(pinyin && plainPinyin(item.pinyin).includes(pinyin));
}
