'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_CATEGORIES, categoriesFor, characterParts, filterLibrary, findWordAudio, getExamples, library, type Example, type LibraryFilter, type LibraryItem, type Segment } from '@/app/content';
import { type LessonRange } from '@/app/course-lessons';
import { LessonFilter } from './lesson-filter';
import type { Review } from '@/lib/learning';
import { TappableSentence } from './tappable-sentence';
import { UiIcon } from './ui-icon';

export type PracticeFilter = Omit<LibraryFilter, 'query'>;

let currentClip: HTMLAudioElement | null = null;

export function stopClip() { currentClip?.pause(); currentClip = null; }

export function playClip(name: string, speed: number, slow = false) {
  currentClip?.pause();
  const audio = new Audio(`/audio/${name}.mp3`);
  audio.playbackRate = Math.max(0.5, ((100 + speed) / 85) * (slow ? 0.7 : 1));
  audio.preservesPitch = true;
  currentClip = audio;
  audio.play().catch(() => undefined);
}

const KINDS = [['all', 'Todo'], ['word', 'Palabras'], ['phrase', 'Frases']] as const;
const KIND_LABEL = { all: 'tarjetas', word: 'palabras', phrase: 'frases' } as const;

export function SegmentTable({ parts, caption, speed }: { parts: Segment[]; caption: string; speed: number }) {
  return <div className="word-map audible-map" role="table" aria-label={caption}>
    <div className="map-head" role="row"><span role="columnheader">CHINO</span><span role="columnheader">PINYIN</span><span role="columnheader">ESPAÑOL</span></div>
    {parts.map((part, index) => {
      const audio = findWordAudio(part.hanzi);
      return <div className="map-row" role="row" key={`${part.hanzi}-${index}`}><span className="segment-word" role="cell"><b>{part.hanzi}</b>{audio && <button className="segment-audio" type="button" onClick={() => playClip(audio, speed)} aria-label={`Escuchar ${part.hanzi}`} title={`Escuchar ${part.hanzi}`}><UiIcon name="audio" /></button>}</span><em role="cell">{part.pinyin}</em><span role="cell">{part.meaning}</span></div>;
    })}
  </div>;
}

function ExampleRow({ example, word, speed, onOpen }: { example: Example; word: string; speed: number; onOpen?: (id: string) => void }) {
  return <li className="example-row">
    <button className="example-audio" onClick={() => playClip(example.audio, speed)} aria-label={`Escuchar ${example.hanzi}`}>♪</button>
    <div>
      <b className="example-hanzi"><TappableSentence hanzi={example.hanzi} breakdown={example.breakdown} speed={speed} highlight={word} /></b>
      <em>{example.pinyin}</em>
      <span>{example.spanish}</span>
      <div className="example-actions">
        <details><summary>Ver desglose</summary><SegmentTable speed={speed} parts={example.breakdown} caption={`Desglose de ${example.hanzi}`} /></details>
        {example.itemId && onOpen && <button className="link-button" onClick={() => onOpen(example.itemId!)}>Abrir tarjeta →</button>}
      </div>
    </div>
  </li>;
}

function ItemDetail({ item, speed, onClose, onOpen, onPractice, lessons }: { lessons?: LessonRange; item: LibraryItem; speed: number; onClose: () => void; onOpen: (id: string) => void; onPractice: (filter: PracticeFilter) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const examples = useMemo(() => getExamples(item), [item]);
  const characters = useMemo(() => item.type === 'word' ? characterParts(item.hanzi) : [], [item]);
  const parts = item.type === 'phrase' ? item.breakdown || [] : [];
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => { currentClip?.pause(); };
  }, []);
  const practice = () => onPractice({ kind: item.type, book: false, category: item.category, lessons });
  return <dialog ref={dialog} className="detail-dialog" onClose={onClose} onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }} aria-label={`Detalle de ${item.hanzi}`}>
    <button className="dialog-close" onClick={() => dialog.current?.close()} aria-label="Cerrar">×</button>
    <div className="detail-tags"><span>{item.type === 'word' ? 'PALABRA' : 'FRASE'}</span><span>{item.category}</span>{item.book && <span className="book-tag">LIBRO</span>}{item.lessons?.map(lesson => <span key={lesson}>Lección {lesson}</span>)}</div>
    <div className={`detail-hanzi ${item.hanzi.length > 4 ? 'long' : ''}`}>{item.type === 'phrase' ? <TappableSentence hanzi={item.hanzi} breakdown={item.breakdown || []} speed={speed} /> : item.hanzi}</div>
    <div className="detail-pinyin">{item.pinyin}</div>
    <h2 className="detail-meaning">{item.spanish}</h2>
    <div className="detail-audio"><button onClick={() => playClip(item.audio, speed)}>♪ Escuchar</button><button onClick={() => playClip(item.audio, speed, true)}>♪ Más lento</button></div>
    {parts.length > 0 && <section><h3>Desglose palabra por palabra</h3><SegmentTable speed={speed} parts={parts} caption={`Desglose de ${item.hanzi}`} /></section>}
    {characters.length > 0 && <section><h3>Caracteres que contiene</h3><SegmentTable speed={speed} parts={characters} caption={`Caracteres de ${item.hanzi}`} /></section>}
    <section>
      <h3>{item.type === 'word' ? 'Frases de ejemplo' : 'Frases parecidas'}</h3>
      {examples.length ? <ul className="example-list">{examples.map((example) => <ExampleRow key={example.audio} example={example} word={item.type === 'word' ? item.hanzi : ''} speed={speed} onOpen={onOpen} />)}</ul> : <p className="empty">Aún no hay frases parecidas.</p>}
    </section>
    <button className="practice-primary" onClick={practice}>Practicar {item.type === 'word' ? 'palabras' : 'frases'} de “{item.category}” →</button>
  </dialog>;
}

