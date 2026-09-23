'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Card = { hanzi: string; pinyin: string; meaning: string; sentence: string; translation: string; audio: string; tag: string };
type Level = { name: string; description: string; cards: Card[] };

const course: Level[] = [
  { name: 'HSK 1', description: 'Primeros pasos', cards: [
    { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Hola', sentence: '你好，我叫安娜。', translation: 'Hola, me llamo Ana.', audio: 'ni-hao', tag: 'SALUDO' },
    { hanzi: '谢谢', pinyin: 'xièxie', meaning: 'Gracias', sentence: '谢谢你的帮助。', translation: 'Gracias por tu ayuda.', audio: 'xie-xie', tag: 'CORTESÍA' },
    { hanzi: '再见', pinyin: 'zàijiàn', meaning: 'Adiós', sentence: '明天见，再见！', translation: 'Nos vemos mañana, ¡adiós!', audio: 'zai-jian', tag: 'SALUDO' },
    { hanzi: '请', pinyin: 'qǐng', meaning: 'Por favor / invitar', sentence: '请坐。', translation: 'Siéntate, por favor.', audio: 'qing', tag: 'CORTESÍA' },
    { hanzi: '水', pinyin: 'shuǐ', meaning: 'Agua', sentence: '我想喝水。', translation: 'Quiero beber agua.', audio: 'shui', tag: 'SUSTANTIVO' },
    { hanzi: '朋友', pinyin: 'péngyou', meaning: 'Amigo/a', sentence: '他是我的好朋友。', translation: 'Él es mi buen amigo.', audio: 'peng-you', tag: 'PERSONAS' },
  ]},
  { name: 'HSK 2', description: 'Vida cotidiana', cards: [
    { hanzi: '因为', pinyin: 'yīnwèi', meaning: 'Porque', sentence: '因为下雨，我没去。', translation: 'No fui porque llovía.', audio: 'yin-wei', tag: 'CONECTOR' },
    { hanzi: '所以', pinyin: 'suǒyǐ', meaning: 'Por eso', sentence: '我累了，所以想休息。', translation: 'Estoy cansado, por eso quiero descansar.', audio: 'suo-yi', tag: 'CONECTOR' },
    { hanzi: '已经', pinyin: 'yǐjīng', meaning: 'Ya', sentence: '我已经吃饭了。', translation: 'Ya he comido.', audio: 'yi-jing', tag: 'ADVERBIO' },
    { hanzi: '可能', pinyin: 'kěnéng', meaning: 'Quizás / posible', sentence: '他可能不来。', translation: 'Quizás no venga.', audio: 'ke-neng', tag: 'ADVERBIO' },
    { hanzi: '意思', pinyin: 'yìsi', meaning: 'Significado', sentence: '这个字是什么意思？', translation: '¿Qué significa este carácter?', audio: 'yi-si', tag: 'SUSTANTIVO' },
    { hanzi: '觉得', pinyin: 'juéde', meaning: 'Pensar / sentir', sentence: '我觉得中文很有意思。', translation: 'Me parece que el chino es interesante.', audio: 'jue-de', tag: 'VERBO' },
  ]},
  { name: 'HSK 3', description: 'Conversación', cards: [
    { hanzi: '竞争', pinyin: 'jìngzhēng', meaning: 'Competencia', sentence: '这个行业的竞争很激烈。', translation: 'La competencia en este sector es intensa.', audio: 'jing-zheng', tag: 'SUSTANTIVO' },
    { hanzi: '经济', pinyin: 'jīngjì', meaning: 'Economía', sentence: '经济正在慢慢恢复。', translation: 'La economía se recupera poco a poco.', audio: 'jing-ji', tag: 'SOCIEDAD' },
    { hanzi: '结果', pinyin: 'jiéguǒ', meaning: 'Resultado', sentence: '考试结果明天公布。', translation: 'El resultado del examen se publica mañana.', audio: 'jie-guo', tag: 'SUSTANTIVO' },
    { hanzi: '适应', pinyin: 'shìyìng', meaning: 'Adaptarse', sentence: '她很快适应了新生活。', translation: 'Se adaptó rápido a la nueva vida.', audio: 'shi-ying', tag: 'VERBO' },
    { hanzi: '印象', pinyin: 'yìnxiàng', meaning: 'Impresión', sentence: '他给我留下了好印象。', translation: 'Me dejó una buena impresión.', audio: 'yin-xiang', tag: 'SUSTANTIVO' },
    { hanzi: '收入', pinyin: 'shōurù', meaning: 'Ingresos', sentence: '他的收入比去年高。', translation: 'Sus ingresos son mayores que el año pasado.', audio: 'shou-ru', tag: 'ECONOMÍA' },
  ]},
  { name: 'HSK 4', description: 'Ideas complejas', cards: [
    { hanzi: '承担', pinyin: 'chéngdān', meaning: 'Asumir / soportar', sentence: '我们要承担自己的责任。', translation: 'Debemos asumir nuestra responsabilidad.', audio: 'cheng-dan', tag: 'VERBO' },
    { hanzi: '顾虑', pinyin: 'gùlǜ', meaning: 'Preocupación / considerar', sentence: '他做决定时有很多顾虑。', translation: 'Tiene muchas dudas al decidir.', audio: 'gu-lv', tag: 'ABSTRACTO' },
    { hanzi: '抽象', pinyin: 'chōuxiàng', meaning: 'Abstracto', sentence: '这个概念比较抽象。', translation: 'Este concepto es bastante abstracto.', audio: 'chou-xiang', tag: 'ADJETIVO' },
    { hanzi: '灵活', pinyin: 'línghuó', meaning: 'Flexible', sentence: '这个办法很灵活。', translation: 'Este método es muy flexible.', audio: 'ling-huo', tag: 'ADJETIVO' },
    { hanzi: '权威', pinyin: 'quánwēi', meaning: 'Autoridad', sentence: '她是这个领域的权威。', translation: 'Ella es una autoridad en este campo.', audio: 'quan-wei', tag: 'SUSTANTIVO' },
    { hanzi: '趋势', pinyin: 'qūshì', meaning: 'Tendencia', sentence: '这是未来的发展趋势。', translation: 'Esta es la tendencia de desarrollo futura.', audio: 'qu-shi', tag: 'SUSTANTIVO' },
  ]},
];

const SESSION_SIZE = 6;

export default function Home() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [streak, setStreak] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const level = course[levelIndex];
  const card = level.cards[cardIndex];
  const key = `${level.name}-${card.hanzi}`;

  useEffect(() => {
    const saved = localStorage.getItem('mi-diario-progress');
    if (saved) setRatings(JSON.parse(saved));
    const savedStreak = Number(localStorage.getItem('mi-diario-streak') || 1);
    setStreak(savedStreak);
  }, []);

  const completed = useMemo(() => level.cards.filter((item) => ratings[`${level.name}-${item.hanzi}`]).length, [level, ratings]);

  const playAudio = useCallback(() => {
    audioRef.current?.pause();
    const audio = new Audio(`/audio/${card.audio}.mp3`);
    audioRef.current = audio;
    audio.play().catch(() => undefined);
  }, [card.audio]);

  const chooseLevel = (index: number) => {
    setLevelIndex(index); setCardIndex(0); setRevealed(false);
  };

  const rate = useCallback((value: 'difícil' | 'dudosa' | 'fácil') => {
    const next = { ...ratings, [key]: value };
    setRatings(next);
    localStorage.setItem('mi-diario-progress', JSON.stringify(next));
    setTimeout(() => {
      setCardIndex((current) => (current + 1) % level.cards.length);
      setRevealed(false);
    }, 180);
  }, [key, level.cards.length, ratings]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') { event.preventDefault(); setRevealed((value) => !value); }
      if (event.key.toLowerCase() === 'p') playAudio();
      if (revealed && ['1', '2', '3'].includes(event.key)) rate(event.key === '1' ? 'difícil' : event.key === '2' ? 'dudosa' : 'fácil');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playAudio, rate, revealed]);

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Mǐ diario, inicio"><span className="brand-mark">字</span><span>Mǐ diario</span></a>
        <div className="header-actions"><span className="voice-pill"><i /> Xiaoxiao · −15%</span><div className="streak" aria-label={`Racha de ${streak} días`}><span>●</span> {streak} día{streak === 1 ? '' : 's'}</div></div>
      </header>

      <section className="intro" id="top">
        <div><p className="eyebrow">今天 · HOY</p><h1>Un poco de chino.<br />Todos los días.</h1><p className="lede">Aprende palabras útiles, escúchalas y vuelve a ellas justo antes de olvidarlas.</p></div>
        <div className="progress-card">
          <div className="progress-top"><span>Progreso de este nivel</span><strong>{completed}/{SESSION_SIZE}</strong></div>
          <div className="week" aria-label={`${completed} de ${SESSION_SIZE} tarjetas completadas`}>
            {Array.from({ length: SESSION_SIZE }, (_, index) => <span className={index < completed ? 'done' : index === cardIndex ? 'current' : ''} key={index}>{index < completed ? '✓' : index + 1}</span>)}
          </div>
        </div>
      </section>

      <section className="study-layout">
        <aside className="levels-panel">
          <div className="section-heading"><span>Niveles</span><small>{levelIndex + 1} de {course.length}</small></div>
          <div className="level-list">
            {course.map((item, index) => (
              <button aria-pressed={index === levelIndex} className={`level ${index === levelIndex ? 'active' : ''}`} key={item.name} onClick={() => chooseLevel(index)}>
                <span>{item.name}<em>{item.description}</em></span><small>{item.cards.length} palabras</small>
              </button>
            ))}
          </div>
          <div className="shortcuts"><strong>Atajos</strong><span><kbd>Espacio</kbd> revelar</span><span><kbd>P</kbd> escuchar</span><span><kbd>1–3</kbd> responder</span></div>
        </aside>

        <section className="lesson" aria-labelledby="lesson-title">
          <div className="lesson-head"><div><p className="eyebrow">SESIÓN DE HOY</p><h2 id="lesson-title">{level.description}</h2></div><span className="count">{cardIndex + 1} / {level.cards.length}</span></div>
          <article className={`flashcard ${revealed ? 'is-revealed' : ''}`} aria-live="polite">
            <span className="tone">{card.tag}</span>
            <button className="sound" onClick={playAudio} aria-label={`Escuchar ${card.hanzi}, voz Xiaoxiao a velocidad menos quince por ciento`}><span>♪</span><small>Escuchar</small></button>
            <div className="hanzi">{card.hanzi}</div>
            <div className="pinyin">{card.pinyin}</div>
            {revealed ? <div className="answer"><div className="divider" /><p className="meaning">{card.meaning}</p><p className="example"><span>{card.sentence}</span><br />{card.translation}</p></div> : <p className="prompt">Piensa en el significado antes de revelar</p>}
          </article>
          {!revealed ? (
            <button className="reveal" onClick={() => setRevealed(true)}>Mostrar respuesta <kbd>Espacio</kbd></button>
          ) : (
            <div className="rating" aria-label="Califica tu recuerdo">
              <button className="hard" onClick={() => rate('difícil')}><small>1</small> Difícil</button>
              <button className="unsure" onClick={() => rate('dudosa')}><small>2</small> Dudosa</button>
              <button className="easy" onClick={() => rate('fácil')}><small>3</small> Fácil</button>
            </div>
          )}
          <div className="hint">Escucha primero. Intenta decirlo en voz alta.</div>
        </section>

        <aside className="today-panel">
          <div className="section-heading"><span>Tu sesión</span></div>
          <div className="stat-ring" style={{ '--progress': `${Math.round((completed / SESSION_SIZE) * 100)}%` } as React.CSSProperties}><div><strong>{SESSION_SIZE}</strong><small>tarjetas</small></div></div>
          <dl><div><dt>Nuevas</dt><dd>{SESSION_SIZE - completed}</dd></div><div><dt>Repasadas</dt><dd>{completed}</dd></div><div><dt>Tiempo aprox.</dt><dd>{Math.max(1, SESSION_SIZE - completed)} min</dd></div></dl>
          <button className="reset" onClick={() => { const next = Object.fromEntries(Object.entries(ratings).filter(([savedKey]) => !savedKey.startsWith(level.name))); setRatings(next); localStorage.setItem('mi-diario-progress', JSON.stringify(next)); }}>Reiniciar nivel</button>
          <p className="quote"><span>水滴石穿</span><br />La constancia vence la piedra.</p>
        </aside>
      </section>
      <footer>24 palabras y frases para empezar · Tu progreso se guarda en este dispositivo</footer>
    </main>
  );
}
