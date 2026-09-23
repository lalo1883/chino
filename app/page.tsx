'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { commonPhrases, commonWords, library, type LibraryItem } from './content';

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
  { name: 'Números', description: 'Cuenta del 1 al 6', goal: 'Reconocer y pronunciar seis números', cards: [
    { id:'yi', hanzi:'一', pinyin:'yī', meaning:'Uno', sentence:'一个人。', sentencePinyin:'Yí ge rén.', translation:'Una persona.', audio:'begin-yi', tag:'NÚMERO', note:'El tono puede cambiar al combinarse.' },
    { id:'er', hanzi:'二', pinyin:'èr', meaning:'Dos', sentence:'二月。', sentencePinyin:'Èr yuè.', translation:'Febrero.', audio:'begin-er', tag:'NÚMERO', note:'Para contar objetos suele usarse 两 (liǎng).' },
    { id:'san', hanzi:'三', pinyin:'sān', meaning:'Tres', sentence:'三杯茶。', sentencePinyin:'Sān bēi chá.', translation:'Tres tazas de té.', audio:'begin-san', tag:'NÚMERO', note:'Primer tono: voz alta y sostenida.' },
    { id:'si', hanzi:'四', pinyin:'sì', meaning:'Cuatro', sentence:'四本书。', sentencePinyin:'Sì běn shū.', translation:'Cuatro libros.', audio:'begin-si', tag:'NÚMERO', note:'Cuarto tono: breve y descendente.' },
    { id:'wu', hanzi:'五', pinyin:'wǔ', meaning:'Cinco', sentence:'五分钟。', sentencePinyin:'Wǔ fēnzhōng.', translation:'Cinco minutos.', audio:'begin-wu', tag:'NÚMERO', note:'Tercer tono: baja y vuelve a subir.' },
    { id:'liu', hanzi:'六', pinyin:'liù', meaning:'Seis', sentence:'六点。', sentencePinyin:'Liù diǎn.', translation:'Las seis en punto.', audio:'begin-liu', tag:'NÚMERO', note:'Empieza con un sonido parecido a “lio”.' },
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
  'wo-jiao': [{ hanzi:'你好', pinyin:'nǐ hǎo', meaning:'hola' }, { hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'叫', pinyin:'jiào', meaning:'llamarse' }, { hanzi:'安娜', pinyin:'Ānnà', meaning:'Ana' }],
  'ni-jiao-shen-me': [{ hanzi:'你', pinyin:'nǐ', meaning:'tú' }, { hanzi:'叫', pinyin:'jiào', meaning:'llamarse' }, { hanzi:'什么', pinyin:'shénme', meaning:'qué' }, { hanzi:'名字', pinyin:'míngzi', meaning:'nombre' }],
  'wo-shi-xi-ban-ya-ren': [{ hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'是', pinyin:'shì', meaning:'ser' }, { hanzi:'西班牙', pinyin:'Xībānyá', meaning:'España' }, { hanzi:'人', pinyin:'rén', meaning:'persona' }],
  'wo-bu-ming-bai': [{ hanzi:'对不起', pinyin:'duìbuqǐ', meaning:'lo siento' }, { hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'不', pinyin:'bù', meaning:'no' }, { hanzi:'明白', pinyin:'míngbai', meaning:'entender' }],
  'qing-zai-shuo': [{ hanzi:'请', pinyin:'qǐng', meaning:'por favor' }, { hanzi:'再', pinyin:'zài', meaning:'otra vez' }, { hanzi:'说', pinyin:'shuō', meaning:'decir / hablar' }, { hanzi:'一遍', pinyin:'yí biàn', meaning:'una vez completa' }],
  'wo-xiang-he-shui': [{ hanzi:'我', pinyin:'wǒ', meaning:'yo' }, { hanzi:'想', pinyin:'xiǎng', meaning:'querer' }, { hanzi:'喝', pinyin:'hē', meaning:'beber' }, { hanzi:'水', pinyin:'shuǐ', meaning:'agua' }],
};

const DAY = 86_400_000;

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
  for (let offset = 0; offset < cards.length; offset++) {
    const index = (start + offset) % cards.length;
    const review = records[cards[index].id];
    if (!review || review.due <= now) return index;
  }
  return start % cards.length;
}

