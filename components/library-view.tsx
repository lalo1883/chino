'use client';
import { useCommunityContent, Translation, CorrectTranslation, CommunityLinks } from '@/components/community-provider';

import { useLanguage } from '@/components/language-provider';
import { meaningFor } from '@/lib/translations';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_CATEGORIES, categoriesFor, characterParts, filterLibrary, findWordAudio, getExamples, library, type Example, type LibraryFilter, type LibraryItem, type Segment } from '@/app/content';
import { type LessonRange } from '@/app/course-lessons';
import { StudyPanel } from './study-panel';
import { LessonFilter } from './lesson-filter';
import type { Review } from '@/lib/learning';
import { TappableSentence } from './tappable-sentence';
import { UiIcon } from './ui-icon';

export type PracticeFilter = Omit<LibraryFilter, 'query'>;

let currentClip: HTMLAudioElement | null = null;

export function stopClip() {
  currentClip?.pause(); currentClip = null;
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
}

export function playClip(name: string, speed: number, slow = false, hanzi?: string) {
  stopClip();
  const audio = new Audio(`/audio/${name}.mp3`);
  audio.playbackRate = Math.max(0.5, ((100 + speed) / 85) * (slow ? 0.7 : 1));
  audio.preservesPitch = true;
  currentClip = audio;
  audio.play().catch(() => {
    if (currentClip !== audio || !window.speechSynthesis) return;
    const text = hanzi || library.find(item => item.audio === name)?.hanzi;
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = Math.max(0.5, (1 + speed / 100) * (slow ? 0.7 : 1));
    utterance.voice = window.speechSynthesis.getVoices().find(voice => voice.lang === 'zh-CN') ?? null;
    window.speechSynthesis.speak(utterance);
  });
}

const KINDS = [['all', 'Todo'], ['word', 'Palabras'], ['phrase', 'Frases']] as const;
const KIND_LABEL = { all: 'tarjetas', word: 'palabras', phrase: 'frases' } as const;

export function SegmentTable({ parts, caption, speed }: { parts: Segment[]; caption: string; speed: number }) {
  const { t } = useLanguage();
  return <div className="word-map audible-map" role="table" aria-label={caption}>
    <div className="map-head" role="row"><span role="columnheader">{t("CHINO")}</span><span role="columnheader">{t("PINYIN")}</span><span role="columnheader">{t("ESPAÑOL")}</span></div>
    {parts.map((part, index) => {
      const audio = findWordAudio(part.hanzi);
      return <div className="map-row" role="row" key={`${part.hanzi}-${index}`}><span className="segment-word" role="cell"><b>{part.hanzi}</b>{audio && <button className="segment-audio" type="button" onClick={() => playClip(audio, speed)} aria-label={t(`Escuchar ${part.hanzi}`)} title={t(`Escuchar ${part.hanzi}`)}><UiIcon name="audio" /></button>}</span><em role="cell">{part.pinyin}</em><span role="cell"><Translation item={part}/></span></div>;
    })}
  </div>;
}

function ExampleRow({ example, word, speed, onOpen }: { example: Example; word: string; speed: number; onOpen?: (id: string) => void }) {
  const { t } = useLanguage();
  return <li className="example-row">
    <button className="example-audio" onClick={() => playClip(example.audio, speed)} aria-label={t(`Escuchar ${example.hanzi}`)}>{t("♪")}</button>
    <div>
      <b className="example-hanzi"><TappableSentence hanzi={example.hanzi} breakdown={example.breakdown} speed={speed} highlight={word} /></b>
      <em>{example.pinyin}</em>
      <span><Translation item={example}/></span>
      <div className="example-actions">
        <details><summary>{t("Ver desglose")}</summary><SegmentTable speed={speed} parts={example.breakdown} caption={t(`Desglose de ${example.hanzi}`)} /></details>
        {example.itemId && onOpen && <button className="link-button" onClick={() => onOpen(example.itemId!)}>{t("Abrir tarjeta →")}</button>}
      </div>
    </div>
  </li>;
}

