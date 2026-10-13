'use client';
import { useCommunityContent, Translation } from '@/components/community-provider';
import { trackPractice } from '@/lib/community-client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_CATEGORIES, filterLibrary, type LibraryItem } from '@/app/content';
import { type LessonRange } from '@/app/course-lessons';
import { StudyPanel } from './study-panel';
import { LessonFilter } from '@/components/lesson-filter';
import { playClip, stopClip } from '@/components/library-view';
import { UiIcon } from '@/components/ui-icon';
import { useLanguage } from '@/components/language-provider';
import { createSpeechAttempt, speechErrorMessage, type BrowserSpeechRecognition, type SpeechStatus } from '@/lib/speech-recognition';
import './speak-view.css';

function playLibraryAudio(item: LibraryItem, speed: number) { playClip(item.audio, speed); }

type SpeechResult = { score: number; heard: string; feedback: string };
type NativeSpeech = {
  stop?: () => Promise<void>;
  requestPermissions: () => Promise<{ speechRecognition: string }>;
  start: (options: { language: string; maxResults: number; prompt: string; partialResults: boolean; popup: boolean }) => Promise<{ matches?: string[] }>;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
};

function normalizeChinese(value: string) { return value.replace(/[\s\p{P}\p{S}]/gu, ''); }

function distance(a: string, b: string) {
  const matrix = Array.from({ length: a.length + 1 }, (_, row) => Array.from({ length: b.length + 1 }, (_, column) => row === 0 ? column : column === 0 ? row : 0));
  for (let row = 1; row <= a.length; row++) for (let column = 1; column <= b.length; column++) matrix[row][column] = a[row - 1] === b[column - 1] ? matrix[row - 1][column - 1] : 1 + Math.min(matrix[row - 1][column], matrix[row][column - 1], matrix[row - 1][column - 1]);
  return matrix[a.length][b.length];
}

