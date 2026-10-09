'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { commonPhrases, commonWords, library, type LibraryItem } from './content';
import { LibraryView, playClip, type PracticeFilter } from '@/components/library-view';
import { ThemeToggle } from '@/components/theme-toggle';
import { AccountMenu } from '@/components/account-menu';
import { StudySession } from '@/components/study-session';
import { scheduleReview } from '@/lib/learning';
import { authClient } from '@/lib/auth-client';
import { useOnline } from '@/components/use-online';

const navIcons: Record<string, React.ReactNode> = {
  learn: <path d="M3 9.6 10 4l7 5.6V16a1 1 0 0 1-1 1h-3.5v-4.2h-5V17H4a1 1 0 0 1-1-1z" />,
  cards: <path d="M6.2 3.4h8.1a1.6 1.6 0 0 1 1.6 1.6v10a1.6 1.6 0 0 1-1.6 1.6H6.2A1.6 1.6 0 0 1 4.6 15V5a1.6 1.6 0 0 1 1.6-1.6Zm1.3 3.9h5.5M7.5 10h5.5M7.5 12.7h3.4" />,
  book: <path d="M4.2 4.4c2.2-.9 4.1-.7 5.8.6v10.8c-1.7-1.3-3.6-1.5-5.8-.6zM15.8 4.4c-2.2-.9-4.1-.7-5.8.6v10.8c1.7-1.3 3.6-1.5 5.8-.6z" />,
  words: <path d="M4 4.6A1.6 1.6 0 0 1 5.6 3H16v14H5.6A1.6 1.6 0 0 1 4 15.4zM16 13.6H5.6M8 6.6h5M8 9.4h5" />,
  speak: <path d="M10 3.2a2.2 2.2 0 0 1 2.2 2.2v4.1a2.2 2.2 0 1 1-4.4 0V5.4A2.2 2.2 0 0 1 10 3.2ZM5.4 9.4a4.6 4.6 0 0 0 9.2 0M10 14v3" />,
  progress: <path d="M3.6 16.4h12.8M6.2 13.6V8.4M10 13.6V4.6M13.8 13.6v-6" />,
};

function NavIcon({ name }: { name: string }) {
  return <svg className="nav-ico" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{navIcons[name]}</svg>;
}

type Card = { id: string; hanzi: string; pinyin: string; meaning: string; sentence: string; sentencePinyin: string; translation: string; audio: string; tag: string; note: string };
type Unit = { name: string; description: string; goal: string; cards: Card[] };
type Review = { rating: 'difícil' | 'dudosa' | 'fácil'; interval: number; due: number; reviews: number; updatedAt: number };
type Segment = { hanzi: string; pinyin: string; meaning: string };

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

