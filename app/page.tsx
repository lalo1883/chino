'use client';
import { useCommunityContent, Translation, CommunityLinks } from '@/components/community-provider';
import { trackPractice } from '@/lib/community-client';

import { useLanguage } from '@/components/language-provider';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { commonPhrases, commonWords, library } from './content';
import { LibraryView, stopClip, type PracticeFilter } from '@/components/library-view';
import { ThemeToggle } from '@/components/theme-toggle';
import { BrandMark } from '@/components/brand-mark';
import { AccountMenu } from '@/components/account-menu';
import { StudySession } from '@/components/study-session';
import { scheduleReview } from '@/lib/learning';
import { authClient } from '@/lib/auth-client';
import { loadProgress, saveProgress, clearProgress } from '@/lib/firebase-progress';
import { mergeProgress, sanitizeProgress, type StoredProgress } from '@/lib/progress';
import { useOnline } from '@/components/use-online';
import { UiIcon } from '@/components/ui-icon';
import { SpeakView } from '@/components/speak-view';
import { ListeningView } from '@/components/listening-view';
import { WritingView } from '@/components/writing-view';
import { LanguageSwitch } from '@/components/language-provider';
import { StudyPanel } from '@/components/study-panel';

const navIcons: Record<string, React.ReactNode> = {
  learn: <path d="M3 9.6 10 4l7 5.6V16a1 1 0 0 1-1 1h-3.5v-4.2h-5V17H4a1 1 0 0 1-1-1z" />,
  cards: <path d="M6.2 3.4h8.1a1.6 1.6 0 0 1 1.6 1.6v10a1.6 1.6 0 0 1-1.6 1.6H6.2A1.6 1.6 0 0 1 4.6 15V5a1.6 1.6 0 0 1 1.6-1.6Zm1.3 3.9h5.5M7.5 10h5.5M7.5 12.7h3.4" />,
  book: <path d="M4.2 4.4c2.2-.9 4.1-.7 5.8.6v10.8c-1.7-1.3-3.6-1.5-5.8-.6zM15.8 4.4c-2.2-.9-4.1-.7-5.8.6v10.8c1.7-1.3 3.6-1.5 5.8-.6z" />,
  words: <path d="M4 4.6A1.6 1.6 0 0 1 5.6 3H16v14H5.6A1.6 1.6 0 0 1 4 15.4zM16 13.6H5.6M8 6.6h5M8 9.4h5" />,
  speak: <path d="M10 3.2a2.2 2.2 0 0 1 2.2 2.2v4.1a2.2 2.2 0 1 1-4.4 0V5.4A2.2 2.2 0 0 1 10 3.2ZM5.4 9.4a4.6 4.6 0 0 0 9.2 0M10 14v3" />,
  listen: <path d="M3 11V9a7 7 0 0 1 14 0v2M3 10h3v6H3zM14 10h3v6h-3z" />,
  write: <path d="m4 13 9-9 3 3-9 9-4 1zM11 6l3 3M3 18h14" />,
  progress: <path d="M3.6 16.4h12.8M6.2 13.6V8.4M10 13.6V4.6M13.8 13.6v-6" />,
};

function NavIcon({ name }: { name: string }) {
  return <svg className="nav-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{navIcons[name]}</svg>;
}

type Card = { id: string; hanzi: string; pinyin: string; meaning: string; sentence: string; sentencePinyin: string; translation: string; audio: string; tag: string; note: string };
type Unit = { name: string; description: string; goal: string; cards: Card[] };
type Review = { rating: 'difícil' | 'dudosa' | 'fácil'; interval: number; due: number; reviews: number; updatedAt: number };

