'use client';

import { useLanguage } from '@/components/language-provider';

import { useEffect, useState } from 'react';

import { applyTheme, THEME_KEY } from '@/lib/theme';

/** Alterna entre el tema claro y el modo noche. */
export function ThemeToggle() {
  const { t } = useLanguage();
  const [dark, setDark] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'color'); } catch { /* almacenamiento no disponible */ }
  };
  const label = dark ? t('Activar modo claro') : t('Activar modo noche');
  return <button type="button" className="theme-pill" onClick={toggle} aria-pressed={dark} title={label} aria-label={t('Modo noche')}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.8 13A9 9 0 0 1 11 3.2 9 9 0 1 0 20.8 13Z" />
    </svg>
    <span>{t('Modo noche')}</span>
  </button>;
}
