'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LibraryItem } from '@/app/content';
import type { LessonRange } from '@/app/course-lessons';
import { writingCandidates } from '@/lib/writing-selection';
import { meaningFor } from '@/lib/translations';
import { useLanguage } from './language-provider';
import { LessonFilter } from './lesson-filter';

export function WritingSelection({ items, selected, onSave, onClose }: {
  items: LibraryItem[]; selected: string[]; onSave: (ids: string[]) => void; onClose: () => void;
}) {
  const { language } = useLanguage();
  const text = (es: string, en: string) => language === 'en' ? en : es;
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(() => new Set(selected));
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'word' | 'phrase'>('all');
  const [lessons, setLessons] = useState<LessonRange>();
  const [onlySelected, setOnlySelected] = useState(false);
  const [limit, setLimit] = useState(40);
  const matches = useMemo(() => writingCandidates(items, query, kind, lessons).filter(item => !onlySelected || draft.has(item.id)), [items, query, kind, lessons, onlySelected, draft]);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className="writing-selection-dialog" aria-labelledby="writing-selection-title" onClose={onClose} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
    <form onSubmit={event => { event.preventDefault(); onSave([...draft]); dialog.current?.close(); }}>
      <header><div><span className="writing-eyebrow">{text('PREPARA TU EXAMEN', 'PREPARE FOR YOUR EXAM')}</span><h2 id="writing-selection-title">{text('Elige qué estudiar', 'Choose what to study')}</h2></div><button type="button" onClick={() => dialog.current?.close()} aria-label={text('Cerrar sin guardar', 'Close without saving')}>×</button></header>
      <div className="writing-selection-filters">
        <label>{text('Buscar', 'Search')}<input type="search" value={query} placeholder={text('Chino, pinyin o significado', 'Chinese, pinyin or meaning')} onChange={event => { setQuery(event.target.value); setLimit(40); }} /></label>
        <label>{text('Tipo de contenido', 'Content type')}<select value={kind} onChange={event => { setKind(event.target.value as typeof kind); setLimit(40); }}><option value="all">{text('Palabras y frases', 'Words and phrases')}</option><option value="word">{text('Palabras', 'Words')}</option><option value="phrase">{text('Frases', 'Phrases')}</option></select></label>
        <LessonFilter value={lessons} onChange={value => { setLessons(value); setLimit(40); }} />
        <label className="writing-selection-check"><input type="checkbox" checked={onlySelected} onChange={event => { setOnlySelected(event.target.checked); setLimit(40); }} />{text('Solo seleccionadas', 'Selected only')}</label>
      </div>
      <div className="writing-selection-actions"><span role="status">{text('Resultados', 'Results')}: {matches.length} · {text('Selección', 'Selected')}: {draft.size}</span><button type="button" disabled={!matches.length} onClick={() => setDraft(previous => new Set([...previous, ...matches.map(item => item.id)]))}>{text('Añadir resultados', 'Add results')}</button><button type="button" disabled={!draft.size} onClick={() => setDraft(new Set())}>{text('Vaciar selección', 'Clear selection')}</button></div>
      <div className="writing-selection-results">
        {matches.slice(0, limit).map(item => <label key={item.id} className="writing-selection-row"><input type="checkbox" checked={draft.has(item.id)} onChange={() => setDraft(previous => { const next = new Set(previous); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })} /><span><b lang="zh-Hans">{item.hanzi}</b><em lang="zh-Latn-pinyin">{item.pinyin}</em><span>{meaningFor(item, language)}</span><small>{item.type === 'phrase' ? text('Frase', 'Phrase') : text('Palabra', 'Word')}{item.lessons?.length ? ` · ${text('Lección', 'Lesson')} ${item.lessons.join(', ')}` : ''}</small></span></label>)}
        {!matches.length && <p>{text('No hay resultados con estos filtros. Prueba otra búsqueda o lección.', 'No results for these filters. Try another search or lesson.')}</p>}
        {matches.length > limit && <button type="button" onClick={() => setLimit(value => value + 40)}>{text('Mostrar más', 'Show more')}</button>}
      </div>
      <footer><button type="button" onClick={() => dialog.current?.close()}>{text('Cancelar', 'Cancel')}</button><button type="submit" className="writing-next">{draft.size ? text(`Guardar y practicar (${draft.size})`, `Save and practice (${draft.size})`) : text('Guardar selección vacía', 'Save empty selection')}</button></footer>
    </form>
  </dialog>;
}
