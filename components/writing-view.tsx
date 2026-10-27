'use client';
import { useCommunityContent, Translation } from '@/components/community-provider';
import { trackPractice } from '@/lib/community-client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type HanziWriter from 'hanzi-writer';
import type { CharacterJson, HanziWriterOptions } from 'hanzi-writer';
import { type LibraryItem } from '@/app/content';
import { matchesLessonRange, type LessonRange } from '@/app/course-lessons';
import { useLanguage } from './language-provider';
import { StudyPanel } from './study-panel';
import { LessonFilter } from './lesson-filter';
import { playClip } from './library-view';
import './writing-view.css';

type CreateTarget = NonNullable<HanziWriterOptions['rendererOverride']['createRenderTarget']>;
type BoundCallback = Parameters<ReturnType<CreateTarget>['addPointerStartListener']>[0];

// Pointer capture supports pen/touch/mouse without Hanzi Writer's permanent document listeners.
function pointerTarget(element: string | HTMLElement, events: AbortController, width?: string | number | null, height?: string | number | null): ReturnType<CreateTarget> {
  const container = typeof element === 'string' ? document.getElementById(element)! : element;
  const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  node.setAttribute('width', String(width ?? container.clientWidth));
  node.setAttribute('height', String(height ?? container.clientWidth));
  container.appendChild(node);
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  node.appendChild(defs);
  // The SVG renderer consumes svg/defs and recursively creates nested group targets.
  const groupTarget = (svg: SVGElement) => ({
    svg, defs,
    createSubRenderTarget() {
      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      svg.appendChild(group);
      return groupTarget(group);
    },
  });
  const point = (event: MouseEvent) => ({ x: event.clientX - node.getBoundingClientRect().left, y: event.clientY - node.getBoundingClientRect().top });
  let pointer: number | null = null;
  const renderTarget: ReturnType<CreateTarget> & ReturnType<typeof groupTarget> = {
    ...groupTarget(node), node,
    addPointerStartListener(callback: BoundCallback) { node.addEventListener('pointerdown', event => {
      if (pointer !== null || event.button !== 0) return;
      pointer = event.pointerId; node.setPointerCapture(pointer);
      callback({ getPoint: () => point(event), preventDefault: () => event.preventDefault() });
    }, { signal: events.signal }); },
    addPointerMoveListener(callback: BoundCallback) { node.addEventListener('pointermove', event => {
      if (pointer !== event.pointerId) return;
      callback({ getPoint: () => point(event), preventDefault: () => event.preventDefault() });
    }, { signal: events.signal }); },
    addPointerEndListener(callback: () => void) {
      const end = (event: PointerEvent) => { if (pointer !== event.pointerId) return; pointer = null; callback(); };
      node.addEventListener('pointerup', end, { signal: events.signal });
      node.addEventListener('pointercancel', end, { signal: events.signal });
      node.addEventListener('lostpointercapture', end, { signal: events.signal });
    },
    getBoundingClientRect: () => node.getBoundingClientRect(),
    updateDimensions(width: string | number, height: string | number) { node.setAttribute('width', String(width)); node.setAttribute('height', String(height)); },
    _eventify: (event, getPoint) => ({ getPoint: () => getPoint(event), preventDefault: () => event.preventDefault() }),
    _getMousePoint: point,
    _getTouchPoint: event => ({ x: event.touches[0].clientX - node.getBoundingClientRect().left, y: event.touches[0].clientY - node.getBoundingClientRect().top }),
  };
  return renderTarget;
}

type Feedback = { kind: 'ready' | 'correct' | 'mistake' | 'complete'; stroke: number; mistakes: number; total: number };

// Palabras del cuaderno de la lección 9, en el orden de la foto.
const lessonNineWords = ['每天', '点', '半', '起床', '然后', '教室', '上网', '现在', '开', '关'];

