export type ProposalKind = 'correction' | 'vocabulary' | 'suggestion';
export type Proposal = {
  kind: ProposalKind; status: 'pending' | 'approved' | 'rejected';
  hanzi: string; pinyin: string; original: string; proposed: string;
  language: 'es' | 'en'; vocabularyType: 'word' | 'phrase';
  message: string; author: string; createdAt?: unknown;
};
export type PublishedEntry = { hanzi: string; pinyin: string; meaning: string; language: 'es' | 'en'; vocabularyType: 'word' | 'phrase'; kind: 'correction' | 'vocabulary' };
export function validateProposal(value: Proposal): string {
  if (!['correction','vocabulary','suggestion'].includes(value.kind)) return 'Elige un tipo de propuesta.';
  if (!['es','en'].includes(value.language)) return 'Elige el idioma de la traducción.';
  if (value.kind !== 'suggestion' && (!value.hanzi.trim() || !value.proposed.trim())) return 'Completa el chino y su traducción.';
  if (value.kind === 'vocabulary' && !value.pinyin.trim()) return 'Agrega el pinyin del vocabulario.';
  if (value.kind === 'suggestion' && !value.message.trim()) return 'Escribe tu sugerencia.';
  if (value.hanzi.length > 150 || value.pinyin.length > 250 || value.original.length > 1000 || value.proposed.length > 1000 || value.message.length > 2000 || value.author.length > 80) return 'Tu propuesta supera el límite de texto.';
  return '';
}
export type LearningEvent = { source: string; hanzi: string; correct: boolean; visitor: string; kind: 'visit' | 'practice' };
export function summarizeEvents(events: LearningEvent[]) {
  const practices = events.filter(event => event.kind === 'practice');
  const byItem = new Map<string, {hanzi:string; source:string; attempts:number; errors:number}>();
  for (const event of practices) {
    const key = `${event.source}:${event.hanzi}`;
    const row = byItem.get(key) || {hanzi:event.hanzi,source:event.source,attempts:0,errors:0};
    row.attempts++; if (!event.correct) row.errors++; byItem.set(key,row);
  }
  return {visitors:new Set(events.filter(e=>e.kind==='visit').map(e=>e.visitor)).size, attempts:practices.length, errors:practices.filter(e=>!e.correct).length, hardest:[...byItem.values()].sort((a,b)=>b.errors-a.errors || b.attempts-a.attempts)};
}