const units: Unit[] = [
  { name: 'Empieza aquí', description: 'Tus 6 primeras palabras', goal: 'Reconocer las palabras más básicas', cards: [
    { id:'ni-hao', hanzi:'你好', pinyin:'nǐ hǎo', meaning:'Hola', sentence:'你好！', sentencePinyin:'Nǐ hǎo!', translation:'¡Hola!', audio:'begin-ni-hao', tag:'SALUDO', note:'Se usa a cualquier hora del día.' },
    { id:'wo', hanzi:'我', pinyin:'wǒ', meaning:'Yo / me', sentence:'我叫安娜。', sentencePinyin:'Wǒ jiào Ānnà.', translation:'Me llamo Ana.', audio:'begin-wo', tag:'PRONOMBRE', note:'我 (wǒ) significa “yo”. 叫 (jiào) introduce tu nombre.' },
    { id:'ni', hanzi:'你', pinyin:'nǐ', meaning:'Tú', sentence:'你好吗？', sentencePinyin:'Nǐ hǎo ma?', translation:'¿Cómo estás?', audio:'begin-ni', tag:'PRONOMBRE', note:'Forma informal y cotidiana de “tú”.' },
    { id:'shi', hanzi:'是', pinyin:'shì', meaning:'Ser / sí', sentence:'我是学生。', sentencePinyin:'Wǒ shì xuésheng.', translation:'Soy estudiante.', audio:'begin-shi', tag:'VERBO', note:'Une una persona o cosa con lo que es.' },
    { id:'bu', hanzi:'不', pinyin:'bù', meaning:'No', sentence:'我不知道。', sentencePinyin:'Wǒ bù zhīdào.', translation:'No lo sé.', audio:'begin-bu', tag:'NEGACIÓN', note:'Se coloca delante del verbo.' },
    { id:'xie-xie', hanzi:'谢谢', pinyin:'xièxie', meaning:'Gracias', sentence:'谢谢你。', sentencePinyin:'Xièxie nǐ.', translation:'Gracias a ti.', audio:'begin-xie-xie', tag:'CORTESÍA', note:'La segunda sílaba se pronuncia suave.' },
  ]},
  { name: 'Saludos', description: 'Habla con educación', goal: 'Saludar, despedirte y disculparte', cards: [
    { id:'zai-jian', hanzi:'再见', pinyin:'zàijiàn', meaning:'Adiós', sentence:'明天见，再见！', sentencePinyin:'Míngtiān jiàn, zàijiàn!', translation:'Nos vemos mañana, ¡adiós!', audio:'begin-zai-jian', tag:'SALUDO', note:'Literalmente: “volver a ver”.' },
    { id:'qing', hanzi:'请', pinyin:'qǐng', meaning:'Por favor', sentence:'请坐。', sentencePinyin:'Qǐng zuò.', translation:'Siéntate, por favor.', audio:'begin-qing', tag:'CORTESÍA', note:'También puede significar “invitar”.' },
    { id:'dui-bu-qi', hanzi:'对不起', pinyin:'duìbuqǐ', meaning:'Lo siento', sentence:'对不起，我来晚了。', sentencePinyin:'Duìbuqǐ, wǒ lái wǎn le.', translation:'Lo siento, llegué tarde.', audio:'begin-dui-bu-qi', tag:'CORTESÍA', note:'Una disculpa clara y muy útil.' },
    { id:'mei-guan-xi', hanzi:'没关系', pinyin:'méi guānxi', meaning:'No pasa nada', sentence:'没关系。', sentencePinyin:'Méi guānxi.', translation:'No pasa nada.', audio:'begin-mei-guan-xi', tag:'RESPUESTA', note:'Respuesta habitual a una disculpa.' },
    { id:'zao-shang-hao', hanzi:'早上好', pinyin:'zǎoshang hǎo', meaning:'Buenos días', sentence:'老师，早上好！', sentencePinyin:'Lǎoshī, zǎoshang hǎo!', translation:'Profesor, ¡buenos días!', audio:'begin-zao-shang-hao', tag:'SALUDO', note:'Se usa por la mañana.' },
    { id:'wan-an', hanzi:'晚安', pinyin:'wǎn’ān', meaning:'Buenas noches', sentence:'晚安，明天见。', sentencePinyin:'Wǎn’ān, míngtiān jiàn.', translation:'Buenas noches, nos vemos mañana.', audio:'begin-wan-an', tag:'SALUDO', note:'Se dice normalmente al ir a dormir.' },
  ]},
  { name: 'Números', description: 'Cuenta del 1 al 10', goal: 'Reconocer y pronunciar diez números', cards: [
    { id:'yi', hanzi:'一', pinyin:'yī', meaning:'Uno', sentence:'一个人。', sentencePinyin:'Yí ge rén.', translation:'Una persona.', audio:'begin-yi', tag:'NÚMERO', note:'El tono puede cambiar al combinarse.' },
    { id:'er', hanzi:'二', pinyin:'èr', meaning:'Dos', sentence:'二月。', sentencePinyin:'Èr yuè.', translation:'Febrero.', audio:'begin-er', tag:'NÚMERO', note:'Para contar objetos suele usarse 两 (liǎng).' },
    { id:'san', hanzi:'三', pinyin:'sān', meaning:'Tres', sentence:'三杯茶。', sentencePinyin:'Sān bēi chá.', translation:'Tres tazas de té.', audio:'begin-san', tag:'NÚMERO', note:'Primer tono: voz alta y sostenida.' },
    { id:'si', hanzi:'四', pinyin:'sì', meaning:'Cuatro', sentence:'四本书。', sentencePinyin:'Sì běn shū.', translation:'Cuatro libros.', audio:'begin-si', tag:'NÚMERO', note:'Cuarto tono: breve y descendente.' },
    { id:'wu', hanzi:'五', pinyin:'wǔ', meaning:'Cinco', sentence:'五分钟。', sentencePinyin:'Wǔ fēnzhōng.', translation:'Cinco minutos.', audio:'begin-wu', tag:'NÚMERO', note:'Tercer tono: baja y vuelve a subir.' },
    { id:'liu', hanzi:'六', pinyin:'liù', meaning:'Seis', sentence:'六点。', sentencePinyin:'Liù diǎn.', translation:'Las seis en punto.', audio:'begin-liu', tag:'NÚMERO', note:'Empieza con un sonido parecido a “lio”.' },
    { id:'qi', hanzi:'七', pinyin:'qī', meaning:'Siete', sentence:'七天。', sentencePinyin:'Qī tiān.', translation:'Siete días.', audio:'begin-qi', tag:'NÚMERO', note:'Primer tono: agudo y sostenido, como un “chi” alto.' },
    { id:'ba', hanzi:'八', pinyin:'bā', meaning:'Ocho', sentence:'八个人。', sentencePinyin:'Bā ge rén.', translation:'Ocho personas.', audio:'begin-ba', tag:'NÚMERO', note:'Para los chinos es un número de buena suerte.' },
    { id:'jiu', hanzi:'九', pinyin:'jiǔ', meaning:'Nueve', sentence:'九点上课。', sentencePinyin:'Jiǔ diǎn shàngkè.', translation:'La clase es a las nueve.', audio:'begin-jiu', tag:'NÚMERO', note:'Tercer tono: baja y vuelve a subir.' },
    { id:'shi-10', hanzi:'十', pinyin:'shí', meaning:'Diez', sentence:'十块钱。', sentencePinyin:'Shí kuài qián.', translation:'Diez yuanes.', audio:'begin-shi-10', tag:'NÚMERO', note:'Con 十 se forman 11 (十一), 12 (十二)…' },
  ]},
  { name: 'Primeras frases', description: 'Habla desde el día uno', goal: 'Presentarte y pedir ayuda', cards: [
    { id:'wo-jiao', hanzi:'我叫安娜', pinyin:'wǒ jiào Ānnà', meaning:'Me llamo Ana', sentence:'你好，我叫安娜。', sentencePinyin:'Nǐ hǎo, wǒ jiào Ānnà.', translation:'Hola, me llamo Ana.', audio:'begin-wo-jiao', tag:'PRESENTARTE', note:'Cambia 安娜 por tu nombre.' },
    { id:'ni-jiao-shen-me', hanzi:'你叫什么名字？', pinyin:'nǐ jiào shénme míngzi?', meaning:'¿Cómo te llamas?', sentence:'你叫什么名字？', sentencePinyin:'Nǐ jiào shénme míngzi?', translation:'¿Cómo te llamas?', audio:'begin-ni-jiao-shen-me', tag:'PREGUNTA', note:'什么 significa “qué”.' },
    { id:'wo-shi-xi-ban-ya-ren', hanzi:'我是西班牙人', pinyin:'wǒ shì Xībānyá rén', meaning:'Soy español/a', sentence:'我是西班牙人。', sentencePinyin:'Wǒ shì Xībānyá rén.', translation:'Soy español/a.', audio:'begin-wo-shi-xi-ban-ya-ren', tag:'PRESENTARTE', note:'人 significa “persona”.' },
    { id:'wo-bu-ming-bai', hanzi:'我不明白', pinyin:'wǒ bù míngbai', meaning:'No entiendo', sentence:'对不起，我不明白。', sentencePinyin:'Duìbuqǐ, wǒ bù míngbai.', translation:'Lo siento, no entiendo.', audio:'begin-wo-bu-ming-bai', tag:'AYUDA', note:'Una frase esencial cuando estás aprendiendo.' },
    { id:'qing-zai-shuo', hanzi:'请再说一遍', pinyin:'qǐng zài shuō yí biàn', meaning:'Repítelo, por favor', sentence:'请再说一遍。', sentencePinyin:'Qǐng zài shuō yí biàn.', translation:'Repítelo, por favor.', audio:'begin-qing-zai-shuo', tag:'AYUDA', note:'再 significa “otra vez”.' },
    { id:'wo-xiang-he-shui', hanzi:'我想喝水', pinyin:'wǒ xiǎng hē shuǐ', meaning:'Quiero beber agua', sentence:'我想喝水。', sentencePinyin:'Wǒ xiǎng hē shuǐ.', translation:'Quiero beber agua.', audio:'begin-wo-xiang-he-shui', tag:'NECESIDAD', note:'我想… sirve para decir “quiero…”.' },
  ]},
];

