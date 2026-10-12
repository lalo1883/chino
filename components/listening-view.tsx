'use client';

import { useEffect, useMemo, useState } from 'react';
import { ALL_CATEGORIES, filterLibrary, library, type LibraryItem } from '@/app/content';
import type { LessonRange } from '@/app/course-lessons';
import { listeningChoices, splitToneSyllables, stableHash, withTone } from '@/lib/listening';
import { meaningFor } from '@/lib/translations';
import { useLanguage } from './language-provider';
import { StudyPanel } from './study-panel';
import { LessonFilter } from './lesson-filter';
import { playClip, stopClip } from './library-view';
import { UiIcon } from './ui-icon';
import './listening-view.css';

type Mode = 'meaning' | 'tones';
type Kind = 'all' | 'word' | 'phrase';
const symbols = ['ā', 'á', 'ǎ', 'à', 'a'];

export function ListeningView({ speed }: { speed: number }) {
  const { language } = useLanguage();
  const tr = (es: string, en: string) => language === 'en' ? en : es;
  const [mode, setMode] = useState<Mode>('meaning');
  const [kind, setKind] = useState<Kind>('all');
  const [book, setBook] = useState(false);
  const [lessons, setLessons] = useState<LessonRange>();
  const items = useMemo(() => filterLibrary(library, { kind: mode === 'tones' ? 'word' : kind, book, category: ALL_CATEGORIES, lessons }).filter(item => mode !== 'tones' || splitToneSyllables(item.pinyin, item.hanzi).length > 0), [mode, kind, book, lessons]);
  return <section className="listening-view">
    <header className="listening-heading"><div><p className="eyebrow">LISTENING</p><h1>{tr('Entrena tu oído.', 'Train your ear.')}</h1><p>{tr('Escucha, reconoce y aprende los tonos del mandarín.', 'Listen, recognize and learn Mandarin tones.')}</p></div><span className="listening-count">{items.length} {tr('ejercicios', 'exercises')}</span></header>
    <div className="listening-controls">
      <div className="listening-modes" role="group" aria-label={tr('Ejercicio', 'Exercise')}><button aria-pressed={mode === 'meaning'} onClick={() => setMode('meaning')}>{tr('Escoge el significado', 'Choose the meaning')}</button><button aria-pressed={mode === 'tones'} onClick={() => setMode('tones')}>{tr('Agrega los tonos', 'Add the tones')}</button></div>
      <StudyPanel title={tr("Filtros", "Filters")} label={`${tr("Filtros", "Filters")} · ${book ? tr("Libro", "Book") : tr("Todo", "All")}${lessons ? ` · ${lessons.from}–${lessons.to}` : ""}`}><div className="listening-filter-fields"><label>{tr('Origen', 'Source')}<select value={book ? 'book' : 'all'} onChange={event => setBook(event.target.value === 'book')}><option value="all">{tr('Todo el contenido', 'All content')}</option><option value="book">{tr('Solo libro', 'Book only')}</option></select></label><label>{tr('Tipo', 'Type')}<select value={mode === 'tones' ? 'word' : kind} disabled={mode === 'tones'} onChange={event => setKind(event.target.value as Kind)}><option value="all">{tr('Palabras y frases', 'Words and phrases')}</option><option value="word">{tr('Palabras', 'Words')}</option><option value="phrase">{tr('Frases', 'Phrases')}</option></select></label></div><LessonFilter value={lessons} onChange={setLessons} /></StudyPanel>
    </div>
    {items.length ? <ListeningSession key={`${mode}:${kind}:${book}:${lessons?.from}:${lessons?.to}:${language}`} mode={mode} items={items} speed={speed} /> : <div className="listening-card listening-empty"><h2>{tr('No hay ejercicios con estos filtros.', 'No exercises match these filters.')}</h2><button onClick={() => { setBook(false); setKind('all'); setLessons(undefined); }}>{tr('Mostrar todo', 'Show all')}</button></div>}
  </section>;
}

function ListeningSession({ mode, items, speed }: { mode: Mode; items: LibraryItem[]; speed: number }) {
  const { language } = useLanguage();
  const tr = (es: string, en: string) => language === 'en' ? en : es;
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const ordered = useMemo(() => [...items].sort((a, b) => stableHash(`${round}:${a.id}`) - stableHash(`${round}:${b.id}`)), [items, round]);
  const total = Math.min(10, ordered.length);
  useEffect(() => () => stopClip(), []);
  const restart = () => { stopClip(); setRound(value => value + 1); setIndex(0); setCorrectCount(0); };
  if (index >= total) return <div className="listening-card listening-summary"><span className="listening-summary-icon"><UiIcon name="check" /></span><p className="eyebrow">{tr('SESIÓN COMPLETA', 'SESSION COMPLETE')}</p><h2>{correctCount} / {total}</h2><p>{tr('respuestas correctas', 'correct answers')} · {Math.round(correctCount / total * 100)}%</p><button className="listening-primary" onClick={restart}>{tr('Otra sesión', 'Another session')} <UiIcon name="arrow" /></button><small>{tr('Repetir refuerza tu memoria auditiva.', 'Repetition strengthens your listening memory.')}</small></div>;
  const item = ordered[index];
  return <div className="listening-card"><div className="listening-session-meta"><span>{tr('Ejercicio', 'Exercise')} {index + 1} / {total}</span><span>{correctCount} {tr('aciertos', 'correct')}</span></div><progress value={index} max={total} aria-label={tr('Progreso de la sesión', 'Session progress')} /><ListeningQuestion key={`${round}:${index}`} item={item} mode={mode} speed={speed} pool={items} onNext={correct => { stopClip(); if (correct) setCorrectCount(value => value + 1); setIndex(value => value + 1); }} /></div>;
}

