'use client';

import { useEffect, useRef, useState } from 'react';
import { ALL_CATEGORIES, categoriesFor, filterLibrary, getExamples, library, type LibraryFilter, type LibraryItem } from '@/app/content';
import { makeSession, SESSION_SIZES, type Review } from '@/lib/learning';
import { playClip, type PracticeFilter } from './library-view';
import { TappableSentence } from './tappable-sentence';
import { UiIcon } from './ui-icon';

const KINDS = [['all', 'Todo'], ['word', 'Palabras'], ['phrase', 'Frases']] as const;
const KIND_ICONS = { all: 'grid', word: 'cards', phrase: 'book' } as const;
const KIND_DESCRIPTIONS = { all: 'mezclado', word: 'individuales', phrase: 'completas' } as const;

export function StudySession({ speed, records, onReview, ready, initialFilter }: { speed: number; records: Record<string, Review>; onReview: (id: string, rating: Review['rating']) => void; ready: boolean; initialFilter?: PracticeFilter }) {
  const [kind, setKind] = useState<LibraryFilter['kind']>(initialFilter?.kind ?? 'all');
  const [bookOnly, setBookOnly] = useState(initialFilter?.book ?? false);
  const [category, setCategory] = useState(initialFilter?.category ?? ALL_CATEGORIES);
  const [size, setSize] = useState<number>(12);
  const [queue, setQueue] = useState<LibraryItem[]>([]);
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState(0);
  const [notice, setNotice] = useState('');
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);
  const retryIds = useRef(new Set<string>());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const locked = useRef(false);
  const card = queue[position];
  const done = active && !card;
  const categories = categoriesFor(library, kind, bookOnly);
  const activeCategory = categories.some(([name]) => name === category) ? category : ALL_CATEGORIES;
  const items = filterLibrary(library, { kind, book: bookOnly, category: activeCategory });
  const example = card?.type === 'word' ? getExamples(card, 1)[0] : undefined;

  const start = (onlyDue = false) => {
    audioRef.current?.pause();
    setQueue(makeSession(items, records, Date.now(), onlyDue, size));
    setPosition(0); setRevealed(false); setActive(true); setCorrect(0); setMissed(0); setNotice('');
    retryIds.current.clear(); locked.current = false; setFeedback(null); setElapsed(0); startedAt.current = Date.now();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const listen = () => {
    if (!card) return;
    audioRef.current?.pause();
    const audio = new Audio(`/audio/${card.audio}.mp3`);
    audio.playbackRate = (100 + speed) / 85;
    audio.preservesPitch = true; audioRef.current = audio;
    audio.play().catch(() => setNotice('No se pudo reproducir. Intenta escuchar otra vez.'));
  };
  const answer = (remembered: boolean) => {
    if (!revealed || !card || locked.current) return;
    locked.current = true;
    const willRetry = !remembered && !retryIds.current.has(card.id);
    onReview(card.id, remembered ? 'fácil' : 'difícil');
    if (remembered) setCorrect(n => n + 1); else {
      setMissed(n => n + 1);
      if (!retryIds.current.has(card.id)) {
        retryIds.current.add(card.id);
        setQueue(current => { const next = [...current]; next.splice(Math.min(position + 4, next.length), 0, card); return next; });
      }
    }
    audioRef.current?.pause();
    setNotice(remembered ? '¡Bien! Tu próximo repaso ya está programado.' : willRetry ? 'Vamos paso a paso. Volverás a practicarla en esta sesión.' : 'Ya la reforzaste. Volverá a tus repasos en 10 minutos.');
    setFeedback(remembered);
  };
  const nextCard = () => {
    if (feedback === null) return;
    audioRef.current?.pause();
    setPosition(n => n + 1); setRevealed(false); setFeedback(null); setNotice(''); locked.current = false;
  };
  const exit = () => {
    if (window.confirm('¿Salir de la sesión? Tus respuestas ya están guardadas.')) {
      audioRef.current?.pause(); setActive(false);
    }
  };
  useEffect(() => () => { audioRef.current?.pause(); }, []);
  useEffect(() => {
    if (!active || done) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [active, done]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!active || !card || event.target instanceof HTMLElement && (event.target.closest('dialog') || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName))) return;
      if (event.code === 'Space') { event.preventDefault(); if (feedback !== null) nextCard(); else setRevealed(true); }
      if (event.key === '1') answer(false);
      if (event.key === '2') answer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const viewed = correct + missed;
  const accuracy = viewed ? Math.round(correct / viewed * 100) : 0;
  const duration = elapsed < 60 ? `${elapsed} s` : `${Math.floor(elapsed / 60)} min`;
  const step = feedback !== null ? 2 : revealed ? 1 : 0;
  return <section className="practice">
    {!active ? <>
      <div className="practice-config-head"><div><h1>Configura tu sesión de práctica</h1><p>Elige qué quieres practicar y te preparamos las mejores tarjetas.</p></div><div className="selection-tip"><UiIcon name="bulb" /><span>Cuanto más específica sea tu selección,<br />más útil será la práctica.</span></div></div>
      <div className="practice-config-grid">
        <div className="practice-launch">
          <div className="picker">
            <div className="picker-row"><span id="pick-kind">Tarjetas de</span><div className="seg kind-options" role="group" aria-labelledby="pick-kind">{KINDS.map(([value, label]) => <button aria-pressed={kind === value} key={value} className={kind === value ? 'active' : ''} onClick={() => setKind(value)}><UiIcon name={KIND_ICONS[value]} /><span><b>{label}</b><small>{KIND_DESCRIPTIONS[value]}</small></span></button>)}</div></div>
            <div className="picker-row"><label htmlFor="pick-category">Con</label><select id="pick-category" value={activeCategory} onChange={(event) => setCategory(event.target.value)}><option value={ALL_CATEGORIES}>Todos los temas</option>{categories.map(([name, count]) => <option key={name} value={name}>{name} ({count})</option>)}</select></div>
            <div className="picker-row"><span id="pick-origin">De dónde</span><div className="seg origin-options" role="group" aria-labelledby="pick-origin"><button aria-pressed={!bookOnly} className={!bookOnly ? 'active' : ''} onClick={() => setBookOnly(false)}><UiIcon name="grid" />Todo mi contenido</button><button aria-pressed={bookOnly} className={bookOnly ? 'active' : ''} onClick={() => setBookOnly(true)}><UiIcon name="book" />Solo mi libro</button></div></div>
            <div className="picker-row"><span id="pick-size">Cantidad de tarjetas</span><div className="seg size-options" role="group" aria-labelledby="pick-size">{SESSION_SIZES.map((value) => <button aria-pressed={size === value} key={value} className={size === value ? 'active' : ''} onClick={() => setSize(value)}>{value}</button>)}</div></div>
          </div>
          <button className="practice-primary" disabled={!ready || !items.length} onClick={() => start()}>{ready ? items.length ? <>Empezar mi sesión <UiIcon name="arrow" /></> : 'No hay tarjetas con estos filtros' : 'Cargando tu progreso…'}</button><small>{items.length} tarjetas disponibles · Audio, pinyin y español</small>
          <button className="practice-secondary" disabled={!ready || !items.length} onClick={() => start(true)}>Solo mis repasos pendientes</button>
        </div>
        <aside className="practice-preview"><h2>Vista previa</h2><p>Tu sesión incluirá:</p><ul><li><UiIcon name="cards" />Hasta {size} tarjetas</li><li><UiIcon name="book" />{activeCategory === ALL_CATEGORIES ? 'De todos los temas' : activeCategory}</li><li><UiIcon name="grid" />{kind === 'all' ? 'Palabras y frases' : kind === 'word' ? 'Palabras individuales' : 'Frases completas'}</li><li><UiIcon name="audio" />Con audio, pinyin y español</li><li><UiIcon name="clock" />Repaso adaptativo</li></ul><small>Puedes ajustar estas opciones antes de cada sesión.</small></aside>
      </div>
    </> : done ? <div className="session-finish"><span className="launch-symbol">好</span><p className="eyebrow">{queue.length ? 'SESIÓN COMPLETADA' : 'AL DÍA'}</p><h1>{queue.length ? 'Un paso más adelante.' : 'Todo a su tiempo.'}</h1><p>{queue.length ? 'Cada intento cuenta. Lo que cuesta vuelve antes; lo que recuerdas espera más.' : 'No hay tarjetas pendientes en esta selección. Prueba otro grupo o vuelve cuando toque repasar.'}</p><div className="finish-metrics"><div><b>{correct}</b><span>Las recordaste</span></div><div><b>{missed}</b><span>Para reforzar</span></div></div><button className="practice-primary" onClick={() => { setActive(false); setNotice(''); }}>Volver a mi práctica</button></div> : <div className="session-layout">
      <aside className="session-sidebar"><h2>Sesión de práctica</h2><b className="session-count">{position + 1} / {queue.length}</b><progress className="session-progress" value={position + (feedback !== null ? 1 : 0)} max={queue.length} aria-label="Avance de sesión" /><ol className="session-stages">{['Escucha y adivina', 'Descubre la respuesta', 'Comprueba'].map((label, index) => <li key={label} className={step === index ? 'current' : step > index ? 'complete' : ''} aria-current={step === index ? 'step' : undefined}><span>{step > index ? <UiIcon name="check" /> : index + 1}</span>{label}</li>)}</ol><button className="session-exit" onClick={exit}>← Salir de la sesión</button></aside>
      <div className="session-center"><article className={`practice-card ${feedback !== null ? 'rated' : ''}`} key={`${card.id}:${position}`}>
        {feedback !== null ? <div className={`recall-feedback ${feedback ? 'remembered' : 'reinforce'}`} role="status"><span><UiIcon name={feedback ? 'check' : 'clock'} /></span><h2>{feedback ? '¡La recordaste!' : 'Vamos a reforzarla'}</h2><p>Significa:</p></div> : <><div className="practice-card-meta"><span>{card.type === 'word' ? 'PALABRA' : 'FRASE'} · {card.category}</span><span>{records[card.id] ? 'Repaso' : 'Nueva'}</span></div><p className="practice-prompt">¿Qué significa?</p></>}
        <div className={`practice-hanzi ${card.type === 'phrase' ? 'phrase' : ''}`}>{card.hanzi}</div>
        <button className="practice-listen" onClick={listen} aria-label={`Escuchar ${card.hanzi}`}><UiIcon name="audio" />Escuchar pronunciación</button>
        {revealed ? <div className="practice-answer"><div className="deck-pinyin">{card.pinyin}</div><h2>{card.spanish}</h2>
          {feedback === null && <><p className="recall-question">¿La recordaste antes de ver la respuesta?</p><div className="binary-rating"><button onClick={() => answer(false)}><UiIcon name="close" /><span>No me la supe<small>La practicamos otra vez</small></span></button><button onClick={() => answer(true)}><UiIcon name="check" /><span>Me la supe<small>Seguimos avanzando</small></span></button></div></>}
          {example && <div className="session-example"><div className="session-example-head">Ejemplo</div><div className="practice-example"><button onClick={() => playClip(example.audio, speed)} aria-label={`Escuchar ${example.hanzi}`}><UiIcon name="audio" /></button><div><b><TappableSentence hanzi={example.hanzi} breakdown={example.breakdown} speed={speed} highlight={card.hanzi} /></b><em>{example.pinyin}</em><span>{example.spanish}</span></div></div></div>}
          <details className="session-breakdown"><summary>Ver desglose</summary><div className="deck-breakdown"><div className="map-head"><span>CHINO</span><span>PINYIN</span><span>ESPAÑOL</span></div>{(card.breakdown || [{hanzi:card.hanzi,pinyin:card.pinyin,meaning:card.spanish}]).map((part,i) => <div className="map-row" key={i}><b>{part.hanzi}</b><em>{part.pinyin}</em><span>{part.meaning}</span></div>)}</div></details>
          {feedback !== null && <button className="practice-primary next-card" onClick={nextCard}>{position + 1 === queue.length ? 'Terminar sesión' : 'Siguiente tarjeta'}<UiIcon name="arrow" /></button>}
        </div> : <><p className="practice-tip">Piensa tu respuesta antes de descubrirla.</p><button className="practice-primary" onClick={() => setRevealed(true)}>Mostrar respuesta <UiIcon name="arrow" /></button></>}
      </article><p role="status" className="session-notice">{notice || (feedback !== null ? 'Espacio: siguiente tarjeta' : 'Espacio: mostrar · 1: no me la supe · 2: me la supe')}</p></div>
      <aside className="session-right"><section className="session-stats"><h2>Tu sesión de hoy</h2><ul><li><span className="stat-icon amber"><UiIcon name="cards" /></span><div><b>{viewed}</b><small>tarjetas practicadas</small></div></li><li><span className="stat-icon green"><UiIcon name="check" /></span><div><b>{correct}</b><small>recordadas</small></div></li><li><span className="stat-icon purple"><UiIcon name="chart" /></span><div><b>{viewed ? `${accuracy}%` : '—'}</b><small>de recuerdo</small></div></li><li><span className="stat-icon blue"><UiIcon name="clock" /></span><div><b>{duration}</b><small>de práctica</small></div></li></ul></section><section className="session-upcoming"><h2>Siguientes tarjetas</h2><ol>{queue.slice(position + 1, position + 6).map((item, index) => <li key={`${item.id}:${index}`}><span>{position + index + 2}</span><b>{item.hanzi}</b><em>{item.pinyin}</em></li>)}</ol>{position + 1 === queue.length && <p>Última tarjeta. ¡Ya casi!</p>}</section></aside>
    </div>}
  </section>;
}