const DAY = 86_400_000;
const GUEST_STORAGE_KEY = 'mi-diario-beginner:guest';
const LEGACY_STORAGE_KEY = 'mi-diario-beginner';
const LAST_USER_KEY = 'mi-diario-last-user';
const LEGACY_USER_KEY = 'mi-diario-legacy-user';
const SCREENS = ['learn', 'cards', 'words', 'book', 'listen', 'speak', 'write', 'progress'] as const;
type Screen = typeof SCREENS[number];
type CachedUser = { id: string; name: string; email: string };

function readCachedUser(key = LAST_USER_KEY): CachedUser | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed && typeof parsed.id === 'string' ? parsed : null;
  } catch { return null; }
}

function haptic(pattern: number | number[] = 12) {
  try { navigator.vibrate?.(pattern); } catch { /* sin soporte */ }
}

function readProgress(key: string): StoredProgress | null {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return sanitizeProgress(parsed);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function calculateStreak(days: string[]) {
  const unique = [...new Set(days)].sort().reverse();
  if (!unique.length) return 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const latest = new Date(`${unique[0]}T00:00:00`);
  const gap = Math.round((today.getTime() - latest.getTime()) / DAY);
  if (gap > 1) return 0;
  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const previous = new Date(`${unique[i - 1]}T00:00:00`).getTime();
    const current = new Date(`${unique[i]}T00:00:00`).getTime();
    if (Math.round((previous - current) / DAY) === 1) streak++; else break;
  }
  return streak;
}