const breakdowns: Record<string, Segment[]> = {
  'ni-hao': [{ hanzi:'你', pinyin:'nǐ', meaning:'tú' }, { hanzi:'好', pinyin:'hǎo', meaning:'bien / bueno' }],
  'wo': [{ hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'叫', pinyin:'jiào', meaning:'llamarse' }, { hanzi:'安娜', pinyin:'Ānnà', meaning:'Ana' }],
  'ni': [{ hanzi:'你', pinyin:'nǐ', meaning:'tú' }, { hanzi:'好', pinyin:'hǎo', meaning:'bien' }, { hanzi:'吗', pinyin:'ma', meaning:'partícula de pregunta' }],
  'shi': [{ hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'是', pinyin:'shì', meaning:'ser' }, { hanzi:'学生', pinyin:'xuésheng', meaning:'estudiante' }],
  'bu': [{ hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'不', pinyin:'bù', meaning:'no' }, { hanzi:'知道', pinyin:'zhīdào', meaning:'saber' }],
  'xie-xie': [{ hanzi:'谢谢', pinyin:'xièxie', meaning:'gracias' }, { hanzi:'你', pinyin:'nǐ', meaning:'a ti' }],
  'zai-jian': [{ hanzi:'明天', pinyin:'míngtiān', meaning:'mañana' }, { hanzi:'见', pinyin:'jiàn', meaning:'ver / encontrarse' }, { hanzi:'再见', pinyin:'zàijiàn', meaning:'adiós' }],
  'qing': [{ hanzi:'请', pinyin:'qǐng', meaning:'por favor' }, { hanzi:'坐', pinyin:'zuò', meaning:'sentarse' }],
  'dui-bu-qi': [{ hanzi:'对不起', pinyin:'duìbuqǐ', meaning:'lo siento' }, { hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'来', pinyin:'lái', meaning:'venir / llegar' }, { hanzi:'晚', pinyin:'wǎn', meaning:'tarde' }, { hanzi:'了', pinyin:'le', meaning:'acción completada' }],
  'mei-guan-xi': [{ hanzi:'没关系', pinyin:'méi guānxi', meaning:'no pasa nada' }],
  'zao-shang-hao': [{ hanzi:'老师', pinyin:'lǎoshī', meaning:'profesor/a' }, { hanzi:'早上', pinyin:'zǎoshang', meaning:'mañana' }, { hanzi:'好', pinyin:'hǎo', meaning:'bien / bueno' }],
  'wan-an': [{ hanzi:'晚安', pinyin:'wǎn’ān', meaning:'buenas noches' }, { hanzi:'明天', pinyin:'míngtiān', meaning:'mañana' }, { hanzi:'见', pinyin:'jiàn', meaning:'ver / encontrarse' }],
  'yi': [{ hanzi:'一', pinyin:'yí', meaning:'uno / una' }, { hanzi:'个', pinyin:'ge', meaning:'clasificador general' }, { hanzi:'人', pinyin:'rén', meaning:'persona' }],
  'er': [{ hanzi:'二', pinyin:'èr', meaning:'dos' }, { hanzi:'月', pinyin:'yuè', meaning:'mes' }],
  'san': [{ hanzi:'三', pinyin:'sān', meaning:'tres' }, { hanzi:'杯', pinyin:'bēi', meaning:'taza / vaso de' }, { hanzi:'茶', pinyin:'chá', meaning:'té' }],
  'si': [{ hanzi:'四', pinyin:'sì', meaning:'cuatro' }, { hanzi:'本', pinyin:'běn', meaning:'clasificador de libros' }, { hanzi:'书', pinyin:'shū', meaning:'libro' }],
  'wu': [{ hanzi:'五', pinyin:'wǔ', meaning:'cinco' }, { hanzi:'分钟', pinyin:'fēnzhōng', meaning:'minutos' }],
  'liu': [{ hanzi:'六', pinyin:'liù', meaning:'seis' }, { hanzi:'点', pinyin:'diǎn', meaning:'en punto / hora' }],
  'qi': [{ hanzi:'七', pinyin:'qī', meaning:'siete' }, { hanzi:'天', pinyin:'tiān', meaning:'día' }],
  'ba': [{ hanzi:'八', pinyin:'bā', meaning:'ocho' }, { hanzi:'个', pinyin:'ge', meaning:'clasificador general' }, { hanzi:'人', pinyin:'rén', meaning:'persona' }],
  'jiu': [{ hanzi:'九', pinyin:'jiǔ', meaning:'nueve' }, { hanzi:'点', pinyin:'diǎn', meaning:'en punto / hora' }, { hanzi:'上课', pinyin:'shàngkè', meaning:'tener clase' }],
  'shi-10': [{ hanzi:'十', pinyin:'shí', meaning:'diez' }, { hanzi:'块', pinyin:'kuài', meaning:'yuan (dinero)' }, { hanzi:'钱', pinyin:'qián', meaning:'dinero' }],
  'wo-jiao': [{ hanzi:'你好', pinyin:'nǐ hǎo', meaning:'hola' }, { hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'叫', pinyin:'jiào', meaning:'llamarse' }, { hanzi:'安娜', pinyin:'Ānnà', meaning:'Ana' }],
  'ni-jiao-shen-me': [{ hanzi:'你', pinyin:'nǐ', meaning:'tú' }, { hanzi:'叫', pinyin:'jiào', meaning:'llamarse' }, { hanzi:'什么', pinyin:'shénme', meaning:'qué' }, { hanzi:'名字', pinyin:'míngzi', meaning:'nombre' }],
  'wo-shi-xi-ban-ya-ren': [{ hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'是', pinyin:'shì', meaning:'ser' }, { hanzi:'西班牙', pinyin:'Xībānyá', meaning:'España' }, { hanzi:'人', pinyin:'rén', meaning:'persona' }],
  'wo-bu-ming-bai': [{ hanzi:'对不起', pinyin:'duìbuqǐ', meaning:'lo siento' }, { hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'不', pinyin:'bù', meaning:'no' }, { hanzi:'明白', pinyin:'míngbai', meaning:'entender' }],
  'qing-zai-shuo': [{ hanzi:'请', pinyin:'qǐng', meaning:'por favor' }, { hanzi:'再', pinyin:'zài', meaning:'otra vez' }, { hanzi:'说', pinyin:'shuō', meaning:'decir / hablar' }, { hanzi:'一遍', pinyin:'yí biàn', meaning:'una vez completa' }],
  'wo-xiang-he-shui': [{ hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'想', pinyin:'xiǎng', meaning:'querer' }, { hanzi:'喝', pinyin:'hē', meaning:'beber' }, { hanzi:'水', pinyin:'shuǐ', meaning:'agua' }],
};