function ItemDetail({ item, speed, onClose, onOpen, onPractice, lessons }: { lessons?: LessonRange; item: LibraryItem; speed: number; onClose: () => void; onOpen: (id: string) => void; onPractice: (filter: PracticeFilter) => void }) {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const examples = useMemo(() => getExamples(item), [item]);
  const characters = useMemo(() => item.type === 'word' ? characterParts(item.hanzi) : [], [item]);
  const parts = item.type === 'phrase' ? item.breakdown || [] : [];
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => { stopClip(); };
  }, []);
  const practice = () => onPractice({ kind: item.type, book: false, category: item.category, lessons });
  return <dialog ref={dialog} className="detail-dialog" onClose={onClose} onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }} aria-label={t(`Detalle de ${item.hanzi}`)}>
    <button className="dialog-close" onClick={() => dialog.current?.close()} aria-label={t("Cerrar")}>{"×"}</button>
    <div className="detail-tags"><span>{item.type === 'word' ? t('PALABRA') : t('FRASE')}</span><span>{t(item.category)}</span>{item.book && <span className="book-tag">{t("LIBRO")}</span>}{item.lessons?.map(lesson => <span key={lesson}>{t("Lección")} {lesson}</span>)}</div>
    <div className={`detail-hanzi ${item.hanzi.length > 4 ? 'long' : ''}`}>{item.type === 'phrase' ? <TappableSentence hanzi={item.hanzi} breakdown={item.breakdown || []} speed={speed} /> : item.hanzi}</div>
    <div className="detail-pinyin">{item.pinyin}</div>
    <h2 className="detail-meaning"><Translation item={item}/></h2>
    <div className="detail-audio"><button onClick={() => playClip(item.audio, speed)}>{t("♪ Escuchar")}</button><button onClick={() => playClip(item.audio, speed, true)}>{t("♪ Más lento")}</button></div>
    {parts.length > 0 && <section><h3>{t("Desglose palabra por palabra")}</h3><SegmentTable speed={speed} parts={parts} caption={t(`Desglose de ${item.hanzi}`)} /></section>}
    {characters.length > 0 && <section><h3>{t("Caracteres que contiene")}</h3><SegmentTable speed={speed} parts={characters} caption={t(`Caracteres de ${item.hanzi}`)} /></section>}
    <section>
      <h3>{item.type === 'word' ? t('Frases de ejemplo') : t('Frases parecidas')}</h3>
      {examples.length ? <ul className="example-list">{examples.map((example) => <ExampleRow key={example.audio} example={example} word={item.type === 'word' ? item.hanzi : ''} speed={speed} onOpen={onOpen} />)}</ul> : <p className="empty">{t("Aún no hay frases parecidas.")}</p>}
    </section>
    <button className="practice-primary" onClick={practice}>{t("Practicar")} {item.type === 'word' ? t('palabras') : t('frases')}  {t("de “")}{t(item.category)}{t("” →")}</button>
  </dialog>;
}

