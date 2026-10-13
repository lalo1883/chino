'use client';
import { useCommunityContent, Translation } from '@/components/community-provider';

import { useLanguage } from '@/components/language-provider';

import { useEffect, useRef, useState } from 'react';
import { ALL_CATEGORIES, categoriesFor, filterLibrary, getExamples, library, type LibraryFilter, type LibraryItem } from '@/app/content';
import { lessonRangeLabel, type LessonRange } from '@/app/course-lessons';
import { StudyPanel } from './study-panel';
import { LessonFilter } from './lesson-filter';
import { makeSession, SESSION_SIZES, type Review } from '@/lib/learning';
import { playClip, stopClip, SegmentTable, type PracticeFilter } from './library-view';
import { TappableSentence } from './tappable-sentence';
import { UiIcon } from './ui-icon';

const KINDS = [['all', 'Todo'], ['word', 'Palabras'], ['phrase', 'Frases']] as const;
const KIND_ICONS = { all: 'grid', word: 'cards', phrase: 'book' } as const;
const KIND_DESCRIPTIONS = { all: 'mezclado', word: 'individuales', phrase: 'completas' } as const;

export function StudySession({ speed, records, onReview, ready, initialFilter }: { speed: number; records: Record<string, Review>; onReview: (id: string, rating: Review['rating']) => void; ready: boolean; initialFilter?: PracticeFilter }) {
  useCommunityContent();
  const { language, t } = useLanguage();
  const [kind, setKind] = useState<LibraryFilter['kind']>(initialFilter?.kind ?? 'all');
  const [bookOnly, setBookOnly] = useState(initialFilter?.book ?? false);
  const [category, setCategory] = useState(initialFilter?.category ?? ALL_CATEGORIES);
  const [lessons, setLessons] = useState<LessonRange | undefined>(initialFilter?.lessons);
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
  const locked = useRef(false);
  const card = queue[position];
  const done = active && !card;
  const categories = categoriesFor(library, kind, bookOnly, lessons);
  const activeCategory = categories.some(([name]) => name === category) ? category : ALL_CATEGORIES;
  const items = filterLibrary(library, { kind, book: bookOnly, category: activeCategory, lessons });
  const example = card?.type === 'word' ? getExamples(card, 1)[0] : undefined;

  const start = (onlyDue = false) => {
    stopClip();
    setQueue(makeSession(items, records, Date.now(), onlyDue, size));
    setPosition(0); setRevealed(false); setActive(true); setCorrect(0); setMissed(0); setNotice('');
    retryIds.current.clear(); locked.current = false; setFeedback(null); setElapsed(0); startedAt.current = Date.now();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const listen = () => {
    if (!card) return;
    playClip(card.audio, speed, false, card.hanzi);
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
    stopClip();
    setNotice(remembered ? '¡Bien! Tu próximo repaso ya está programado.' : willRetry ? 'Vamos paso a paso. Volverás a practicarla en esta sesión.' : 'Ya la reforzaste. Volverá a tus repasos en 10 minutos.');
    setFeedback(remembered);
  };
  const nextCard = () => {
    if (feedback === null) return;
    stopClip();
    setPosition(n => n + 1); setRevealed(false); setFeedback(null); setNotice(''); locked.current = false;
  };
  const exit = () => {
    if (window.confirm(t('¿Salir de la sesión? Tus respuestas ya están guardadas.'))) {
      stopClip(); setActive(false);
    }
  };
  useEffect(() => () => { stopClip(); }, []);
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
      <div className="practice-config-head"><div><h1>{t("Configura tu sesión de práctica")}</h1><p>{t("Elige qué quieres practicar y te preparamos las mejores tarjetas.")}</p></div><div className="selection-tip"><UiIcon name="bulb" /><span>{t("Cuanto más específica sea tu selección,")}<br />{t("más útil será la práctica.")}</span></div></div>
      <div className="practice-config-grid">
        <div className="practice-launch">
          <div className="picker">
            <div className="picker-row"><span id="pick-kind">{t("Tarjetas de")}</span><div className="seg kind-options" role="group" aria-labelledby="pick-kind">{KINDS.map(([value, label]) => <button aria-pressed={kind === value} key={value} className={kind === value ? 'active' : ''} onClick={() => setKind(value)}><UiIcon name={KIND_ICONS[value]} /><span><b>{t(label)}</b><small>{t(KIND_DESCRIPTIONS[value])}</small></span></button>)}</div></div>
            <div className="picker-row"><label htmlFor="pick-category">{t("Con")}</label><select id="pick-category" value={activeCategory} onChange={(event) => setCategory(event.target.value)}><option value={ALL_CATEGORIES}>{t("Todos los temas")}</option>{categories.map(([name, count]) => <option key={name} value={name}>{t(name)} {t("(")}{count}{t(")")}</option>)}</select></div>
            <div className="picker-row"><span id="pick-origin">{t("De dónde")}</span><div className="seg origin-options" role="group" aria-labelledby="pick-origin"><button aria-pressed={!bookOnly} className={!bookOnly ? 'active' : ''} onClick={() => setBookOnly(false)}><UiIcon name="grid" />{t("Todo mi contenido")}</button><button aria-pressed={bookOnly} className={bookOnly ? 'active' : ''} onClick={() => setBookOnly(true)}><UiIcon name="book" />{t("Solo mi libro")}</button></div></div>
            <div className="picker-row"><span>{t("Lecciones")}</span><StudyPanel title={t("Lecciones")} label={t(lessonRangeLabel(lessons))}><LessonFilter value={lessons} onChange={setLessons} /></StudyPanel></div>
            <div className="picker-row"><span id="pick-size">{t("Cantidad de tarjetas")}</span><div className="seg size-options" role="group" aria-labelledby="pick-size">{SESSION_SIZES.map((value) => <button aria-pressed={size === value} key={value} className={size === value ? 'active' : ''} onClick={() => setSize(value)}>{value}</button>)}</div></div>
          </div>
          <button className="practice-primary" disabled={!ready || !items.length} onClick={() => start()}>{ready ? items.length ? <>{t("Empezar mi sesión")}<UiIcon name="arrow" /></> : t('No hay tarjetas con estos filtros') : t('Cargando tu progreso…')}</button><small>{items.length} {t("tarjetas disponibles · Audio, pinyin y español")}</small>
          <button className="practice-secondary" disabled={!ready || !items.length} onClick={() => start(true)}>{t("Solo mis repasos pendientes")}</button>
        </div>
        <details className="practice-preview"><summary>{t("Vista previa")}</summary><p>{t("Tu sesión incluirá:")}</p><ul><li><UiIcon name="cards" />{language === 'en' ? 'Up to' : 'Hasta'} {size}  {t("tarjetas")}</li><li><UiIcon name="book" />{activeCategory === ALL_CATEGORIES ? t('De todos los temas') : t(activeCategory)}</li><li><UiIcon name="grid" />{kind === 'all' ? t('Palabras y frases') : kind === 'word' ? t('Palabras individuales') : t('Frases completas')}</li><li><UiIcon name="audio" />{t("Con audio, pinyin y español")}</li><li><UiIcon name="book" />{t(lessonRangeLabel(lessons))}</li><li><UiIcon name="clock" />{t("Repaso adaptativo")}</li></ul><small>{t("Puedes ajustar estas opciones antes de cada sesión.")}</small></details>
      </div>
    </> : done ? <div className="session-finish"><span className="launch-symbol">{t("好")}</span><p className="eyebrow">{queue.length ? t('SESIÓN COMPLETADA') : t('AL DÍA')}</p><h1>{queue.length ? t('Un paso más adelante.') : t('Todo a su tiempo.')}</h1><p>{queue.length ? t('Cada intento cuenta. Lo que cuesta vuelve antes; lo que recuerdas espera más.') : t('No hay tarjetas pendientes en esta selección. Prueba otro grupo o vuelve cuando toque repasar.')}</p><div className="finish-metrics"><div><b>{correct}</b><span>{t("Las recordaste")}</span></div><div><b>{missed}</b><span>{t("Para reforzar")}</span></div></div><button className="practice-primary" onClick={() => { setActive(false); setNotice(''); }}>{t("Volver a mi práctica")}</button></div> : <div className="session-layout">
      <aside className="session-sidebar"><h2>{t("Sesión de práctica")}</h2><b className="session-count">{position + 1} {"/"}{queue.length}</b><progress className="session-progress" value={position + (feedback !== null ? 1 : 0)} max={queue.length} aria-label={t("Avance de sesión")} /><details className="session-help"><summary>{t("Cómo practicar")}</summary><ol className="session-stages">{['Escucha y adivina', 'Descubre la respuesta', 'Comprueba'].map((label, index) => <li key={label} className={step === index ? 'current' : step > index ? 'complete' : ''} aria-current={step === index ? 'step' : undefined}><span>{step > index ? <UiIcon name="check" /> : index + 1}</span>{t(label)}</li>)}</ol></details><button className="session-exit" onClick={exit}>{t("← Salir de la sesión")}</button></aside>
      <div className="session-center"><article className={`practice-card ${feedback !== null ? 'rated' : ''}`} key={`${card.id}:${position}`}>
        {feedback !== null ? <div className={`recall-feedback ${feedback ? 'remembered' : 'reinforce'}`} role="status"><span><UiIcon name={feedback ? 'check' : 'clock'} /></span><h2>{feedback ? t('¡La recordaste!') : t('Vamos a reforzarla')}</h2><p>{t("Significa:")}</p></div> : <><div className="practice-card-meta"><span>{card.type === 'word' ? t('PALABRA') : t('FRASE')} {"·"}{t(card.category)}{card.lessons?.length ? t(` · Lección ${card.lessons.join(', ')}`) : ''}</span><span>{records[card.id] ? t('Repaso') : t('Nueva')}</span></div><p className="practice-prompt">{t("¿Qué significa?")}</p></>}
        <div className={`practice-hanzi ${card.type === 'phrase' ? 'phrase' : ''}`}>{card.hanzi}</div>
        <button className="practice-listen" onClick={listen} aria-label={t(`Escuchar ${card.hanzi}`)}><UiIcon name="audio" />{t("Escuchar pronunciación")}</button>
        {revealed ? <div className="practice-answer"><div className="deck-pinyin">{card.pinyin}</div><h2><Translation item={card}/></h2>
          {feedback === null && <><p className="recall-question">{t("¿La recordaste antes de ver la respuesta?")}</p><div className="binary-rating"><button onClick={() => answer(false)}><UiIcon name="close" /><span>{t("No me la supe")}<small>{t("La practicamos otra vez")}</small></span></button><button onClick={() => answer(true)}><UiIcon name="check" /><span>{t("Me la supe")}<small>{t("Seguimos avanzando")}</small></span></button></div></>}
          {example && <div className="session-example"><div className="session-example-head">{t("Ejemplo")}</div><div className="practice-example"><button onClick={() => playClip(example.audio, speed)} aria-label={t(`Escuchar ${example.hanzi}`)}><UiIcon name="audio" /></button><div><b><TappableSentence hanzi={example.hanzi} breakdown={example.breakdown} speed={speed} highlight={card.hanzi} /></b><em>{example.pinyin}</em><span><Translation item={example}/></span></div></div></div>}
          <details className="session-breakdown"><summary>{t("Ver desglose")}</summary><SegmentTable parts={card.breakdown || [{hanzi:card.hanzi,pinyin:card.pinyin,meaning:card.spanish}]} caption={t(`Desglose de ${card.hanzi}`)} speed={speed} /></details>
          {feedback !== null && <button className="practice-primary next-card" onClick={nextCard}>{position + 1 === queue.length ? t('Terminar sesión') : t('Siguiente tarjeta')}<UiIcon name="arrow" /></button>}
        </div> : <><p className="practice-tip">{t("Piensa tu respuesta antes de descubrirla.")}</p><button className="practice-primary" onClick={() => setRevealed(true)}>{t("Mostrar respuesta")}<UiIcon name="arrow" /></button></>}
      </article><p role="status" className="session-notice">{t(notice || (feedback !== null ? 'Espacio: siguiente tarjeta' : 'Espacio: mostrar · 1: no me la supe · 2: me la supe'))}</p></div>
      <aside className="session-right"><section className="session-stats"><h2>{t("Tu sesión de hoy")}</h2><ul><li><span className="stat-icon amber"><UiIcon name="cards" /></span><div><b>{viewed}</b><small>{t("tarjetas practicadas")}</small></div></li><li><span className="stat-icon green"><UiIcon name="check" /></span><div><b>{correct}</b><small>{t("recordadas")}</small></div></li><li><span className="stat-icon purple"><UiIcon name="chart" /></span><div><b>{viewed ? t(`${accuracy}%`) : '—'}</b><small>{t("de recuerdo")}</small></div></li><li><span className="stat-icon blue"><UiIcon name="clock" /></span><div><b>{duration}</b><small>{t("de práctica")}</small></div></li></ul></section><details className="session-guide"><summary>{t("Practica con calma")}</summary><span className="guide-symbol"><UiIcon name="bulb" /></span><h2>{t("Practica con calma")}</h2><ol><li><b>{t("Escucha primero")}</b><span>{t("Repite el sonido antes de mirar la respuesta.")}</span></li><li><b>{t("Intenta recordar")}</b><span>{t("Piensa en el significado sin buscar pistas.")}</span></li><li><b>{t("Responde con honestidad")}</b><span>{t("Lo que te cueste volverá antes a tus repasos.")}</span></li></ol><p>{t("Cada intento cuenta. No necesitas acertar todo.")}</p></details></aside>
    </div>}
  </section>;
}