const DAY = 86_400_000;
const GUEST_STORAGE_KEY = 'mi-diario-beginner:guest';
const LEGACY_STORAGE_KEY = 'mi-diario-beginner';
const LAST_USER_KEY = 'mi-diario-last-user';
const SCREENS = ['learn', 'cards', 'words', 'book', 'speak', 'progress'] as const;
type Screen = typeof SCREENS[number];
type CachedUser = { id: string; name: string; email: string };

function readCachedUser(): CachedUser | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(LAST_USER_KEY) || 'null');
    return parsed && typeof parsed.id === 'string' ? parsed : null;
  } catch { return null; }
}

function haptic(pattern: number | number[] = 12) {
  try { navigator.vibrate?.(pattern); } catch { /* sin soporte */ }
}

type StoredProgress = {
  records: Record<string, Review>;
  studyDays: string[];
  speed: number;
};

type RemoteProgress = StoredProgress & { hasProgress: boolean };

function readProgress(key: string): StoredProgress | null {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return {
      records: parsed.records || {},
      studyDays: Array.isArray(parsed.studyDays) ? parsed.studyDays : [],
      speed: typeof parsed.speed === 'number' ? parsed.speed : -15,
    };
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function mergeRecords(local: Record<string, Review>, remote: Record<string, Review>) {
  const merged = { ...remote };
  for (const [id, review] of Object.entries(local)) {
    if (!merged[id] || review.updatedAt > merged[id].updatedAt) merged[id] = review;
  }
  return merged;
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

function findPriorityCard(cards: Card[], records: Record<string, Review>, start = 0) {
  const now = Date.now();
  const available = cards.map((card, index) => ({ index, review: records[card.id] })).filter(item => (!item.review || item.review.due <= now) && item.index !== (start - 1 + cards.length) % cards.length);
  if (available.length) return available[Math.floor(Math.random() * available.length)].index;
  return start % cards.length;
}

export default function Home() {
  const { data: session, isPending: sessionPending, refetch: refetchSession } = authClient.useSession();
  const online = useOnline();  const [cachedUser, setCachedUser] = useState<CachedUser | null>(null);
  const [syncNonce, setSyncNonce] = useState(0);
  const silentSync = useRef(false);
  const [screen, setScreen] = useState<Screen>('cards');
  const [practiceFilter, setPracticeFilter] = useState<{ filter: PracticeFilter; nonce: number } | null>(null);
  const [unitIndex, setUnitIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [records, setRecords] = useState<Record<string, Review>>({});
  const [studyDays, setStudyDays] = useState<string[]>([]);
  const [speed, setSpeed] = useState(-15);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<'local' | 'saving' | 'synced' | 'error'>('local');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Sin conexión la sesión no se puede verificar: usamos el último usuario conocido para seguir estudiando.
  const offlineUser = !session?.user && !online ? cachedUser : null;
  const userId = session?.user.id ?? offlineUser?.id;
  const storageKey = userId ? `mi-diario-beginner:${userId}` : GUEST_STORAGE_KEY;
  const unit = units[unitIndex];
  const card = unit.cards[cardIndex];
  const allCards = useMemo(() => [...units.flatMap((item) => item.cards), ...library], []);
  const learned = allCards.filter((item) => records[item.id]?.rating === 'fácil' && records[item.id].interval >= 7).length;
  // The due count is a time-sensitive snapshot for this render.
  // eslint-disable-next-line react-hooks/purity
  const dueNow = allCards.filter((item) => records[item.id] && records[item.id].due <= Date.now()).length;
  const completedInUnit = unit.cards.filter((item) => records[item.id]).length;
  const streak = calculateStreak(studyDays);

  useEffect(() => {
    if (sessionPending) return;
    const controller = new AbortController();
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

      const local = cached || { records: {}, studyDays: [], speed: -15 };
      let next = local;

      if (userId) {
        setSyncState('saving');
        try {
          const response = await fetch('/api/progress', { signal: controller.signal });
          if (!response.ok) throw new Error('Unable to load progress');
          const remote = await response.json() as RemoteProgress;
          next = {
            records: mergeRecords(local.records, remote.records || {}),
            studyDays: [...new Set([...(remote.studyDays || []), ...local.studyDays])].sort(),
            speed: remote.hasProgress ? remote.speed : local.speed,
          };

          const saved = await fetch('/api/progress', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(next),
            signal: controller.signal,
          });
          if (!saved.ok) throw new Error('Unable to save progress');
          localStorage.setItem(storageKey, JSON.stringify(next));
          localStorage.setItem(`mi-diario-imported:${userId}`, '1');
          if (importedGuest) {
            localStorage.removeItem(GUEST_STORAGE_KEY);
            localStorage.removeItem(LEGACY_STORAGE_KEY);
          }
          setSyncState('synced');
        } catch (error) {
          if ((error as Error).name !== 'AbortError') setSyncState('error');
        }
      } else {
        setSyncState('local');
      }

      if (!active) return;
      setRecords(next.records);
      setStudyDays(next.studyDays);
      setSpeed(next.speed);
      if (!silent) setCardIndex(findPriorityCard(units[0].cards, next.records));
      setReady(true);
    };

    hydrate();
    return () => {
      active = false;
      controller.abort();
    };
  }, [sessionPending, storageKey, userId, syncNonce]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCachedUser(readCachedUser());
    const wanted = new URLSearchParams(window.location.search).get('screen');
    if (SCREENS.includes(wanted as Screen)) setScreen(wanted as Screen);
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const user = { id: session.user.id, name: session.user.name || '', email: session.user.email };
    try { localStorage.setItem(LAST_USER_KEY, JSON.stringify(user)); } catch { /* almacenamiento no disponible */ }
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

  const queueRemoteSave = useCallback((progress: StoredProgress) => {
    if (!userId) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    setSyncState('saving');
    syncTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progress),
        });
        setSyncState(response.ok ? 'synced' : 'error');
      } catch {
        setSyncState('error');
      }
    }, 250);
  }, [userId]);

  const persist = useCallback((nextRecords: Record<string, Review>, nextDays = studyDays) => {
    setRecords(nextRecords); setStudyDays(nextDays);
    const progress = { records: nextRecords, studyDays: nextDays, speed };
    localStorage.setItem(storageKey, JSON.stringify(progress));
    queueRemoteSave(progress);
  }, [queueRemoteSave, speed, storageKey, studyDays]);

  const changeSpeed = (nextSpeed: number) => {
    setSpeed(nextSpeed);
    const progress = { records, studyDays, speed: nextSpeed };
    localStorage.setItem(storageKey, JSON.stringify(progress));
    queueRemoteSave(progress);
  };

  const resetProgress = async () => {
    if (!window.confirm(userId ? '¿Borrar tu progreso de todos tus dispositivos?' : '¿Borrar todo el progreso guardado en este dispositivo?')) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    localStorage.removeItem(storageKey);
    setRecords({}); setStudyDays([]); setCardIndex(0);
    if (userId) {
      setSyncState('saving');
      try {
        const response = await fetch('/api/progress', { method: 'DELETE' });
        setSyncState(response.ok ? 'synced' : 'error');
      } catch {
        setSyncState('error');
      }
    }
  };

  const playAudio = useCallback(() => {
    audioRef.current?.pause();
    const audio = new Audio(`/audio/${card.audio}.mp3`);
    audio.playbackRate = (100 + speed) / 85;
    audio.preservesPitch = true;
    audioRef.current = audio; audio.play().catch(() => undefined);
  }, [card.audio, speed]);

  const practiceWith = (filter: PracticeFilter) => { haptic(8); setPracticeFilter({ filter, nonce: Date.now() }); setScreen('cards'); };

  const chooseUnit = (index: number) => { setUnitIndex(index); setCardIndex(findPriorityCard(units[index].cards, records)); setRevealed(false); setScreen('learn'); };

  const recordReview = useCallback((cardId: string, rating: Review['rating']) => {
    const old = records[cardId];
    const now = Date.now();
    const nextRecords = { ...records, [cardId]: scheduleReview(old, rating === 'fácil', now) };
    const date = new Date(now);
    const today = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const nextDays = studyDays.includes(today) ? studyDays : [...studyDays, today];
    persist(nextRecords, nextDays);
    return nextRecords;
  }, [persist, records, studyDays]);

  const rate = useCallback((rating: Review['rating']) => {
    haptic(rating === 'fácil' ? 14 : [10, 40, 10]);
    const nextRecords = recordReview(card.id, rating);
    setTimeout(() => { setCardIndex((current) => findPriorityCard(unit.cards, nextRecords, current + 1)); setRevealed(false); }, 180);
  }, [card.id, recordReview, unit.cards]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [screen]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (screen !== 'learn' || event.target instanceof HTMLElement && (event.target.closest('dialog') || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(event.target.tagName))) return;
      if (event.code === 'Space') { event.preventDefault(); setRevealed((value) => !value); }
      if (event.key.toLowerCase() === 'p') playAudio();
      if (revealed && ['1', '2'].includes(event.key)) rate(event.key === '1' ? 'difícil' : 'fácil');
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [playAudio, rate, revealed, screen]);

  return (
    <main className="shell">
      <header className="topbar">
        <button className="brand brand-button" onClick={() => setScreen('learn')} aria-label="Chino, inicio"><span className="brand-mark">字</span><span>Chino<span className="brand-caption">desde cero</span></span></button>
        <nav className="main-nav" aria-label="Navegación principal" data-screen={screen}><i className="nav-indicator" aria-hidden="true" />
          {([['learn','Aprende'],['cards','Practicar'],['words','Palabras'],['book','Libro'],['speak','Hablar'],['progress','Progreso']] as const).map(([value, label]) =>
            <button key={value} aria-current={screen === value ? 'page' : undefined} className={screen === value ? 'selected' : ''} onClick={() => { haptic(8); setScreen(value); }}><NavIcon name={value} /><span>{label}</span></button>)}
        </nav>
        <div className="header-actions">{!online && <span className="offline-pill" role="status">Sin conexión</span>}<label className="voice-pill"><i /><span>Xiaoxiao</span><span aria-hidden="true">·</span><select aria-label="Velocidad de pronunciación" value={speed} onChange={(event) => changeSpeed(Number(event.target.value))}>{[-40,-30,-20,-15,-10,0,10,20].map((value) => <option key={value} value={value}>{value > 0 ? '+' : value === 0 ? '±' : ''}{value}%</option>)}</select></label><ThemeToggle /><div className="streak"><span>●</span> {ready ? streak : 0} día{streak === 1 ? '' : 's'}</div><AccountMenu syncState={syncState} fallbackUser={offlineUser} onSignedOut={() => { try { localStorage.removeItem(LAST_USER_KEY); } catch { /* noop */ } setCachedUser(null); setScreen('learn'); setSyncState('local'); }} /></div>
      </header>

      <div className="screen" key={screen}>
      {screen === 'learn' ? <>
        <section className="intro compact" id="top">
          <div><p className="eyebrow">CURSO CERO · CHINO SIMPLIFICADO</p><h1><span>Empieza sin saber nada.</span> <span>Una palabra cada vez.</span></h1><p className="lede">Siempre verás el carácter chino, cómo se pronuncia en pinyin y su significado en español.</p></div>
          <div className="tone-guide"><span>Los 4 tonos</span><div><b>mā</b><b>má</b><b>mǎ</b><b>mà</b></div><small>Plano · Sube · Baja y sube · Baja</small></div>
        </section>

        <section className="study-layout">
          <aside className="levels-panel">
            <div className="section-heading"><span>Tu camino</span><small>{unitIndex + 1} de {units.length}</small></div>
            <div className="level-list">{units.map((item, index) => <button aria-pressed={index === unitIndex} className={`level ${index === unitIndex ? 'active' : ''}`} key={item.name} onClick={() => chooseUnit(index)}><span><b>{index + 1}. {item.name}</b><em>{item.description}</em></span><small>{item.cards.filter((entry) => records[entry.id]).length}/{item.cards.length}</small></button>)}</div>
            <div className="shortcuts"><strong>Atajos</strong><span><kbd>Espacio</kbd> ejemplo</span><span><kbd>P</kbd> escuchar</span><span><kbd>1–2</kbd> recordar</span></div>
          </aside>

          <section className="lesson" aria-labelledby="lesson-title">
            <div className="lesson-head"><div><p className="eyebrow">LECCIÓN {unitIndex + 1}</p><h2 id="lesson-title">{unit.name}</h2></div><span className="count">{cardIndex + 1} / {unit.cards.length}</span></div>
            <article className={`flashcard beginner-card ${revealed ? 'is-revealed' : ''}`} aria-live="polite">
              <span className="tone">{card.tag}</span>
              <button className="sound" onClick={playAudio} aria-label={`Escuchar ${card.hanzi}`}><span>♪</span><small>Escuchar</small></button>
              <div className={`hanzi ${card.hanzi.length > 5 ? 'hanzi-phrase' : ''}`}>{card.hanzi}</div>
              <div className="pinyin"><small>PINYIN</small>{card.pinyin}</div>
              <div className="translation"><small>ESPAÑOL</small><strong>{card.meaning}</strong></div>
              {revealed && <div className="example-box">
                <div className="example-title"><span>Ejemplo completo</span><b>{card.sentence}</b><em>{card.sentencePinyin}</em><p>{card.translation}</p></div>
                <div className="word-map" aria-label="Desglose palabra por palabra">
                  <div className="map-head"><span>CARÁCTER</span><span>PINYIN</span><span>ESPAÑOL</span></div>
                  {breakdowns[card.id].map((part, index) => <div className="map-row" key={`${part.hanzi}-${index}`}><b>{part.hanzi}</b><em>{part.pinyin}</em><span>{part.meaning}</span></div>)}
                </div>
                <small className="example-note">{card.note}</small>
              </div>}
            </article>
            {!revealed ? <button className="reveal" onClick={() => setRevealed(true)}>Ver un ejemplo <kbd>Espacio</kbd></button> : <div className="binary-rating"><button onClick={() => rate('difícil')}>No me la supe</button><button onClick={() => rate('fácil')}>Me la supe</button></div>}
            <div className="hint">Escucha dos veces y repite en voz alta. No necesitas memorizarla hoy.</div>
          </section>

          <aside className="today-panel">
            <div className="section-heading"><span>Tu sesión</span></div>
            <div className="stat-ring" style={{ '--progress': `${Math.round((completedInUnit / unit.cards.length) * 100)}%` } as React.CSSProperties}><div><strong>{completedInUnit}</strong><small>de {unit.cards.length}</small></div></div>
            <dl><div><dt>Nuevas</dt><dd>{unit.cards.length - completedInUnit}</dd></div><div><dt>Para repasar</dt><dd>{dueNow}</dd></div><div><dt>Duración</dt><dd>5 min</dd></div></dl>
            <div className="method"><b>Repaso inteligente</b><p>Lo difícil vuelve antes. Lo fácil espera más.</p></div>
            <p className="quote"><span>慢慢来</span><br />Poco a poco.</p>
          </aside>
        </section>
      </> : screen === 'cards' ? <StudySession key={`${storageKey}:${practiceFilter?.nonce ?? 0}`} speed={speed} records={records} ready={ready} onReview={recordReview} initialFilter={practiceFilter?.filter} /> : screen === 'words' ? <LibraryView scope="all" speed={speed} records={records} onPractice={practiceWith} /> : screen === 'book' ? <LibraryView scope="book" speed={speed} records={records} onPractice={practiceWith} /> : screen === 'speak' ? <SpeakView speed={speed} /> : <ProgressView records={records} studyDays={studyDays} learned={learned} dueNow={dueNow} streak={streak} signedIn={Boolean(userId)} syncState={syncState} onContinue={() => setScreen('learn')} onReset={resetProgress} />}
      </div>
      <footer>{commonWords.length} palabras · {commonPhrases.length} frases · {library.filter((item) => item.book).length} del libro · Chino simplificado · {userId ? 'Progreso sincronizado con tu cuenta' : 'Crea una cuenta para sincronizar tu progreso'}</footer>
    </main>
  );
}

