'use client';

import { useEffect, useState } from 'react';

export const THEME_KEY = 'chino-theme';

function applyTheme(bw: boolean) {
  document.documentElement.dataset.theme = bw ? 'bw' : 'color';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bw ? '#ffffff' : '#f3f6f4');
}

/** Alterna entre la versión a color y la versión blanco y negro. */
export function ThemeToggle() {
  const [bw, setBw] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBw(document.documentElement.dataset.theme === 'bw');
  }, []);
  const toggle = () => {
    const next = !bw;
    setBw(next);
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next ? 'bw' : 'color'); } catch { /* almacenamiento no disponible */ }
  };
  return <button className="theme-pill" onClick={toggle} aria-pressed={bw} title={bw ? 'Volver a color' : 'Versión blanco y negro'} aria-label="Versión blanco y negro"><i aria-hidden="true" /><span>B/N</span></button>;
}