export default function Home() {
  const communityContent=useCommunityContent();
  const { t } = useLanguage();
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession();
  const online = useOnline();  const [cachedUser, setCachedUser] = useState<CachedUser | null>(null);
  const [syncNonce, setSyncNonce] = useState(0);
  const silentSync = useRef(false);
  const [screen, setScreen] = useState<Screen>('learn');
  const [practiceFilter, setPracticeFilter] = useState<{ filter: PracticeFilter; nonce: number } | null>(null);
  const [records, setRecords] = useState<Record<string, Review>>({});
  const [studyDays, setStudyDays] = useState<string[]>([]);
  const [speed, setSpeed] = useState(-15);
  const [resetAt, setResetAt] = useState(0);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<'local' | 'saving' | 'synced' | 'error'>('local');
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Sin conexión la sesión no se puede verificar: usamos el último usuario conocido para seguir estudiando.
  const offlineUser = !session?.user && !online ? cachedUser : null;
  const userId = session?.user.id ?? offlineUser?.id;
  const storageKey = userId ? `mi-diario-beginner:${userId}` : GUEST_STORAGE_KEY;
  const allCards = useMemo(() => [...units.flatMap((item) => item.cards), ...communityContent], [communityContent]);
  const learned = allCards.filter((item) => records[item.id]?.rating === 'fácil' && records[item.id].interval >= 7).length;
  // The due count is a time-sensitive snapshot for this render.
  // eslint-disable-next-line react-hooks/purity
  const dueNow = allCards.filter((item) => records[item.id] && records[item.id].due <= Date.now()).length;
  const streak = calculateStreak(studyDays);

  useEffect(() => {
    if (sessionPending) return;
    let active = true;

    const hydrate = async () => {
      const silent = silentSync.current; silentSync.current = false;
      if (!silent) setReady(false);
      let cached = readProgress(storageKey);
      let importedGuest = false;

      if (!userId) {
        const legacy = readProgress(LEGACY_STORAGE_KEY);
        if (!cached && legacy) {
          cached = legacy;
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(legacy));
          localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
      } else if (!cached && !localStorage.getItem(`mi-diario-imported:${userId}`)) {
        cached = readProgress(GUEST_STORAGE_KEY) || readProgress(LEGACY_STORAGE_KEY);
        importedGuest = Boolean(cached);
      }

      // Recover this device's old UID only after Firebase proves the same email.
      const previousUser = readCachedUser(LEGACY_USER_KEY) || readCachedUser();
      if (userId && session?.user.emailVerified && previousUser?.id !== userId &&
        previousUser?.email.toLowerCase() === session.user.email.toLowerCase()) {
        const oldProgress = readProgress(`mi-diario-beginner:${previousUser.id}`);
        if (oldProgress) cached = cached ? mergeProgress(cached, oldProgress) : oldProgress;
      }
      const local = cached || { records: {}, studyDays: [], speed: -15 };
      let next = local;

      if (userId) {
        setSyncState('saving');
        try {
          const remote = await loadProgress(userId);
          if (!active) return;
          next = mergeProgress({ ...local, speed: remote.hasProgress ? remote.speed : local.speed }, remote);
          next = await saveProgress(userId, next);
          if (!active) return;
          localStorage.setItem(storageKey, JSON.stringify(next));
          localStorage.setItem(`mi-diario-imported:${userId}`, '1');
          if (importedGuest) {
            localStorage.removeItem(GUEST_STORAGE_KEY);
            localStorage.removeItem(LEGACY_STORAGE_KEY);
          }
          setSyncState('synced');
        } catch (error) {
          if (active && (error as Error).name !== 'AbortError') setSyncState('error');
        }
      } else {
        setSyncState('local');
      }

      if (!active) return;
      setRecords(next.records);
      setStudyDays(next.studyDays);
      setSpeed(next.speed);
      setResetAt(next.resetAt || 0);
      setReady(true);
    };

    hydrate();
    return () => {
      active = false;
    };
  }, [sessionPending, session?.user.email, session?.user.emailVerified, storageKey, userId, syncNonce]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCachedUser(readCachedUser());
    const wanted = new URLSearchParams(window.location.search).get('screen');
    if (SCREENS.includes(wanted as Screen)) setScreen(wanted as Screen);
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const user = { id: session.user.id, name: session.user.name || '', email: session.user.email };
    try {
      const previous = readCachedUser();
      if (previous && previous.id !== user.id) localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(previous));
      localStorage.setItem(LAST_USER_KEY, JSON.stringify(user));
    } catch { /* almacenamiento no disponible */ }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCachedUser(user);
  }, [session?.user]);

  // Al recuperar la conexión, vuelve a verificar la sesión y sincroniza lo estudiado sin conexión.
  const wasOffline = useRef(false);
  useEffect(() => {
    if (!online) { wasOffline.current = true; return; }
    if (!wasOffline.current) return;
    wasOffline.current = false;
    silentSync.current = true;
    refetchSession();
    setSyncNonce((value) => value + 1);
  }, [online, refetchSession]);

  useEffect(() => {
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  }, [userId]);

  const queueRemoteSave = useCallback((progress: StoredProgress) => {
    if (!userId) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setSyncState('saving');
    syncTimerRef.current = setTimeout(async () => {
      try {
        const saved = await saveProgress(userId, progress);
        if ((saved.resetAt || 0) > (progress.resetAt || 0)) setSyncNonce(value => value + 1);
        setSyncState('synced');
      } catch {
        setSyncState('error');
      }
    }, 250);
  }, [userId]);

  const persist = useCallback((nextRecords: Record<string, Review>, nextDays = studyDays) => {
    setRecords(nextRecords); setStudyDays(nextDays);
    const progress = { records: nextRecords, studyDays: nextDays, speed, resetAt };
    localStorage.setItem(storageKey, JSON.stringify(progress));
    queueRemoteSave(progress);
  }, [queueRemoteSave, speed, storageKey, studyDays, resetAt]);

  const changeSpeed = (nextSpeed: number) => {
    setSpeed(nextSpeed);
    const progress = { records, studyDays, speed: nextSpeed, resetAt };
    localStorage.setItem(storageKey, JSON.stringify(progress));
    queueRemoteSave(progress);
  };

  const resetProgress = async () => {
    if (!window.confirm(t(userId ? '¿Borrar tu progreso de todos tus dispositivos?' : '¿Borrar todo el progreso guardado en este dispositivo?'))) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    const nextResetAt = Date.now();
    setResetAt(nextResetAt);
    localStorage.setItem(storageKey, JSON.stringify({ records: {}, studyDays: [], speed, resetAt: nextResetAt }));
    setRecords({}); setStudyDays([]);
    if (userId) {
      setSyncState('saving');
      try {
        const cloudResetAt = await clearProgress(userId, speed, nextResetAt);
        setResetAt(cloudResetAt);
        localStorage.setItem(storageKey, JSON.stringify({ records: {}, studyDays: [], speed, resetAt: cloudResetAt }));
        setSyncState('synced');
      } catch {
        setSyncState('error');
      }
    }
  };

  const practiceWith = (filter: PracticeFilter) => { haptic(8); setPracticeFilter({ filter, nonce: Date.now() }); setScreen('cards'); };

  const recordReview = useCallback((cardId: string, rating: Review['rating']) => {
    const tracked = [...units.flatMap(unit=>unit.cards),...library].find(item=>item.id===cardId);
    if (tracked) trackPractice('flashcards',tracked.hanzi,rating==='fácil');
    const old = records[cardId];
    const now = Date.now();
    const nextRecords = { ...records, [cardId]: scheduleReview(old, rating === 'fácil', now) };
    const date = new Date(now);
    const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const nextDays = studyDays.includes(today) ? studyDays : [...studyDays, today];
    persist(nextRecords, nextDays);
    return nextRecords;
  }, [persist, records, studyDays]);

  useEffect(() => {
    stopClip();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);

  const libraryScreen = screen === 'words' || screen === 'book';
  const practiceScreen = ['cards', 'listen', 'speak', 'write'].includes(screen);

  return (
    <main className="shell">
      <header className="topbar">
        <button className="brand brand-button" onClick={() => setScreen('learn')} aria-label={t("Chino, inicio")}><BrandMark className="brand-mark" /><span className="brand-wordmark">Chino<span className="brand-caption">{t("desde cero")}</span></span></button>
        <nav className="main-nav" aria-label={t("Navegación principal")} data-screen={screen}><i className="nav-indicator" aria-hidden="true" />
          {([['learn','Home'],['cards','Flashcards'],['words','Palabras'],['book','Libro'],['listen','Listening'],['speak','Speaking'],['write','Writing'],['progress','Progreso']] as const).map(([value, label]) =>
            <button key={value} aria-current={screen === value ? 'page' : undefined} className={screen === value ? 'selected' : ''} onClick={() => { haptic(8); setScreen(value); }}><NavIcon name={value} /><span>{t(label)}</span></button>)}
        </nav>
        <div className="header-actions"><StudyPanel title={t("Ajustes")}><div className="setting-row">{t("Idioma")}<LanguageSwitch /></div><label className="setting-row">{t("Velocidad de pronunciación")}<select value={speed} onChange={event => changeSpeed(Number(event.target.value))}>{[-40,-30,-20,-15,-10,0,10,20].map(value => <option key={value} value={value}>{value > 0 ? "+" : ""}{value}%</option>)}</select></label><div className="setting-row">{t("Contraste")}<ThemeToggle /></div></StudyPanel>{!online && <span className="offline-pill" role="status">{t("Sin conexión")}</span>}<div className="streak"><span>{"●"}</span> {ready ? streak : 0} {t(streak === 1 ? 'día' : 'días')}</div><AccountMenu syncState={syncState} fallbackUser={offlineUser} onSignedOut={() => { try { localStorage.removeItem(LAST_USER_KEY); } catch { /* noop */ } setCachedUser(null); setScreen('learn'); setSyncState('local'); }} /></div>
      </header>

      <nav className="mobile-nav" aria-label={t("Navegación principal")}>
        {([['learn', 'Inicio', 'learn'], ['words', 'Biblioteca', 'words'], ['cards', 'Práctica', 'cards'], ['progress', 'Progreso', 'progress']] as const).map(([value, label, icon]) => {
          const selected = value === 'words' ? libraryScreen : value === 'cards' ? practiceScreen : screen === value;
          return <button key={value} aria-current={selected ? 'page' : undefined} onClick={() => { haptic(8); setScreen(value === 'words' && libraryScreen || value === 'cards' && practiceScreen ? screen : value); }}><NavIcon name={icon} /><span>{t(label)}</span></button>;
        })}
      </nav>
      {(libraryScreen || practiceScreen) && <nav className="mobile-subnav" aria-label={t(libraryScreen ? 'Biblioteca' : 'Práctica')}>
        {(libraryScreen ? [['words', 'Palabras'], ['book', 'Libro']] as const : [['cards', 'Flashcards'], ['listen', 'Listening'], ['speak', 'Speaking'], ['write', 'Writing']] as const).map(([value, label]) => <button key={value} aria-current={screen === value ? 'page' : undefined} onClick={() => setScreen(value)}>{t(label)}</button>)}
      </nav>}
      <div className="screen" key={screen}>
      {screen === 'learn' ? <HomeGuide onNavigate={setScreen} dueNow={dueNow} ready={ready} /> : screen === 'cards' ? <StudySession key={`${storageKey}:${practiceFilter?.nonce ?? 0}`} speed={speed} records={records} ready={ready} onReview={recordReview} initialFilter={practiceFilter?.filter} /> : screen === 'words' ? <LibraryView scope="all" speed={speed} records={records} onPractice={practiceWith} /> : screen === 'book' ? <LibraryView scope="book" speed={speed} records={records} onPractice={practiceWith} /> : screen === 'listen' ? <ListeningView speed={speed} /> : screen === 'write' ? <WritingView speed={speed} /> : screen === 'speak' ? <SpeakView speed={speed} /> : <ProgressView records={records} studyDays={studyDays} learned={learned} dueNow={dueNow} streak={streak} signedIn={Boolean(userId)} syncState={syncState} onContinue={() => setScreen('cards')} onReset={resetProgress} />}
      </div>
      <CommunityLinks/>
      <footer>{commonWords.length} {t("palabras ·")} {commonPhrases.length} {t("frases ·")} {library.filter((item) => item.book).length} {t("del libro · Chino simplificado ·")} {userId ? t('Progreso sincronizado con tu cuenta') : t('Crea una cuenta para sincronizar tu progreso')}</footer>
    </main>
  );
}