export function LibraryView({ scope, speed, records, onPractice }: { scope: 'all' | 'book'; speed: number; records: Record<string, Review>; onPractice: (filter: PracticeFilter) => void }) {
  const inBook = scope === 'book';
  const [kind, setKind] = useState<LibraryFilter['kind']>('all');
  const [bookOnly, setBookOnly] = useState(false);
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [lessons, setLessons] = useState<LessonRange>();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const book = inBook || bookOnly;
  const pool = useMemo(() => inBook ? library.filter((item) => item.book) : library, [inBook]);
  const categories = useMemo(() => categoriesFor(pool, kind, book, lessons), [pool, kind, book, lessons]);
  const activeCategory = categories.some(([name]) => name === category) ? category : ALL_CATEGORIES;
  const filter: LibraryFilter = { kind, book, category: activeCategory, query: search, lessons };
  const filtered = useMemo(() => filterLibrary(pool, filter), [pool, kind, book, activeCategory, search, lessons]); // eslint-disable-line react-hooks/exhaustive-deps
  const words = filtered.filter((item) => item.type === 'word');
  const phrases = filtered.filter((item) => item.type === 'phrase');
  const selected = selectedId ? library.find((item) => item.id === selectedId) || null : null;
  const totals = useMemo(() => ({ words: pool.filter((item) => item.type === 'word').length, phrases: pool.filter((item) => item.type === 'phrase').length }), [pool]);
  const clear = () => { setSearch(''); setCategory(ALL_CATEGORIES); setKind('all'); setBookOnly(false); setLessons(undefined); };
  const practiceNow = () => onPractice({ kind, book, category: activeCategory, lessons });

  const card = (item: LibraryItem, n: number) => <article key={item.id} className={`item-card ${item.type} ${records[item.id] ? 'seen' : ''}`} style={{ '--n': n } as React.CSSProperties}>
    <button className="item-open" onClick={() => setSelectedId(item.id)} aria-label={`Ver detalle de ${item.hanzi}, ${item.spanish}`}>
      <span className="item-hanzi">{item.hanzi}</span><em>{item.pinyin}</em><strong>{item.spanish}</strong>
      <small>{item.category}{item.lessons?.length ? ` · Lección ${item.lessons.join(', ')}` : item.book && !inBook ? ' · Libro' : ''}</small>
    </button>
    <button className="item-audio" onClick={() => playClip(item.audio, speed)} aria-label={`Escuchar ${item.hanzi}`}>♪</button>
  </article>;

  return <section className="library-view words-view">
    <div className="library-hero"><div>
      <p className="eyebrow">{inBook ? 'TU LIBRO' : 'DICCIONARIO VISUAL'}</p>
      <h1>{inBook ? <><span>Todo lo de</span> <span>tu libro.</span></> : <><span>{totals.words} palabras</span> <span>y {totals.phrases} frases.</span></>}</h1>
      <p className="lede">{inBook ? `Solo el vocabulario y las frases de tus lecciones: ${totals.words} palabras y ${totals.phrases} frases. Toca una tarjeta para ver su desglose y ejemplos.` : 'Busca en chino, pinyin o español. Toca una tarjeta para ver su desglose y frases de ejemplo.'}</p>
    </div><div className="library-count"><strong>{filtered.length}</strong><span>resultados</span></div></div>

    <div className="filter-stack">
      <div className="seg" role="group" aria-label="Tipo de tarjeta">{KINDS.map(([value, label]) => <button key={value} aria-pressed={kind === value} className={kind === value ? 'active' : ''} onClick={() => setKind(value)}>{label}</button>)}</div>
      {!inBook && <div className="seg" role="group" aria-label="Origen"><button aria-pressed={!bookOnly} className={!bookOnly ? 'active' : ''} onClick={() => setBookOnly(false)}>Todo</button><button aria-pressed={bookOnly} className={bookOnly ? 'active' : ''} onClick={() => setBookOnly(true)}>Solo libro</button></div>}
    </div>
    <LessonFilter value={lessons} onChange={setLessons} />
    <div className="search-row">
      <div className="search-field"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar: agua, shuǐ, 水…" aria-label="Buscar" type="search" enterKeyHint="search" autoComplete="off" />{search && <button type="button" className="search-clear" onClick={() => setSearch('')} aria-label="Borrar búsqueda">×</button>}</div>
      <select value={activeCategory} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoría"><option value={ALL_CATEGORIES}>{inBook ? 'Todos los temas' : 'Todas las categorías'}</option>{categories.map(([name, count]) => <option key={name} value={name}>{name} ({count})</option>)}</select>
    </div>

    {filtered.length ? <>
      {words.length > 0 && <>{kind === 'all' && <h2 className="grid-title">Palabras <small>{words.length}</small></h2>}<div className="word-grid">{words.map(card)}</div></>}
      {phrases.length > 0 && <>{kind === 'all' && <h2 className="grid-title">Frases <small>{phrases.length}</small></h2>}<div className="word-grid phrase-grid">{phrases.map(card)}</div></>}
      <button className="practice-primary library-practice" onClick={practiceNow}>Practicar estas {filtered.length} {KIND_LABEL[kind]} →</button>
    </> : <div className="no-results"><span aria-hidden="true">空</span><b>{search ? `Sin resultados para “${search}”` : 'Nada con estos filtros'}</b><p>Prueba con otra palabra, su pinyin o un carácter.</p><button onClick={clear}>Limpiar filtros</button></div>}

    {selected && <ItemDetail key={selected.id} item={selected} lessons={lessons} speed={speed} onClose={() => setSelectedId(null)} onOpen={setSelectedId} onPractice={onPractice} />}
  </section>;
}
