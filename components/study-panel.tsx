'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { useLanguage } from './language-provider';

/** Native modal: keyboard focus stays inside and returns to its trigger on close. */
export function StudyPanel({ title, label, children }: { title: string; label?: string; children: ReactNode }) {
  const { t } = useLanguage();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  return <div className="study-panel">
    <button className="panel-trigger" aria-haspopup="dialog" aria-controls={`${titleId}-dialog`} aria-expanded={open} onClick={() => { dialog.current?.showModal(); setOpen(true); }}>{label ?? title}</button>
    <dialog id={`${titleId}-dialog`} ref={dialog} className="study-dialog" aria-labelledby={titleId} onClose={() => setOpen(false)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="study-dialog-content"><header><h2 id={titleId}>{title}</h2><button aria-label={t('Cerrar')} onClick={() => dialog.current?.close()}>×</button></header>
        <div className="study-dialog-fields">{children}</div>
        <button className="practice-primary" onClick={() => dialog.current?.close()}>{t('Listo')}</button>
      </div>
    </dialog>
  </div>;
}