function HomeGuide({ onNavigate, dueNow, ready }: { onNavigate: (screen: Screen) => void; dueNow: number; ready: boolean }) {
  const { t } = useLanguage();
  const sections = [
    { screen: 'cards', title: 'Flashcards', subtitle: 'Recuerda a tu ritmo', description: 'Convierte lo que estudias en tarjetas y repasa lo que más te cuesta.', steps: ['Elige palabras, frases o ambas; filtra por tema, libro o lecciones.', 'Escucha e intenta recordar el significado antes de mostrar la respuesta.', 'Marca si te la supiste y continúa. Lo difícil vuelve antes.'], action: 'Preparar mi sesión' },
    { screen: 'words', title: 'Palabras', subtitle: 'Explora y entiende', description: 'Tu biblioteca de palabras y frases, con pinyin, español y ejemplos.', steps: ['Busca en chino, pinyin o español y ajusta los filtros.', 'Abre una tarjeta para ver ejemplos y su desglose.', 'Toca el audio para escuchar cada palabra o practica tu selección.'], action: 'Explorar palabras' },
    { screen: 'book', title: 'Libro', subtitle: 'Sigue tu curso', description: 'Encuentra el vocabulario y las frases de tu libro en un solo lugar.', steps: ['Elige palabras o frases y el tema que estás estudiando.', 'En Lecciones, selecciona desde dónde y hasta dónde repasar.', 'Escucha, consulta el desglose y lleva esas tarjetas a Flashcards.'], action: 'Abrir mi libro' },
    { screen: 'listen', title: 'Listening', subtitle: 'Entrena tu oído', description: 'Escucha mandarín y practica el significado y los tonos.', steps: ['Elige un ejercicio de significado o de tonos.', 'Escucha el audio y responde sin mirar el chino.', 'Comprueba tu respuesta y completa diez ejercicios.'], action: 'Practicar listening' },
    { screen: 'write', title: 'Writing', subtitle: 'Escribe carácter por carácter', description: 'Dibuja con el dedo o el mouse y recibe corrección de cada trazo.', steps: ['Lee el pinyin y elige una palabra o lección.', 'Sigue el orden de los trazos con o sin guía.', 'Usa una pista o mira la animación cuando necesites ayuda.'], action: 'Practicar writing' },
    { screen: 'speak', title: 'Speaking', subtitle: 'Dale voz al chino', description: 'Escucha un modelo, repítelo y compara lo que el navegador reconoce.', steps: ['Elige todo el contenido o Libro; selecciona palabras, frases o ambas.', 'Escucha el modelo y pulsa el micrófono. Permite su acceso cuando se solicite.', 'Revisa el resultado y sigue. La puntuación compara palabras; no evalúa cada tono.'], action: 'Practicar pronunciación' },
    { screen: 'progress', title: 'Progreso', subtitle: 'Mira lo que avanzas', description: 'Consulta tus repasos, tu racha y las tarjetas que ya estás consolidando.', steps: ['Revisa las tarjetas pendientes y tus días de estudio.', 'Consulta los últimos repasos y el avance de cada grupo.', 'Inicia sesión para sincronizar tu progreso entre dispositivos.'], action: 'Ver mi progreso' },
  ] as const;
  return <div className="home-guide">
    <section className="home-welcome" aria-labelledby="home-title"><div><p className="eyebrow">{t("HOME · CHINO DESDE CERO")}</p><h1 id="home-title">{t("Una palabra cada vez.")}</h1><p className="lede">{ready && dueNow > 0 ? `${dueNow} ${t("listas para repasar")}` : t("Con unos minutos al día basta para empezar.")}</p><button className="practice-primary" onClick={() => onNavigate('cards')}>{t("Empezar a practicar")}<UiIcon name="arrow" /></button></div><details className="home-route"><summary>{t("¿Primera vez por aquí?")}</summary><span className="home-icon"><UiIcon name="bulb" /></span><p>{t("Prueba este recorrido corto.")}</p><ol><li><b>{t("Explora en Libro o Palabras")}</b><span>{t("Escucha y descubre el significado.")}</span></li><li><b>{t("Repasa en Flashcards")}</b><span>{t("Intenta recordar sin mirar la respuesta.")}</span></li><li><b>{t("Repite en Speaking")}</b><span>{t("Practica en voz alta lo que aprendiste.")}</span></li></ol><small>{t("Con unos minutos al día basta para empezar.")}</small></details></section>
    <section aria-labelledby="home-sections"><div className="home-section-heading"><div><p className="eyebrow">{t("TU GUÍA DE LA PÁGINA")}</p><h2 id="home-sections">{t("Un lugar para cada paso.")}</h2></div><p>{t("Abre una sección y prueba a tu ritmo.")}</p></div><div className="home-section-grid">{sections.map(section => <article className="home-section-card" key={section.screen}><div className="home-card-heading"><span className="home-icon"><NavIcon name={section.screen} /></span><div><h3>{t(section.title)}</h3><small>{t(section.subtitle)}</small></div></div><p>{t(section.description)}</p><details className="section-instructions"><summary>{t("Cómo practicar")}</summary><ol>{section.steps.map(step => <li key={step}>{t(step)}</li>)}</ol></details><button onClick={() => onNavigate(section.screen)}>{t(section.action)}<UiIcon name="arrow" /></button></article>)}</div></section>
    <details className="home-tools"><summary>{t("Pequeñas ayudas para estudiar.")}</summary><section aria-labelledby="home-tools-title"><div><p className="eyebrow">{t("A TU RITMO")}</p><h2 id="home-tools-title">{t("Pequeñas ayudas para estudiar.")}</h2></div><div className="home-tool-grid"><article><UiIcon name="audio" /><h3>{t("Escucha más despacio")}</h3><p>{t("Ajusta la velocidad en Ajustes. Los botones de audio usan ese ritmo.")}</p></article><article><UiIcon name="book" /><h3>{t("Desarma una frase")}</h3><p>{t("Toca una palabra en los ejemplos para ver su significado. En el desglose puedes escucharla por separado.")}</p></article><article><UiIcon name="chart" /><h3>{t("Conserva tu avance")}</h3><p>{t("Sin cuenta, tu progreso queda en este dispositivo. Usa Entrar para sincronizarlo; el botón B/N cambia el contraste.")}</p></article></div></section></details>
  </div>;
}

