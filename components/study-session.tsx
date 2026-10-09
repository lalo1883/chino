'use client';

import { useEffect, useRef, useState } from 'react';
import { library, type LibraryItem } from '@/app/content';
import { makeSession, type Review } from '@/lib/learning';

export function StudySession({ speed, records, onReview, ready }: { speed: number; records: Record<string, Review>; onReview: (id: string, rating: Review['rating']) => void; ready: boolean }) {
  const [kind, setKind] = useState('all');
  const [queue, setQueue] = useState<LibraryItem[]>([]);
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [active, setActive] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState(0);
  const [notice, setNotice] = useState('');
  const retryIds = useRef(new Set<string>());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const locked = useRef(false);
  const card = queue[position];
  const done = active && !card;
  const items = library.filter(item => kind === 'all' || item.type === kind || (kind === 'book' && (item.category === 'Frases del libro' || /^w-2/.test(item.id))));

  const start = (onlyDue = false) => {
    audioRef.current?.pause();
    setQueue(makeSession(items, records, Date.now(), onlyDue));
    setPosition(0); setRevealed(false); setActive(true); setCorrect(0); setMissed(0); setNotice('');
    retryIds.current.clear(); locked.current = false;
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
    setPosition(n => n + 1); setRevealed(false);
    window.setTimeout(() => { locked.current = false; }, 200);
  };
  useEffect(() => () => { audioRef.current?.pause(); }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!active || !card || event.target instanceof HTMLElement && (event.target.closest('dialog') || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName))) return;
      if (event.code === 'Space') { event.preventDefault(); setRevealed(true); }
      if (event.key === '1') answer(false);
      if (event.key === '2') answer(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return <section className="practice">
    {!active ? <>
      <div className="practice-intro"><p className="eyebrow">TU MOMENTO DE CHINO</p><h1>Un pequeño paso.<br />Una palabra más.</h1><p>Escucha, intenta recordar y comprueba tu respuesta.<br />Una sesión de 12 tarjetas, a tu ritmo.</p></div>
      <div className="practice-launch"><div><span className="launch-symbol">学</span><h2>¿Qué practicamos hoy?</h2><p>Mezclamos las tarjetas y damos prioridad a lo que necesitas repasar.</p></div><div className="practice-options" role="group" aria-label="Contenido de la sesión">{[['all','Un poco de todo'],['word','Palabras'],['phrase','Frases'],['book','Mi libro']].map(([value,label]) => <button aria-pressed={kind === value} key={value} className={kind === value ? 'active' : ''} onClick={() => setKind(value)}>{label}</button>)}</div><button className="practice-primary" disabled={!ready} onClick={() => start()}>{ready ? 'Empezar mi sesión →' : 'Cargando tu progreso…'}</button><button className="practice-secondary" disabled={!ready} onClick={() => start(true)}>Solo mis repasos pendientes</button><small>{items.length} tarjetas disponibles · Audio, pinyin y español</small></div>
      <div className="practice-steps"><div><b>01</b><span>Intenta recordar<small>Mira el carácter sin ver la respuesta.</small></span></div><div><b>02</b><span>Descubre y escucha<small>Entiende cada palabra de la frase.</small></span></div><div><b>03</b><span>Responde con honestidad<small>Tu próxima sesión se adapta a ti.</small></span></div></div>
    </> : done ? <div className="session-finish"><span className="launch-symbol">好</span><p className="eyebrow">{queue.length ? 'SESIÓN COMPLETADA' : 'AL DÍA'}</p><h1>{queue.length ? 'Un paso más adelante.' : 'Todo a su tiempo.'}</h1><p>{queue.length ? 'Cada intento cuenta. Lo que cuesta vuelve antes; lo que recuerdas espera más.' : 'No hay tarjetas pendientes en esta selección. Prueba otro grupo o vuelve cuando toque repasar.'}</p><div className="finish-metrics"><div><b>{correct}</b><span>Las recordaste</span></div><div><b>{missed}</b><span>Para reforzar</span></div></div><button className="practice-primary" onClick={() => { setActive(false); setNotice(''); }}>Volver a mi práctica</button></div> : <>
      <div className="session-top"><button onClick={() => { if (window.confirm('¿Salir de la sesión? Tus respuestas ya están guardadas.')) setActive(false); }}>← Salir</button><span>Sesión de práctica</span><b>{position + 1} / {queue.length}</b></div><progress className="session-progress" value={position} max={queue.length} aria-label="Avance de sesión" />
      <article className="practice-card"><div className="practice-card-meta"><span>{card.type === 'word' ? 'PALABRA' : 'FRASE'} · {card.category}</span><span>{records[card.id] ? 'Repaso' : 'Nueva'}</span></div><p className="practice-prompt">¿Qué significa?</p><div className={`practice-hanzi ${card.type === 'phrase' ? 'phrase' : ''}`}>{card.hanzi}</div><button className="practice-listen" onClick={listen} aria-label={`Escuchar ${card.hanzi}`}>♪ Escuchar pronunciación</button>{revealed ? <div className="practice-answer"><div className="deck-pinyin">{card.pinyin}</div><h2>{card.spanish}</h2><div className="deck-breakdown"><div className="map-head"><span>CHINO</span><span>PINYIN</span><span>ESPAÑOL</span></div>{(card.breakdown || [{hanzi:card.hanzi,pinyin:card.pinyin,meaning:card.spanish}]).map((part,i) => <div className="map-row" key={i}><b>{part.hanzi}</b><em>{part.pinyin}</em><span>{part.meaning}</span></div>)}</div><p className="recall-question">¿La recordaste antes de ver la respuesta?</p><div className="binary-rating"><button onClick={() => answer(false)}>No me la supe <small>La practicamos otra vez</small></button><button onClick={() => answer(true)}>Me la supe <small>Seguimos avanzando</small></button></div></div> : <><p className="practice-tip">Piensa tu respuesta. No pasa nada si aún no la sabes.</p><button className="practice-primary" onClick={() => setRevealed(true)}>Mostrar respuesta</button></>}</article><p role="status" className="session-notice">{notice || 'Espacio: mostrar · 1: no me la supe · 2: me la supe'}</p>
    </>}
  </section>;
}