function WritingBoard({ character, label, guided, restart, onComplete, onFeedback, onStatus, writerRef }: {
  character: string; label: string; guided: boolean; restart: number; onComplete: () => void;
  onFeedback: (feedback: Feedback) => void; onStatus: (status: 'loading' | 'ready' | 'error') => void;
  writerRef: React.RefObject<HanziWriter | null>;
}) {
  const target = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onComplete, onFeedback, onStatus });
  useEffect(() => { callbacks.current = { onComplete, onFeedback, onStatus }; }, [onComplete, onFeedback, onStatus]);
  useEffect(() => {
    let active = true;
    const events = new AbortController();
    const request = new AbortController();
    let instance: HanziWriter | null = null;
    const element = target.current;
    if (!element) return;
    const colors = () => {
      const style = getComputedStyle(element);
      const value = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
      return {
        strokeColor: value('--writing-stroke', '#006c58'),
        drawingColor: value('--writing-drawing', '#143c34'),
        outlineColor: value('--writing-outline', '#dce9e3'),
        highlightColor: value('--writing-highlight', '#dc9c39'),
        highlightCompleteColor: value('--writing-complete', '#008968'),
      };
    };
    const themeObserver = new MutationObserver(() => {
      if (!instance) return;
      for (const [name, color] of Object.entries(colors())) {
        void instance.updateColor(name as keyof ReturnType<typeof colors>, color, { duration: 0 });
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    callbacks.current.onStatus('loading');
    async function load() {
      try {
        const { default: Writer } = await import('hanzi-writer');
        if (!active || !element) return;
        instance = Writer.create(element, character, {
            rendererOverride: { createRenderTarget: (target, width, height) => pointerTarget(target, events, width, height) },
            onLoadCharDataError: () => undefined,
            width: element.clientWidth, height: element.clientWidth, padding: 24,
            showCharacter: false, showOutline: guided,
            ...colors(),
            drawingWidth: 5, strokeAnimationSpeed: 0.8, delayBetweenStrokes: 220,
            charDataLoader: async (char): Promise<CharacterJson> => {
              // Serve curated stroke data locally; never send handwriting to an external service.
              const response = await fetch(`/hanzi/${encodeURIComponent(char)}.json`, { signal: request.signal });
              if (!response.ok) throw new Error('Character data unavailable');
              return await response.json() as CharacterJson;
            },
          });
        writerRef.current = instance;
        const writer = instance;
        const data = await writer.getCharacterData();
        if (!active) return;
        if (!data) throw new Error('No stroke data');
        if (guided) await writer.showOutline({ duration: 0 }); else await writer.hideOutline({ duration: 0 });
        if (!active) return;
        await writer.hideCharacter({ duration: 0 });
        if (!active) return;
        const total = data.strokes.length;
        callbacks.current.onFeedback({ kind: 'ready', stroke: 0, mistakes: 0, total });
        callbacks.current.onStatus('ready');
        writer.quiz({
          showHintAfterMisses: 2, markStrokeCorrectAfterMisses: false, acceptBackwardsStrokes: false,
          onCorrectStroke: result => { if (active) callbacks.current.onFeedback({ kind: 'correct', stroke: result.strokeNum + 1, mistakes: result.totalMistakes, total }); },
          onMistake: result => { if (active) callbacks.current.onFeedback({ kind: 'mistake', stroke: result.strokeNum, mistakes: result.totalMistakes, total }); },
          onComplete: result => {
            if (!active) return;
            callbacks.current.onFeedback({ kind: 'complete', stroke: total, mistakes: result.totalMistakes, total });
            callbacks.current.onComplete();
          },
        });
      } catch (error) {
        if (active) {
          callbacks.current.onStatus('error');
          if (process.env.NODE_ENV !== 'production') console.error('Writing practice could not initialize', error);
        }
      }
    }
    void load();
    const resize = new ResizeObserver(() => {
      if (writerRef.current && element.clientWidth) writerRef.current.updateDimensions({ width: element.clientWidth, height: element.clientWidth, padding: 24 });
    });
    resize.observe(element);
    return () => {
      active = false; request.abort(); events.abort(); resize.disconnect(); themeObserver.disconnect();
      instance?.cancelQuiz(); void instance?.pauseAnimation();
      if (writerRef.current === instance) writerRef.current = null;
      element.replaceChildren();
    };
  }, [character, guided, restart, writerRef]);
  return <div className="writing-board" ref={target} role="img" aria-label={label} />;
}

export function WritingView({ speed, onPractice }: { speed: number; onPractice?: () => void }) {
  const communityContent=useCommunityContent();
  const { language } = useLanguage();
  const text = (es: string, en: string) => language === 'en' ? en : es;
  const [lessons, setLessons] = useState<LessonRange>();
  const [notebook, setNotebook] = useState(false);
  const [index, setIndex] = useState(0);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [guided, setGuided] = useState(true);
  const [restart, setRestart] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'ready', stroke: 0, mistakes: 0, total: 0 });
  const [finished, setFinished] = useState<Set<number>>(new Set());
  const [animating, setAnimating] = useState(false);
  const writer = useRef<HanziWriter | null>(null);
  const animationRun = useRef(0);
  useEffect(() => () => { animationRun.current++; }, []);
  const notebookItems = useMemo(() => lessonNineWords.flatMap(hanzi => {
    const word = communityContent.find(item => item.type === 'word' && item.hanzi === hanzi && item.lessons?.includes(9));
    return word ? [word] : [];
  }), [communityContent]);
  const items = useMemo(() => notebook ? notebookItems : communityContent.filter(item => item.type === 'word' && matchesLessonRange(item, lessons) && /\p{Script=Han}/u.test(item.hanzi)), [lessons, communityContent, notebook, notebookItems]);
  const item: LibraryItem | undefined = items[index % Math.max(1, items.length)];
  const characters = Array.from(item?.hanzi || '').filter(char => /\p{Script=Han}/u.test(char));
  const character = characters[characterIndex] || characters[0];
  const resetPractice = (nextIndex = 0) => {
    setIndex(nextIndex); setCharacterIndex(0); setFinished(new Set());
    animationRun.current++; setAnimating(false); setStatus('loading'); setRestart(value => value + 1);
  };
  const changeItem = (delta: number) => {
    setIndex(current => (current + delta + items.length) % items.length);
    animationRun.current++; setCharacterIndex(0); setFinished(new Set()); setAnimating(false); setRestart(value => value + 1);
  };
  const animate = async () => {
    if (!writer.current || animating) return;
    const run = ++animationRun.current;
    const instance = writer.current;
    setAnimating(true);
    try {
      instance.cancelQuiz();
      await instance.hideCharacter({ duration: 0 });
      if (run !== animationRun.current) return;
      await instance.animateCharacter();
    } catch {
      // Recover by rebuilding the practice session if animation is interrupted.
    } finally {
      if (run === animationRun.current) { setAnimating(false); setRestart(value => value + 1); }
    }
  };
  let message = text('Dibuja el primer trazo.', 'Draw the first stroke.');
  if (feedback.kind === 'correct') message = text(`Bien. Sigue con el trazo ${feedback.stroke + 1}.`, `Good. Continue with stroke ${feedback.stroke + 1}.`);
  if (feedback.kind === 'mistake') message = text(`Repite el trazo ${feedback.stroke + 1}: revisa la forma y la dirección.`, `Try stroke ${feedback.stroke + 1} again: check its shape and direction.`);
  if (feedback.kind === 'complete') message = text(`¡Carácter completo! ${feedback.mistakes} correcciones.`, `Character complete! ${feedback.mistakes} corrections.`);
  return <section className="writing-view">
    <header className="writing-heading"><div><span className="writing-eyebrow">WRITING · 汉字</span><h1>{text('De pinyin a papel.', 'From pinyin to paper.')}</h1><p>{text('Escribe con el dedo, el mouse o el trackpad. Cada trazo recibe una corrección al instante.', 'Write with your finger, mouse or trackpad. Get instant feedback on every stroke.')}</p></div></header>
    <section className="writing-notebook" aria-labelledby="writing-notebook-title">
      <div className="writing-notebook-heading"><div><span className="writing-eyebrow">{text('LECCIÓN 9 · TU CUADERNO', 'LESSON 9 · YOUR NOTEBOOK')}</span><h2 id="writing-notebook-title">{text('Tus 10 palabras para practicar', 'Your 10 practice words')}</h2><p>{text('Elige una palabra y practica sus caracteres con el pinyin a la vista.', 'Choose a word and practice its characters with the pinyin in view.')}</p></div><button type="button" aria-pressed={notebook} onClick={() => { setNotebook(!notebook); resetPractice(); }}>{notebook ? text('Volver a todas las palabras', 'Back to all words') : text('Practicar estas 10 palabras', 'Practice these 10 words')}</button></div>
      <div className="writing-notebook-words" aria-label={text('Palabras del cuaderno de la lección 9', 'Lesson 9 notebook words')}>
        {notebookItems.map((word, wordIndex) => <button type="button" key={word.id} aria-pressed={notebook && item?.id === word.id} onClick={() => { setNotebook(true); resetPractice(wordIndex); }}><span lang="zh-Hans">{word.hanzi}</span><small lang="zh-Latn-pinyin">{word.pinyin}</small></button>)}
      </div>
    </section>
    <div className="writing-filters"><StudyPanel title={text("Lecciones", "Lessons")} label={lessons ? `${text("Lecciones", "Lessons")} · ${lessons.from}–${lessons.to}` : text("Lecciones", "Lessons")}><LessonFilter value={lessons} onChange={value => { setLessons(value); setNotebook(false); resetPractice(); }} /></StudyPanel></div>
    {!item || !character ? <p>{text('No hay palabras en estas lecciones.', 'No words in these lessons.')}</p> : <div className="writing-workspace">
      <aside className="writing-prompt"><span className="writing-eyebrow">{text('ESCRIBE ESTA PALABRA', 'WRITE THIS WORD')}</span><h2>{item.pinyin}</h2><p><Translation item={item}/></p><button type="button" className="writing-audio" onClick={() => playClip(item.audio, speed)}>{text('♪ Escuchar', '♪ Listen')}</button>
        <div className="writing-character-tabs" aria-label={text('Caracteres de la palabra', 'Characters in this word')}>{characters.map((char, i) => <button type="button" key={`${i}-${char}`} aria-pressed={i === characterIndex} onClick={() => { animationRun.current++; setCharacterIndex(i); setAnimating(false); setRestart(value => value + 1); }}><span>{guided || finished.has(i) ? char : i + 1}</span>{finished.has(i) && <small>✓</small>}</button>)}</div>
        <label className="writing-guide"><input type="checkbox" checked={guided} onChange={event => { animationRun.current++; setAnimating(false); setGuided(event.target.checked); }} />{text('Mostrar guía', 'Show outline')}</label>
        <details className="writing-help"><summary>{text("Cómo practicar", "How to practice")}</summary><p>{text('De arriba hacia abajo, de izquierda a derecha. Se comprueban forma, dirección y orden de los trazos del carácter esperado.', 'Top to bottom, left to right. Shape, direction and stroke order are checked against the expected character.')}</p></details>
      </aside>
      <div className="writing-paper"><div className="writing-paper-top"><span>{text('Carácter', 'Character')} {characterIndex + 1}/{characters.length}</span><span>{feedback.stroke}/{feedback.total} {text('trazos', 'strokes')}</span></div>
        <div className="writing-board-wrap"><WritingBoard label={text(`Área para escribir el carácter ${character}`, `Handwriting area for character ${character}`)} character={character} guided={guided} restart={restart} writerRef={writer} onFeedback={next=>{setFeedback(next);if(next.kind==='complete')trackPractice('writing',item.hanzi,next.mistakes===0);}} onStatus={setStatus} onComplete={() => { setFinished(previous => new Set(previous).add(characterIndex)); onPractice?.(); }} />{status !== 'ready' && <div className="writing-board-overlay" role="status">{status === 'loading' ? text('Cargando trazos…', 'Loading strokes…') : <><p>{text('No se pudieron cargar los trazos.', 'Could not load stroke data.')}</p><button type="button" onClick={() => setRestart(value => value + 1)}>{text('Reintentar', 'Retry')}</button></>}</div>}</div>
        <div className={`writing-feedback ${feedback.kind}`} role="status" aria-live="polite">{status === 'ready' ? message : text('Prepara tu mano; la práctica está por empezar.', 'Get ready to write.')}</div>
        <div className="writing-tools"><button type="button" disabled={status !== 'ready' || animating} onClick={() => void animate()}>{animating ? text('Mostrando…', 'Showing…') : text('Ver trazos', 'Show strokes')}</button><button type="button" disabled={status !== 'ready' || animating} onClick={() => { setFinished(previous => { const next = new Set(previous); next.delete(characterIndex); return next; }); setRestart(value => value + 1); }}>{text('Borrar y repetir', 'Clear & retry')}</button><button type="button" disabled={status !== 'ready' || animating || feedback.kind === 'complete'} onClick={() => void writer.current?.highlightStroke(feedback.stroke)}>{text('Pista', 'Hint')}</button></div>
      </div>
    </div>}
    {items.length > 0 && <footer className="writing-footer"><button type="button" onClick={() => changeItem(-1)}>{text('← Anterior', '← Previous')}</button><span>{index + 1} / {items.length} {text('palabras', 'words')}</span><button type="button" className="writing-next" onClick={() => { if (characterIndex < characters.length - 1) { animationRun.current++; setAnimating(false); setCharacterIndex(value => value + 1); setRestart(value => value + 1); } else changeItem(1); }}>{characterIndex < characters.length - 1 ? text('Siguiente carácter →', 'Next character →') : text('Siguiente palabra →', 'Next word →')}</button></footer>}
    <p className="writing-attribution">{text('Corrección de trazos con', 'Stroke feedback by')} <a href="https://hanziwriter.org/" target="_blank" rel="noreferrer">Hanzi Writer</a> · <a href="/hanzi/ATTRIBUTION.txt" target="_blank" rel="noreferrer">Make Me a Hanzi</a></p>
  </section>;
}