function ListeningQuestion({ item, mode, speed, pool, onNext }: { item: LibraryItem; mode: Mode; speed: number; pool: LibraryItem[]; onNext: (correct: boolean) => void }) {
  const { language } = useLanguage();
  const tr = (es: string, en: string) => language === 'en' ? en : es;
  const [heard, setHeard] = useState(false);
  const [selected, setSelected] = useState<string>();
  const [tones, setTones] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const syllables = useMemo(() => splitToneSyllables(item.pinyin, item.hanzi), [item]);
  const choices = useMemo(() => listeningChoices(item, pool.length > 3 ? pool : library.filter(candidate => candidate.type === item.type), candidate => meaningFor(candidate, language)), [item, pool, language]);
  const correct = mode === 'meaning' ? selected === item.id : syllables.every((syllable, i) => tones[i] === syllable.tone);
  const ready = heard && (mode === 'meaning' ? Boolean(selected) : syllables.every((_, i) => Boolean(tones[i])));
  const listen = (slow = false) => { playClip(item.audio, speed, slow, item.hanzi); setHeard(true); };
  return <div className="listening-question">
    <h2>{mode === 'meaning' ? tr('¿Qué escuchaste?', 'What did you hear?') : tr('¿Qué tonos escuchaste?', 'Which tones did you hear?')}</h2>
    <p className="listening-instruction">{mode === 'meaning' ? tr('Escucha el audio y escoge su significado.', 'Listen to the audio and choose its meaning.') : tr('Escucha y elige el tono de cada sílaba.', 'Listen and choose the tone of each syllable.')}</p>
    <div className="listening-audio"><button className="listening-play" onClick={() => listen()}><UiIcon name="audio" />{heard ? tr('Volver a escuchar', 'Listen again') : tr('Escuchar audio', 'Listen to audio')}</button><button className="listening-slow" onClick={() => listen(true)}>{tr('Más lento', 'Slower')}</button></div>
    {mode === 'meaning' ? <div className="listening-choices" role="group" aria-label={tr('Significados', 'Meanings')}>{choices.map((choice, i) => <button key={choice.id} disabled={checked || !heard} aria-pressed={selected === choice.id} className={`${selected === choice.id ? 'selected' : ''} ${checked && choice.id === item.id ? 'correct' : checked && selected === choice.id ? 'incorrect' : ''}`} onClick={() => setSelected(choice.id)}><span>{String.fromCharCode(65 + i)}</span>{meaningFor(choice, language)}{checked && choice.id === item.id && <UiIcon name="check" />}</button>)}</div> : <div className="listening-tones">{syllables.map((syllable, i) => <fieldset key={i} disabled={checked || !heard} className={checked ? tones[i] === syllable.tone ? 'correct' : 'incorrect' : ''}><legend>{tones[i] ? withTone(syllable.base, tones[i]) : syllable.base}</legend><div>{symbols.map((symbol, tone) => <button key={tone} aria-pressed={tones[i] === tone + 1} aria-label={`${syllable.base}: ${tone === 4 ? tr('tono neutro', 'neutral tone') : `${tr('tono', 'tone')} ${tone + 1}`}`} title={tone === 4 ? tr('Neutro', 'Neutral') : `${tr('Tono', 'Tone')} ${tone + 1}`} onClick={() => setTones(value => { const next = [...value]; next[i] = tone + 1; return next; })}><b>{symbol}</b><small>{tone === 4 ? '·' : tone + 1}</small></button>)}</div>{checked && <small>{tr('Correcto:', 'Correct:')} {withTone(syllable.base, syllable.tone)}</small>}</fieldset>)}</div>}
    {!heard && <p className="listening-hint">{tr('Primero escucha el audio para responder.', 'Listen to the audio before answering.')}</p>}
    {checked && <div className={`listening-feedback ${correct ? 'correct' : 'incorrect'}`} role="status"><strong>{correct ? tr('¡Correcto!', 'Correct!') : tr('Sigue practicando.', 'Keep practicing.')}</strong><p><b lang="zh-Hans">{item.hanzi}</b> <em>{item.pinyin}</em> · {meaningFor(item, language)}</p>{mode === 'tones' && <small>{tr('Usamos los tonos escritos del pinyin; al hablar pueden cambiar por los tonos vecinos.', 'We use the written pinyin tones; neighboring tones can change their spoken sound.')}</small>}</div>}
    <div className="listening-bottom">{checked ? <button autoFocus className="listening-primary" onClick={() => onNext(correct)}>{tr('Siguiente', 'Next')} <UiIcon name="arrow" /></button> : <button className="listening-primary" disabled={!ready} onClick={() => setChecked(true)}>{tr('Comprobar', 'Check answer')} <UiIcon name="check" /></button>}</div>
  </div>;
}