export function SpeakView({ speed }: { speed: number }) {
  const communityContent=useCommunityContent();
  const { language } = useLanguage();
  const l = (es: string, en: string) => language === 'en' ? en : es;
  const [index, setIndex] = useState(0);
  const [bookMode, setBookMode] = useState(false);
  const [lessons, setLessons] = useState<LessonRange>();
  const [bookKind, setBookKind] = useState<'all' | 'word' | 'phrase'>('all');
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus>('idle');
  const listening = speechStatus !== 'idle';
  const [transcript, setTranscript] = useState('');
  const nativeRef = useRef<{ plugin: NativeSpeech; active: boolean; matches: string[]; pending?: Promise<{ matches?: string[] }> } | null>(null);
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [error, setError] = useState('');
  const attemptRef = useRef<ReturnType<typeof createSpeechAttempt> | null>(null);
  useEffect(() => () => { attemptRef.current?.dispose(); const session = nativeRef.current; if (session) { session.active = false; nativeRef.current = null; void session.plugin.stop?.().catch(() => {}); } }, []);
  const speechItems = useMemo(() => filterLibrary(communityContent, { kind: bookKind, book: bookMode, category: ALL_CATEGORIES, lessons }), [bookMode, bookKind, lessons,communityContent]);
  const phrase = speechItems[index];
  const resetSpeech = () => { setIndex(0); setResult(null); setError(''); setTranscript(''); };
  const selectBook = (value: boolean) => { setBookMode(value); resetSpeech(); };
  const selectKind = (value: 'all' | 'word' | 'phrase') => { setBookKind(value); resetSpeech(); };

  const showResult = (alternatives: string[]) => {
    if (!phrase) return;
    const target = normalizeChinese(phrase.hanzi);
    const ranked = alternatives.map((transcript) => { const heard = normalizeChinese(transcript); const score = Math.max(0, Math.round((1 - distance(target, heard) / Math.max(target.length, heard.length, 1)) * 100)); return { score, heard: transcript }; }).sort((a, b) => b.score - a.score);
    const best = ranked[0] || { score: 0, heard: '' };
    const feedback = best.score >= 90 ? l('¡Muy bien! Se reconocieron tus palabras.', 'Well done! Your words were recognized.') : best.score >= 65 ? l('Casi. Escucha otra vez y repite con un ritmo más claro.', 'Almost. Listen again and repeat with a clearer rhythm.') : l('Inténtalo de nuevo por partes, siguiendo el pinyin.', 'Try again in smaller parts, following the pinyin.');
    trackPractice('speaking',phrase.hanzi,best.score>=90);
    setResult({ ...best, feedback });
  };

  const listenNative = async (native: NativeSpeech) => {
    const session: NonNullable<typeof nativeRef.current> = { plugin: native, active: true, matches: [] }; 
    nativeRef.current = session;
    try {
      if (!phrase) return;
      const permission = await native.requestPermissions();
      if (!session.active) return;
      if (permission.speechRecognition !== 'granted') throw new Error('permission');
      setSpeechStatus('listening');
      while (session.active) {
        session.pending = native.start({ language: 'zh-CN', maxResults: 5, prompt: phrase.hanzi, partialResults: false, popup: false });
        const { matches } = await session.pending;
        if (nativeRef.current !== session) return;
        if (matches?.[0]) { session.matches.push(matches[0]); setTranscript(session.matches.join('')); }
        if (!session.active) return;
        // Native services also end after silence. Restart until the explicit stop.
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch {
      if (session.active) {
        session.active = false;
        setSpeechStatus('idle');
        setError(l('Revisa el permiso del micrófono e inténtalo otra vez.', 'Check microphone permissions and try again.'));
      }
    }
  };

  const stopListening = () => {
    const session = nativeRef.current;
    if (session?.active) {
      session.active = false;
      if (speechStatus === 'starting') {
        nativeRef.current = null;
        setSpeechStatus('idle');
        void session.plugin.stop?.().catch(() => {});
        return;
      }
      setSpeechStatus('processing');
      void (async () => {
        // Bound both stop and final callbacks; some native plugins never settle them.
        await Promise.race([
          Promise.all([session.plugin.stop?.().catch(() => {}), session.pending?.catch(() => {})]),
          new Promise(resolve => setTimeout(resolve, 2000)),
        ]);
        if (nativeRef.current !== session) return;
        nativeRef.current = null;
        setSpeechStatus('idle');
        if (session.matches.length) showResult([session.matches.join('')]);
        else setError(l('No se detectó voz. Inténtalo otra vez.', 'No speech detected. Please try again.'));
      })();
      return;
    }
    attemptRef.current?.stop();
  };

  const listen = () => {
    if (!phrase || listening) return;
    setResult(null); setError(''); setTranscript('');
    nativeRef.current = null;
    stopClip();
    attemptRef.current?.dispose();
    const native = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { SpeechRecognition?: NativeSpeech } } }).Capacitor;
    if (native?.isNativePlatform?.() && native.Plugins?.SpeechRecognition) { setSpeechStatus('starting'); listenNative(native.Plugins.SpeechRecognition); return; }
    if (!window.isSecureContext) { setError(l('El micrófono necesita https o localhost.', 'The microphone requires HTTPS or localhost.')); return; }
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setError(l('Abre la página en Chrome o Safari para usar el micrófono. Los audios siguen disponibles.', 'Open this page in Chrome or Safari to use the microphone. Model audio is still available.')); return; }
    if (!navigator.onLine) { setError(language === 'en' ? englishSpeechError(speechErrorMessage('network')) : speechErrorMessage('network')); return; }
    try {
      const recognition = new Recognition();
      recognition.lang = 'zh-CN'; recognition.continuous = true; recognition.interimResults = true; recognition.maxAlternatives = 5;
      const attempt = createSpeechAttempt({ recognition, onStatus: setSpeechStatus, onTranscript: setTranscript, onResult: showResult, onError: message => setError(language === 'en' ? englishSpeechError(message) : message) });
      attemptRef.current = attempt;
      attempt.start();
    } catch { setSpeechStatus('idle'); setError(l('No se pudo iniciar el micrófono. Prueba Chrome o Safari.', 'Could not start the microphone. Try Chrome or Safari.')); }
  };

  const next = () => { setIndex((current) => speechItems.length ? (current + 1) % speechItems.length : 0); setResult(null); setError(''); setTranscript(''); };
  return <section className="speak-view speak-compact">
    <header className="speak-copy">
      <p className="eyebrow">{l('SPEAKING · PRONUNCIACIÓN', 'SPEAKING · PRONUNCIATION')}</p>
      <h1>{l('Dale voz a tu chino.', 'Give your Chinese a voice.')}</h1>
      <p className="lede">{l('Escucha el modelo, habla a tu ritmo y pulsa de nuevo para comprobar.', 'Listen to the model, speak at your own pace and press again to check.')}</p>
    </header>
    <article className="speak-card">
      <div className="speech-toolbar">
        <div className="seg" role="group" aria-label={l('Contenido', 'Content')}>
          <button type="button" aria-pressed={!bookMode} className={!bookMode ? 'active' : ''} disabled={listening} onClick={() => selectBook(false)}>{l('Biblioteca', 'Library')}</button>
          <button type="button" aria-pressed={bookMode} className={bookMode ? 'active' : ''} disabled={listening} onClick={() => selectBook(true)}>{l('Libro', 'Book')}</button>
        </div>
        <label className="speech-kind-select"><span>{l('Tipo', 'Type')}</span><select value={bookKind} disabled={listening} onChange={event => selectKind(event.target.value as 'all' | 'word' | 'phrase')}><option value="all">{l('Todo', 'All')}</option><option value="word">{l('Palabras', 'Words')}</option><option value="phrase">{l('Frases', 'Phrases')}</option></select></label>
        <div className="speech-lessons"><StudyPanel title={l("Lecciones", "Lessons")} label={`${l("Lecciones", "Lessons")}${lessons ? ` · ${lessons.from}–${lessons.to}` : ""}`}><LessonFilter value={lessons} disabled={listening} onChange={value => { setLessons(value); resetSpeech(); }} /></StudyPanel></div>
      </div>
      {phrase ? <>
        <div className="speak-step">{index + 1} / {speechItems.length}{phrase.lessons?.length ? ` · ${l('Lección', 'Lesson')} ${phrase.lessons.join(', ')}` : ''}</div>
        <progress className="speech-progress" value={index + 1} max={speechItems.length} aria-label={l('Avance de pronunciación', 'Pronunciation progress')} />
        <div className="speak-target"><div className="speak-hanzi" lang="zh-CN">{phrase.hanzi}</div><button className="speak-audio-icon" disabled={listening} onClick={() => playLibraryAudio(phrase, speed)} aria-label={`${l('Escuchar', 'Listen to')} ${phrase.hanzi}`}><UiIcon name="audio" /></button></div>
        <div className="speak-pinyin">{phrase.pinyin}</div><p><Translation item={phrase}/></p>
        <div className="speech-recording">
          <button className={`mic-button ${speechStatus === 'listening' ? 'listening' : ''}`} onClick={() => listening ? stopListening() : listen()} disabled={speechStatus === 'processing'} aria-label={speechStatus === 'starting' ? l('Cancelar activación', 'Cancel activation') : speechStatus === 'listening' ? l('Terminar de hablar', 'Finish speaking') : speechStatus === 'processing' ? l('Comprobando…', 'Checking…') : l('Hablar ahora', 'Speak now')}><UiIcon name={listening ? 'close' : 'mic'} /></button>
          <div><p className="mic-status" aria-live="polite">{speechStatus === 'starting' ? l('Activando micrófono…', 'Starting microphone…') : speechStatus === 'listening' ? l('Escuchando · pulsa para terminar', 'Listening · press to finish') : speechStatus === 'processing' ? l('Comprobando…', 'Checking…') : l('Pulsa para hablar', 'Press to speak')}</p><small>{l('Puedes hacer pausas. Tú decides cuándo terminar.', 'Take your time. You decide when to finish.')}</small></div>
        </div>
        {transcript && <p className="speech-transcript" aria-live="polite"><small>{listening ? l('Voy escuchando', 'Hearing you') : l('Voz detectada', 'Speech detected')}</small><span lang="zh-CN">{transcript}</span></p>}
        {error && <div className="speech-error" role="alert">{error}</div>}
        {result && <div className={`speech-result ${result.score >= 90 ? 'great' : result.score >= 65 ? 'close' : 'retry'}`}><div className="score"><strong>{result.score}</strong><span>/100</span></div><div><b>{result.feedback}</b><p>{l('Escuché:', 'I heard:')} <span lang="zh-CN">{result.heard || '—'}</span></p></div></div>}
        <div className="speech-actions"><button className="listen-model" disabled={listening} onClick={() => playLibraryAudio(phrase, speed)}><UiIcon name="audio" />{l('Modelo', 'Model audio')}</button><button className="next-phrase" disabled={listening} onClick={next}>{l('Siguiente', 'Next')} →</button></div>
        <small className="tone-disclaimer">{l('Compara los caracteres reconocidos; no evalúa cada tono. La app no guarda tus grabaciones.', 'Compares recognized characters; does not assess individual tones. The app does not save recordings.')}</small>
      </> : <p role="status" className="empty">{l('No hay contenido con estos filtros. Prueba otras lecciones.', 'No content for these filters. Try other lessons.')}</p>}
    </article>
  </section>;
}

function englishSpeechError(message: string) {
  const codes = ['not-allowed', 'service-not-allowed', 'network', 'audio-capture', 'language-not-supported', 'no-speech', 'start-timeout', 'result-timeout', 'aborted'];
  const messages = ['Microphone permission is blocked. Allow it in site and device settings, then retry.', 'This browser blocks speech recognition. Open the page in Chrome or Safari.', 'Speech recognition could not connect. Check your connection and try again.', 'Cannot access the microphone. Check your device and close other apps using it.', 'Mandarin recognition is unavailable in this browser. Try Chrome or Safari.', 'No speech detected. Press the microphone and try again.', 'The microphone did not start. Check browser and device permissions.', 'The speech service did not respond. Check your connection and retry.', 'Listening was interrupted. Please try again.'];
  const index = codes.findIndex(code => speechErrorMessage(code) === message);
  return messages[index] || 'Could not start speech recognition. Check the microphone and try again.';
}
