'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { translate, type Language } from '@/lib/translations';

const LANGUAGE_KEY = 'chino-language';
const LanguageContext = createContext<{ language: Language; setLanguage: (language: Language) => void; t: (text: string) => string }>({ language: 'es', setLanguage: () => {}, t: text => text });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrent] = useState<Language>('es');
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(LANGUAGE_KEY); } catch { /* Storage can be disabled. */ }
    if (saved === 'en') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrent('en');
    }
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const setLanguage = useCallback((next: Language) => {
    setCurrent(next);
    try { localStorage.setItem(LANGUAGE_KEY, next); } catch { /* Keep the selection for this session. */ }
  }, []);
  const t = useCallback((text: string) => translate(text, language), [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { return useContext(LanguageContext); }

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();
  return <label className="language-switch"><span className="sr-only">{t('Idioma')}</span><select aria-label={t('Idioma')} value={language} onChange={event => setLanguage(event.target.value as Language)}><option value="es">ES</option><option value="en">EN</option></select></label>;
}