export function LibraryView({ scope, speed, records, onPractice }: { scope: 'all' | 'book'; speed: number; records: Record<string, Review>; onPractice: (filter: PracticeFilter) => void }) {
  const communityContent=useCommunityContent();
  const { language, t } = useLanguage();
  const inBook = scope === 'book';
  const [kind, setKind] = useState<LibraryFilter['kind']>('all');
  const [bookOnly, setBookOnly] = useState(false);
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [lessons, setLessons] = useState<LessonRange>();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const book = inBook || bookOnly;
  const pool = useMemo(() => inBook ? communityContent.filter((item) => item.book) : communityContent, [inBook,communityContent]);
  const categories = useMemo(() => categoriesFor(pool, kind, book, lessons), [pool, kind, book, lessons]);
  const activeCategory = categories.some(([name]) => name === category) ? category : ALL_CATEGORIES;
  const filter: LibraryFilter = { kind, book, category: activeCategory, query: search, lessons };
  const filtered = useMemo(() => filterLibrary(pool, filter), [pool, kind, book, activeCategory, search, lessons]); // eslint-disable-line react-hooks/exhaustive-deps
  const words = filtered.filter((item) => item.type === 'word');
  const phrases = filtered.filter((item) => item.type === 'phrase');
  const selected = selectedId ? library.find((item) => item.id === selectedId) || null : null;
  const totals = useMemo(() => ({ words: pool.filter((item) => item.type === 'word').length, phrases: pool.filter((item) => item.type === 'phrase').length }), [pool]);
  const clear = () => { setSearch(''); setCategory(ALL_CATEGORIES); setKind('all'); setBookOnly(false); setLessons(undefined); };
  const filterCount = Number(bookOnly && !inBook) + Number(activeCategory !== ALL_CATEGORIES) + Number(Boolean(lessons));
  const practiceNow = () => onPractice({ kind, book, category: activeCategory, lessons });

  const card = (item: LibraryItem, n: number) => <article key={item.id} className={`item-card ${item.type} ${records[item.id] ? 'seen' : ''}`} style={{ '--n': n } as React.CSSProperties}>
    <button className="item-open" onClick={() => setSelectedId(item.id)} aria-label={t(`Ver detalle de ${item.hanzi}, ${meaningFor(item, language)}`)}>
      <span className="item-hanzi">{item.hanzi}</span><em>{item.pinyin}</em><strong>{meaningFor(item, language)}</strong>
      <small>{t(item.category)}{item.lessons?.length ? t(` · Lección ${item.lessons.join(', ')}`) : item.book && !inBook ? t(' · Libro') : ''}</small>
    </button>
    <CorrectTranslation item={item}/>
    <button className="item-audio" onClick={() => playClip(item.audio, speed)} aria-label={t(`Escuchar ${item.hanzi}`)}>{t("♪")}</button>
  </article>;

  return <section className="library-view words-view">
    <div className="library-hero"><div>
      <p className="eyebrow">{inBook ? t('TU LIBRO') : t('DICCIONARIO VISUAL')}</p>
      <h1>{inBook ? t('Libro') : t('Palabras')}</h1>
      <CommunityLinks/>
      <p className="lede">{totals.words} {t('palabras')} · {totals.phrases} {t('frases')}</p>
    </div><div className="library-count" role="status"><strong>{filtered.length}</strong><span>{t("resultados")}</span></div></div>
    <div className="search-row">
      <div className="search-field"><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t("Buscar: agua, shuǐ, 水…")} aria-label={t("Buscar")} type="search" enterKeyHint="search" autoComplete="off" />{search && <button type="button" className="search-clear" onClick={() => setSearch('')} aria-label={t("Borrar búsqueda")}>×</button>}</div>
      <StudyPanel title={t('Filtros')} label={`${t('Filtros')}${filterCount ? ` · ${filterCount}` : ''}`}>
        {!inBook && <div className="seg" role="group" aria-label={t("Origen")}><button aria-pressed={!bookOnly} className={!bookOnly ? 'active' : ''} onClick={() => setBookOnly(false)}>{t("Todo")}</button><button aria-pressed={bookOnly} className={bookOnly ? 'active' : ''} onClick={() => setBookOnly(true)}>{t("Solo libro")}</button></div>}
        <label className="filter-label">{t('Filtrar por categoría')}<select value={activeCategory} onChange={event => setCategory(event.target.value)}><option value={ALL_CATEGORIES}>{t('Todos los temas')}</option>{categories.map(([name, count]) => <option key={name} value={name}>{t(name)} ({count})</option>)}</select></label>
        <LessonFilter value={lessons} onChange={setLessons} />
        <button className="practice-secondary" onClick={() => { setCategory(ALL_CATEGORIES); setBookOnly(false); setLessons(undefined); }}>{t('Limpiar filtros')}</button>
      </StudyPanel>
    </div>
    <div className="filter-stack"><div className="seg" role="group" aria-label={t("Tipo de tarjeta")}>{KINDS.map(([value, label]) => <button key={value} aria-pressed={kind === value} className={kind === value ? 'active' : ''} onClick={() => setKind(value)}>{t(label)}</button>)}</div>
    {(bookOnly || lessons || activeCategory !== ALL_CATEGORIES) && <small className="active-filter-summary">{book ? t('Solo libro') : t('Todo')} · {t(activeCategory)}{lessons ? ` · ${lessons.from}–${lessons.to}` : ''}</small>}</div>

    {filtered.length ? <>
      {words.length > 0 && <>{kind === 'all' && <h2 className="grid-title">{t("Palabras")}<small>{words.length}</small></h2>}<div className="word-grid">{words.map(card)}</div></>}
      {phrases.length > 0 && <>{kind === 'all' && <h2 className="grid-title">{t("Frases")}<small>{phrases.length}</small></h2>}<div className="word-grid phrase-grid">{phrases.map(card)}</div></>}
      <button className="practice-primary library-practice" onClick={practiceNow}>{t("Practicar estas")} {filtered.length}  {t(KIND_LABEL[kind])} {t("→")}</button>
    </> : <div className="no-results"><span aria-hidden="true">{t("空")}</span><b>{search ? t(`Sin resultados para “${search}”`) : t('Nada con estos filtros')}</b><p>{t("Prueba con otra palabra, su pinyin o un carácter.")}</p><button onClick={clear}>{t("Limpiar filtros")}</button></div>}

    {selected && <ItemDetail key={selected.id} item={selected} lessons={lessons} speed={speed} onClose={() => setSelectedId(null)} onOpen={setSelectedId} onPractice={onPractice} />}
  </section>;
}