function ProgressView({ records, studyDays, learned, dueNow, streak, signedIn, syncState, onContinue, onReset }: { records: Record<string, Review>; studyDays: string[]; learned: number; dueNow: number; streak: number; signedIn: boolean; syncState: 'local' | 'saving' | 'synced' | 'error'; onContinue: () => void; onReset: () => void }) {
  const { t } = useLanguage();
  const recent = Object.entries(records).sort(([, a], [, b]) => b.updatedAt - a.updatedAt).slice(0, 6);
  const byId = new Map([...units.flatMap((unit) => unit.cards), ...library.map(item => ({ ...item, meaning: item.spanish }))].map(card => [card.id, card]));
  return <section className="progress-view">
    <div className="progress-title"><div><p className="eyebrow">{signedIn ? syncState === 'saving' ? t('SINCRONIZANDO…') : syncState === 'error' ? t('SIN CONEXIÓN · GUARDADO LOCAL') : t('PROGRESO SINCRONIZADO') : t('PROGRESO EN ESTE DISPOSITIVO')}</p><h1>{t("Progreso")}</h1><p className="lede">{signedIn ? t('Se guarda en tu cuenta para continuar desde tu celular o computadora. Consolidada significa recordar una tarjeta en días distintos y alcanzar un intervalo de al menos 7 días.') : t('Puedes practicar sin cuenta. Crea una cuando quieras conservar y sincronizar tu avance.')}</p></div><button className="reveal continue" onClick={onContinue}>{t("Continuar aprendiendo →")}</button></div>
    <div className="metric-grid"><article><span>{"字"}</span><strong>{learned}</strong><small>{t("tarjetas consolidadas")}</small></article><article><span>{"复"}</span><strong>{dueNow}</strong><small>{t("listas para repasar")}</small></article><article><span>{"火"}</span><strong>{streak}</strong><small>{t("días de racha")}</small></article><article><span>{"日"}</span><strong>{studyDays.length}</strong><small>{t("días de estudio")}</small></article></div>
    <div className="progress-columns"><article className="unit-progress"><div className="section-heading"><span>{t("Tarjetas practicadas por unidad")}</span></div>{units.map((unit, index) => { const count = unit.cards.filter((card) => records[card.id]).length; return <div className="progress-row" key={unit.name}><b>{index + 1}{". "}{t(unit.name)}</b><div><i style={{ width:`${count / unit.cards.length * 100}%` }} /></div><small>{count}{"/"}{unit.cards.length}</small></div>; })}{(() => { const book = library.filter(item => item.book); const count = book.filter(item => records[item.id]).length; return <div className="progress-row"><b>{t("Mi libro")}</b><div><i style={{ width:`${count / book.length * 100}%` }} /></div><small>{count}{"/"}{book.length}</small></div>; })()}<div className="progress-row"><b>{t("Biblioteca completa")}</b><div><i style={{ width: `${library.filter(item => records[item.id]).length / library.length * 100}%` }} /></div><small>{library.filter(item => records[item.id]).length}{"/"}{library.length}</small></div></article><article className="activity"><div className="section-heading"><span>{t("Últimos repasos")}</span></div>{recent.length ? recent.map(([id, record]) => { const card = byId.get(id); return <div className="activity-row" key={id}><span className="activity-hanzi">{card?.hanzi}</span><div><b>{card?.pinyin}</b><small>{card ? <Translation item={card}/> : '—'}</small></div><em className={record.rating}>{record.rating === 'fácil' ? t('Recordada') : t('Por reforzar')}</em></div>; }) : <p className="empty">{t("Aún no hay repasos. Empieza con 你好.")}</p>}</article></div>
    <details className="progress-manage"><summary>{t("Gestionar progreso")}</summary><button className="danger-reset" onClick={onReset}>{t("Borrar mi progreso")}</button></details>
  </section>;
}