export default function Home() {
  const [screen, setScreen] = useState<'learn' | 'cards' | 'words' | 'speak' | 'progress'>('learn');
  const [unitIndex, setUnitIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [records, setRecords] = useState<Record<string, Review>>({});
  const [studyDays, setStudyDays] = useState<string[]>([]);
  const [speed, setSpeed] = useState(-15);
  const [ready, setReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unit = units[unitIndex];
  const card = unit.cards[cardIndex];
  const allCards = useMemo(() => units.flatMap((item) => item.cards), []);
  const learned = allCards.filter((item) => records[item.id]).length;
  // The due count is a time-sensitive snapshot for this render.
  // eslint-disable-next-line react-hooks/purity
  const dueNow = allCards.filter((item) => records[item.id] && records[item.id].due <= Date.now()).length;
  const completedInUnit = unit.cards.filter((item) => records[item.id]).length;
  const streak = calculateStreak(studyDays);

  /* eslint-disable react-hooks/set-state-in-effect -- hydrate device-only progress after mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mi-diario-beginner');
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedRecords = parsed.records || {};
        setRecords(savedRecords); setStudyDays(parsed.studyDays || []); setSpeed(typeof parsed.speed === 'number' ? parsed.speed : -15);
        setCardIndex(findPriorityCard(units[0].cards, savedRecords));
      }
    } catch {
      localStorage.removeItem('mi-diario-beginner');
    } finally { setReady(true); }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const persist = useCallback((nextRecords: Record<string, Review>, nextDays = studyDays) => {
    setRecords(nextRecords); setStudyDays(nextDays);
    localStorage.setItem('mi-diario-beginner', JSON.stringify({ records: nextRecords, studyDays: nextDays, speed }));
  }, [speed, studyDays]);

  const changeSpeed = (nextSpeed: number) => {
    setSpeed(nextSpeed);
    localStorage.setItem('mi-diario-beginner', JSON.stringify({ records, studyDays, speed: nextSpeed }));
  };

  const playAudio = useCallback(() => {
    audioRef.current?.pause();
    const audio = new Audio(`/audio/${card.audio}.mp3`);
    audio.playbackRate = (100 + speed) / 85;
    audio.preservesPitch = true;
    audioRef.current = audio; audio.play().catch(() => undefined);
  }, [card.audio, speed]);

  const chooseUnit = (index: number) => { setUnitIndex(index); setCardIndex(findPriorityCard(units[index].cards, records)); setRevealed(false); setScreen('learn'); };

  const rate = useCallback((rating: Review['rating']) => {
    const old = records[card.id];
    const previousInterval = old?.interval || 0;
    const interval = rating === 'difícil' ? 0.007 : rating === 'dudosa' ? Math.max(1, previousInterval * 1.8) : Math.max(3, previousInterval * 2.5);
    const now = Date.now();
    const nextRecords = { ...records, [card.id]: { rating, interval, due: now + interval * DAY, reviews: (old?.reviews || 0) + 1, updatedAt: now } };
    const today = new Date().toISOString().slice(0, 10);
    const nextDays = studyDays.includes(today) ? studyDays : [...studyDays, today];
    persist(nextRecords, nextDays);
    setTimeout(() => { setCardIndex((current) => findPriorityCard(unit.cards, nextRecords, current + 1)); setRevealed(false); }, 180);
  }, [card.id, persist, records, studyDays, unit.cards]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (screen !== 'learn') return;
      if (event.code === 'Space') { event.preventDefault(); setRevealed((value) => !value); }
      if (event.key.toLowerCase() === 'p') playAudio();
      if (revealed && ['1', '2', '3'].includes(event.key)) rate(event.key === '1' ? 'difícil' : event.key === '2' ? 'dudosa' : 'fácil');
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [playAudio, rate, revealed, screen]);

  return (
    <main className="shell">
      <header className="topbar">
        <button className="brand brand-button" onClick={() => setScreen('learn')} aria-label="Mǐ diario, inicio"><span className="brand-mark">字</span><span>Mǐ diario</span></button>
        <nav className="main-nav" aria-label="Navegación principal">
          <button className={screen === 'learn' ? 'selected' : ''} onClick={() => setScreen('learn')}>Inicio</button>
          <button className={screen === 'cards' ? 'selected' : ''} onClick={() => setScreen('cards')}>Tarjetas</button>
          <button className={screen === 'words' ? 'selected' : ''} onClick={() => setScreen('words')}>Palabras</button>
          <button className={screen === 'speak' ? 'selected' : ''} onClick={() => setScreen('speak')}>Hablar</button>
          <button className={screen === 'progress' ? 'selected' : ''} onClick={() => setScreen('progress')}>Progreso</button>
        </nav>
        <div className="header-actions"><label className="voice-pill"><i /><span>Xiaoxiao</span><span aria-hidden="true">·</span><select aria-label="Velocidad de pronunciación" value={speed} onChange={(event) => changeSpeed(Number(event.target.value))}>{[-40,-30,-20,-15,-10,0,10,20].map((value) => <option key={value} value={value}>{value > 0 ? '+' : value === 0 ? '±' : ''}{value}%</option>)}</select></label><div className="streak"><span>●</span> {ready ? streak : 0} día{streak === 1 ? '' : 's'}</div></div>
      </header>

      {screen === 'learn' ? <>
        <section className="intro compact" id="top">
          <div><p className="eyebrow">CURSO CERO · CHINO SIMPLIFICADO</p><h1>Empieza sin saber nada.<br />Una palabra cada vez.</h1><p className="lede">Siempre verás el carácter chino, cómo se pronuncia en pinyin y su significado en español.</p></div>
          <div className="tone-guide"><span>Los 4 tonos</span><div><b>mā</b><b>má</b><b>mǎ</b><b>mà</b></div><small>Plano · Sube · Baja y sube · Baja</small></div>
        </section>

        <section className="study-layout">
          <aside className="levels-panel">
            <div className="section-heading"><span>Tu camino</span><small>{unitIndex + 1} de {units.length}</small></div>
            <div className="level-list">{units.map((item, index) => <button aria-pressed={index === unitIndex} className={`level ${index === unitIndex ? 'active' : ''}`} key={item.name} onClick={() => chooseUnit(index)}><span><b>{index + 1}. {item.name}</b><em>{item.description}</em></span><small>{item.cards.filter((entry) => records[entry.id]).length}/{item.cards.length}</small></button>)}</div>
            <div className="shortcuts"><strong>Atajos</strong><span><kbd>Espacio</kbd> ejemplo</span><span><kbd>P</kbd> escuchar</span><span><kbd>1–3</kbd> recordar</span></div>
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
            {!revealed ? <button className="reveal" onClick={() => setRevealed(true)}>Ver un ejemplo <kbd>Espacio</kbd></button> : <div className="rating" aria-label="¿Cómo te fue?"><button className="hard" onClick={() => rate('difícil')}><small>1</small> Difícil</button><button className="unsure" onClick={() => rate('dudosa')}><small>2</small> Dudosa</button><button className="easy" onClick={() => rate('fácil')}><small>3</small> Fácil</button></div>}
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
      </> : screen === 'cards' ? <CardsView speed={speed} /> : screen === 'words' ? <WordsView speed={speed} /> : screen === 'speak' ? <SpeakView speed={speed} /> : <ProgressView records={records} studyDays={studyDays} learned={learned} dueNow={dueNow} streak={streak} onContinue={() => setScreen('learn')} onReset={() => { if (window.confirm('¿Borrar todo el progreso guardado en este dispositivo?')) persist({}, []); }} />}
      <footer>200 palabras · 200 frases prácticas · Chino simplificado · Progreso guardado en este dispositivo</footer>
    </main>
  );
}

function ProgressView({ records, studyDays, learned, dueNow, streak, onContinue, onReset }: { records: Record<string, Review>; studyDays: string[]; learned: number; dueNow: number; streak: number; onContinue: () => void; onReset: () => void }) {
  const recent = Object.entries(records).sort(([, a], [, b]) => b.updatedAt - a.updatedAt).slice(0, 6);
  const byId = new Map(units.flatMap((unit) => unit.cards).map((card) => [card.id, card]));
  return <section className="progress-view">
    <div className="progress-title"><div><p className="eyebrow">REGISTRO LOCAL</p><h1>Tu progreso, sin cuentas.</h1><p className="lede">Se guarda solamente en este dispositivo. El repaso se adapta a tus respuestas.</p></div><button className="reveal continue" onClick={onContinue}>Continuar aprendiendo →</button></div>
    <div className="metric-grid"><article><span>字</span><strong>{learned}</strong><small>palabras vistas</small></article><article><span>复</span><strong>{dueNow}</strong><small>listas para repasar</small></article><article><span>火</span><strong>{streak}</strong><small>días de racha</small></article><article><span>日</span><strong>{studyDays.length}</strong><small>días de estudio</small></article></div>
    <div className="progress-columns"><article className="unit-progress"><div className="section-heading"><span>Avance por unidad</span></div>{units.map((unit, index) => { const count = unit.cards.filter((card) => records[card.id]).length; return <div className="progress-row" key={unit.name}><b>{index + 1}. {unit.name}</b><div><i style={{ width:`${count / unit.cards.length * 100}%` }} /></div><small>{count}/{unit.cards.length}</small></div>; })}</article><article className="activity"><div className="section-heading"><span>Últimos repasos</span></div>{recent.length ? recent.map(([id, record]) => { const card = byId.get(id); return <div className="activity-row" key={id}><span className="activity-hanzi">{card?.hanzi}</span><div><b>{card?.pinyin}</b><small>{card?.meaning}</small></div><em className={record.rating}>{record.rating}</em></div>; }) : <p className="empty">Aún no hay repasos. Empieza con 你好.</p>}</article></div>
    <button className="danger-reset" onClick={onReset}>Borrar mi progreso</button>
  </section>;
}

function playLibraryAudio(item: LibraryItem, speed: number) {
  const audio = new Audio(`/audio/${item.audio}.mp3`);
  audio.playbackRate = (100 + speed) / 85;
  audio.preservesPitch = true;
  audio.play().catch(() => undefined);
}

function CardsView({ speed }: { speed: number }) {
  const [kind, setKind] = useState<'all' | 'word' | 'phrase'>('all');
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const items = kind === 'all' ? library : library.filter((item) => item.type === kind);
  const card = items[index % items.length];
  const changeKind = (next: typeof kind) => { setKind(next); setIndex(0); setRevealed(false); };
  const move = (amount: number) => { setIndex((current) => (current + amount + items.length) % items.length); setRevealed(false); };
  return <section className="library-view">
    <div className="library-hero"><div><p className="eyebrow">BIBLIOTECA DE TARJETAS</p><h1>400 oportunidades<br />para practicar.</h1><p className="lede">200 palabras esenciales y 200 frases prácticas, todas con audio.</p></div><div className="library-count"><strong>{items.length}</strong><span>tarjetas</span></div></div>
    <div className="filter-bar" role="group" aria-label="Tipo de tarjeta">{([['all','Todas'],['word','Palabras'],['phrase','Frases']] as const).map(([value,label]) => <button className={kind === value ? 'active' : ''} onClick={() => changeKind(value)} key={value}>{label}</button>)}</div>
    <div className="deck-layout">
      <button className="deck-arrow" onClick={() => move(-1)} aria-label="Tarjeta anterior">←</button>
      <article className="library-card">
        <div className="library-card-top"><span>{card.type === 'word' ? 'PALABRA' : 'FRASE'} · {card.category}</span><small>{index + 1} / {items.length}</small></div>
        <button className="big-audio" onClick={() => playLibraryAudio(card, speed)}><span>♪</span> Escuchar</button>
        <div className={card.type === 'phrase' ? 'deck-hanzi phrase' : 'deck-hanzi'}>{card.hanzi}</div>
        <div className="deck-pinyin">{card.pinyin}</div>
        {revealed ? <div className="deck-meaning">{card.spanish}</div> : <button className="ghost-reveal" onClick={() => setRevealed(true)}>Mostrar significado</button>}
      </article>
      <button className="deck-arrow" onClick={() => move(1)} aria-label="Tarjeta siguiente">→</button>
    </div>
  </section>;
}

function WordsView({ speed }: { speed: number }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const categories = ['Todas', ...new Set(commonWords.map((item) => item.category))];
  const query = search.trim().toLocaleLowerCase();
  const filtered = commonWords.filter((item) => (category === 'Todas' || item.category === category) && (!query || `${item.hanzi} ${item.pinyin} ${item.spanish}`.toLocaleLowerCase().includes(query)));
  return <section className="library-view words-view">
    <div className="library-hero"><div><p className="eyebrow">DICCIONARIO VISUAL</p><h1>Las 200 palabras<br />esenciales.</h1><p className="lede">Busca en chino, pinyin o español. Escucha cualquier palabra con un toque.</p></div><div className="library-count"><strong>{filtered.length}</strong><span>resultados</span></div></div>
    <div className="search-row"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar: agua, shuǐ, 水…" aria-label="Buscar palabras"/><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoría">{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
    <div className="word-grid">{filtered.map((item) => <article key={item.id}><button onClick={() => playLibraryAudio(item, speed)} aria-label={`Escuchar ${item.hanzi}`}>♪</button><span>{item.hanzi}</span><em>{item.pinyin}</em><strong>{item.spanish}</strong><small>{item.category}</small></article>)}</div>
  </section>;
}

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

  const listen = () => {
    setResult(null); setError('');
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setError('Tu navegador no ofrece reconocimiento de voz. Prueba Chrome o Safari actualizado.'); return; }
    const recognition = new Recognition();
    recognition.lang = 'zh-CN'; recognition.continuous = false; recognition.interimResults = false; recognition.maxAlternatives = 5;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setError('No pude escuchar con claridad. Revisa el permiso del micrófono e inténtalo otra vez.'); };
    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      const target = normalizeChinese(phrase.hanzi);
      const alternatives = Array.from(event.results[0] as ArrayLike<{ transcript: string }>);
      const ranked = alternatives.map((entry) => { const heard = normalizeChinese(entry.transcript); const score = Math.max(0, Math.round((1 - distance(target, heard) / Math.max(target.length, heard.length, 1)) * 100)); return { score, heard: entry.transcript }; }).sort((a,b) => b.score - a.score);
      const best = ranked[0];
      const feedback = best.score >= 90 ? '¡Muy bien! El navegador entendió la frase completa.' : best.score >= 65 ? 'Casi. Escucha otra vez y repite con un ritmo más claro.' : 'Inténtalo de nuevo por partes, siguiendo el pinyin.';
      setResult({ ...best, feedback });
    };
    recognition.start();
  };

  const next = () => { setIndex((current) => (current + 1) % commonPhrases.length); setResult(null); setError(''); };
  return <section className="speak-view">
    <div className="speak-copy"><p className="eyebrow">ENTRENADOR DE PRONUNCIACIÓN · BETA</p><h1>Escucha. Habla.<br />Comprueba.</h1><p className="lede">El navegador escucha en mandarín y compara los caracteres reconocidos con la frase objetivo.</p><div className="privacy-note"><b>Privacidad</b><span>La app no guarda tus grabaciones.</span></div></div>
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