function ProgressView({ records, studyDays, learned, dueNow, streak, signedIn, syncState, onContinue, onReset }: { records: Record<string, Review>; studyDays: string[]; learned: number; dueNow: number; streak: number; signedIn: boolean; syncState: 'local' | 'saving' | 'synced' | 'error'; onContinue: () => void; onReset: () => void }) {
  const recent = Object.entries(records).sort(([, a], [, b]) => b.updatedAt - a.updatedAt).slice(0, 6);
  const byId = new Map([...units.flatMap((unit) => unit.cards), ...library.map(item => ({ ...item, meaning: item.spanish }))].map(card => [card.id, card]));
  return <section className="progress-view">
    <div className="progress-title"><div><p className="eyebrow">{signedIn ? syncState === 'saving' ? 'SINCRONIZANDO…' : syncState === 'error' ? 'SIN CONEXIÓN · GUARDADO LOCAL' : 'PROGRESO SINCRONIZADO' : 'PROGRESO EN ESTE DISPOSITIVO'}</p><h1>{signedIn ? 'Tu avance viaja contigo.' : 'Tu progreso empieza aquí.'}</h1><p className="lede">{signedIn ? 'Se guarda en tu cuenta para continuar desde tu celular o computadora. Consolidada significa recordar una tarjeta en días distintos y alcanzar un intervalo de al menos 7 días.' : 'Puedes practicar sin cuenta. Crea una cuando quieras conservar y sincronizar tu avance.'}</p></div><button className="reveal continue" onClick={onContinue}>Continuar aprendiendo →</button></div>
    <div className="metric-grid"><article><span>字</span><strong>{learned}</strong><small>tarjetas consolidadas</small></article><article><span>复</span><strong>{dueNow}</strong><small>listas para repasar</small></article><article><span>火</span><strong>{streak}</strong><small>días de racha</small></article><article><span>日</span><strong>{studyDays.length}</strong><small>días de estudio</small></article></div>
    <div className="progress-columns"><article className="unit-progress"><div className="section-heading"><span>Tarjetas practicadas por unidad</span></div>{units.map((unit, index) => { const count = unit.cards.filter((card) => records[card.id]).length; return <div className="progress-row" key={unit.name}><b>{index + 1}. {unit.name}</b><div><i style={{ width:`${count / unit.cards.length * 100}%` }} /></div><small>{count}/{unit.cards.length}</small></div>; })}{(() => { const book = library.filter(item => item.book); const count = book.filter(item => records[item.id]).length; return <div className="progress-row"><b>Mi libro</b><div><i style={{ width:`${count / book.length * 100}%` }} /></div><small>{count}/{book.length}</small></div>; })()}<div className="progress-row"><b>Biblioteca completa</b><div><i style={{ width: `${library.filter(item => records[item.id]).length / library.length * 100}%` }} /></div><small>{library.filter(item => records[item.id]).length}/{library.length}</small></div></article><article className="activity"><div className="section-heading"><span>Últimos repasos</span></div>{recent.length ? recent.map(([id, record]) => { const card = byId.get(id); return <div className="activity-row" key={id}><span className="activity-hanzi">{card?.hanzi}</span><div><b>{card?.pinyin}</b><small>{card?.meaning}</small></div><em className={record.rating}>{record.rating === 'fácil' ? 'Recordada' : 'Por reforzar'}</em></div>; }) : <p className="empty">Aún no hay repasos. Empieza con 你好.</p>}</article></div>
    <button className="danger-reset" onClick={onReset}>Borrar mi progreso</button>
  </section>;
}

