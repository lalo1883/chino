'use client';

import { useLanguage } from '@/components/language-provider';
import { meaningFor } from '@/lib/translations';

import { useEffect, useMemo, useRef, useState } from 'react';
import { findWordAudio, type Segment } from '@/app/content';
import { playClip } from './library-view';

type Piece = { text: string; segment?: Segment };

/** Reparte la frase en palabras tocables y texto suelto (puntuación). */
function toPieces(hanzi: string, breakdown: Segment[]): Piece[] {
  const pieces: Piece[] = [];
  let cursor = 0;
  for (const part of breakdown) {
    const at = hanzi.indexOf(part.hanzi, cursor);
    if (at < 0) continue;
    if (at > cursor) pieces.push({ text: hanzi.slice(cursor, at) });
    pieces.push({ text: part.hanzi, segment: part });
    cursor = at + part.hanzi.length;
  }
  if (cursor < hanzi.length) pieces.push({ text: hanzi.slice(cursor) });
  return pieces;
}

/** Frase en chino cuyas palabras se pueden tocar para ver pinyin y traducción sin salir de la pantalla. */
export function TappableSentence({ hanzi, breakdown, speed, highlight = '', className = '' }: { hanzi: string; breakdown: Segment[]; speed: number; highlight?: string; className?: string }) {
  const { language, t } = useLanguage();
  const pieces = useMemo(() => toPieces(hanzi, breakdown), [hanzi, breakdown]);
  const [open, setOpen] = useState<{ index: number; left: number } | null>(null);
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => { if (!box.current?.contains(event.target as Node)) setOpen(null); };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      box.current?.querySelector<HTMLButtonElement>('.tap-word.open')?.focus();
      setOpen(null);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape, true);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape, true); };
  }, [open]);

  const toggle = (index: number, button: HTMLButtonElement) => {
    if (open?.index === index) { setOpen(null); return; }
    const container = box.current?.getBoundingClientRect();
    if (!container) return;
    const anchor = button.getBoundingClientRect();
    const halfWidth = Math.min(240, window.innerWidth - 32) / 2;
    const center = anchor.left + anchor.width / 2;
    // Mantener la tarjeta dentro de la pantalla, incluso en frases cortas.
    const left = Math.min(Math.max(center, halfWidth + 16), window.innerWidth - halfWidth - 16);
    setOpen({ index, left: left - container.left });
  };

  const current = open ? pieces[open.index]?.segment : undefined;
  const word = current ? findWordAudio(current.hanzi) : undefined;
  return <span ref={box} className={`tappable ${className}`}>
    {pieces.map((piece, index) => piece.segment
      ? <button key={index} type="button" className={`tap-word ${open?.index === index ? 'open' : ''} ${highlight && piece.text === highlight ? 'hit' : ''}`} aria-expanded={open?.index === index} aria-label={t(`${piece.text}: ver significado`)} onClick={(event) => toggle(index, event.currentTarget)}>{piece.text}</button>
      : <span key={index}>{piece.text}</span>)}
    {current && open && <span className={`tap-pop ${word ? 'has-audio' : ''}`} role="dialog" aria-label={t(`Significado de ${current.hanzi}`)} style={{ left: open.left }}>
      <b>{current.hanzi}</b><em>{current.pinyin}</em><span>{meaningFor(current, language)}</span>
      {word && <button className="tap-pop-audio" type="button" onClick={() => playClip(word, speed)} aria-label={t(`Escuchar ${current.hanzi}`)} title={t(`Escuchar ${current.hanzi}`)}><span aria-hidden="true">{t("♪")}</span></button>}
    </span>}
  </span>;
}