function playLibraryAudio(item: LibraryItem, speed: number) { playClip(item.audio, speed); }

type SpeechResult = { score: number; heard: string; feedback: string };
type BrowserSpeechRecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type BrowserSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: () => void;
  onend: () => void;
  onerror: () => void;
  onresult: (event: BrowserSpeechRecognitionEvent) => void;
  start: () => void;
};
type NativeSpeech = {
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

function SpeakView({ speed }: { speed: number }) {
  const [index, setIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<SpeechResult | null>(null);
  const [error, setError] = useState('');
  const phrase = commonPhrases[index];

  const showResult = (alternatives: string[]) => {
    const target = normalizeChinese(phrase.hanzi);
    const ranked = alternatives.map((transcript) => { const heard = normalizeChinese(transcript); const score = Math.max(0, Math.round((1 - distance(target, heard) / Math.max(target.length, heard.length, 1)) * 100)); return { score, heard: transcript }; }).sort((a, b) => b.score - a.score);
    const best = ranked[0] || { score: 0, heard: '' };
    const feedback = best.score >= 90 ? '¡Muy bien! El navegador entendió la frase completa.' : best.score >= 65 ? 'Casi. Escucha otra vez y repite con un ritmo más claro.' : 'Inténtalo de nuevo por partes, siguiendo el pinyin.';
    setResult({ ...best, feedback });
  };

  // En la app Android el WebView no trae reconocimiento de voz: se usa el plugin nativo.
  const listenNative = async (native: NativeSpeech) => {
    try {
      const permission = await native.requestPermissions();
      if (permission.speechRecognition !== 'granted') { setError('Activa el permiso del micrófono para practicar la pronunciación.'); return; }
      setListening(true);
      const { matches } = await native.start({ language: 'zh-CN', maxResults: 5, prompt: phrase.hanzi, partialResults: false, popup: false });
      setListening(false);
      showResult(matches || []);
    } catch {
      setListening(false);
      setError('No pude escuchar con claridad. Revisa el permiso del micrófono e inténtalo otra vez.');
    }
  };

  const listen = () => {
    setResult(null); setError('');
    const native = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean; Plugins?: { SpeechRecognition?: NativeSpeech } } }).Capacitor;
    if (native?.isNativePlatform?.() && native.Plugins?.SpeechRecognition) { listenNative(native.Plugins.SpeechRecognition); return; }
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setError('Tu navegador no ofrece reconocimiento de voz. Prueba Chrome o Safari actualizado.'); return; }
    const recognition = new Recognition();
    recognition.lang = 'zh-CN'; recognition.continuous = false; recognition.interimResults = false; recognition.maxAlternatives = 5;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setError('No pude escuchar con claridad. Revisa el permiso del micrófono e inténtalo otra vez.'); };
    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => showResult(Array.from(event.results[0] as ArrayLike<{ transcript: string }>).map((entry) => entry.transcript));
    recognition.start();
  };

  const next = () => { setIndex((current) => (current + 1) % commonPhrases.length); setResult(null); setError(''); };
  return <section className="speak-view">
    <div className="speak-copy"><p className="eyebrow">ENTRENADOR DE PRONUNCIACIÓN · BETA</p><h1><span>Escucha. Habla.</span> <span>Comprueba.</span></h1><p className="lede">El navegador escucha en mandarín y compara los caracteres reconocidos con la frase objetivo.</p><div className="privacy-note"><b>Privacidad</b><span>La app no guarda tus grabaciones.</span></div></div>
    <article className="speak-card">
      <div className="speak-step">FRASE {index + 1} DE {commonPhrases.length}</div>
      <div className="speak-hanzi">{phrase.hanzi}</div><div className="speak-pinyin">{phrase.pinyin}</div><p>{phrase.spanish}</p>
      <button className="listen-model" onClick={() => playLibraryAudio(phrase, speed)}>♪ Escuchar modelo</button>
      <button className={`mic-button ${listening ? 'listening' : ''}`} onClick={listen} disabled={listening}><span>{listening ? '●' : '●'}</span>{listening ? 'Escuchando…' : 'Hablar ahora'}</button>
      {error && <div className="speech-error">{error}</div>}
      {result && <div className={`speech-result ${result.score >= 90 ? 'great' : result.score >= 65 ? 'close' : 'retry'}`}><div className="score"><strong>{result.score}</strong><span>/100</span></div><div><b>{result.feedback}</b><p>Escuché: <span>{result.heard || '—'}</span></p></div></div>}
      <button className="next-phrase" onClick={next}>Siguiente frase →</button>
      <small className="tone-disclaimer">Esta versión mide inteligibilidad y palabras reconocidas. La calificación tonal fonema por fonema requiere un motor acústico especializado.</small>
    </article>
  </section>;
}
