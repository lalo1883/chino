'use client';

import { useLanguage } from '@/components/language-provider';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { authClient } from '@/lib/auth-client';

type Props = {
  syncState: 'local' | 'saving' | 'synced' | 'error';
  onSignedOut: () => void;
  fallbackUser?: { id: string; name: string; email: string } | null;
};

export function AccountMenu({ syncState, onSignedOut, fallbackUser }: Props) {
  const { t } = useLanguage();
  const { data: session, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'register' | 'login'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const titleId = useId();
  const introId = useId();
  const passwordHintId = useId();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const signInGoogle = async () => {
    if (googleSubmitting || submitting) return;
    setError('');
    setNotice('');
    setShowPassword(false);
    setGoogleSubmitting(true);
    try {
      const result = await authClient.signIn.social();
      if (result.error) {
        setError(result.error.message);
      } else close();
    } catch {
      setError('No se pudo iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const close = () => {
    setOpen(false);
    setShowPassword(false);
    setError('');
    setNotice('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setNotice('');
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');

    const result = mode === 'register'
      ? await authClient.signUp.email({
          name: String(form.get('name') || '').trim(),
          email,
          password,
        })
      : await authClient.signIn.email({ email, password });

    setSubmitting(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }

    close();
  };

  const resetPassword = async () => {
    const emailInput = formRef.current?.elements.namedItem('email') as HTMLInputElement | null;
    const email = emailInput?.value.trim() || '';
    setError(''); setNotice('');
    if (!email || !emailInput?.validity.valid) {
      setError('Escribe un correo válido.');
      emailInput?.focus();
      return;
    }
    setSubmitting(true);
    const result = await authClient.resetPassword(email);
    setSubmitting(false);
    if (result.error) setError(result.error.message);
    else setNotice('Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu contraseña.');
  };

  const signOut = async () => {
    await authClient.signOut();
    onSignedOut();
  };

  return <>
    {!session?.user && fallbackUser ? <div className="account-signed-in">
      <span aria-hidden="true">{(fallbackUser.name || fallbackUser.email).slice(0, 1).toUpperCase()}</span>
      <div><b>{fallbackUser.name || 'Estudiante'}</b><small>{t("Sin conexión · guardado local")}</small></div>
    </div> : session?.user ? <div className="account-signed-in">
      <span aria-hidden="true">{(session.user.name || session.user.email).slice(0, 1).toUpperCase()}</span>
      <div><b>{session.user.name || 'Estudiante'}</b><small>{syncState === 'saving' ? t('Sincronizando…') : syncState === 'error' ? t('Guardado local') : t('Progreso sincronizado')}</small></div>
      <button onClick={signOut}>{t("Salir")}</button>
    </div> : <button className="account-button" aria-label={t(isPending ? 'Cargando…' : 'Entrar')} onClick={() => setOpen(true)} disabled={isPending}>
      <span aria-hidden="true">{t("人")}</span><b>{isPending ? t('Cargando…') : t('Entrar')}</b>
    </button>}

    <dialog ref={dialogRef} className="auth-dialog" aria-labelledby={titleId} aria-describedby={introId} onClose={close} onCancel={close} onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
    }}>
      <button className="dialog-close" onClick={close} aria-label={t("Cerrar")}>{"×"}</button>
      <header className="auth-header">
        <p className="eyebrow">{t("APRENDE A TU RITMO")}</p>
        <h2 id={titleId}>{mode === 'register' ? t('Crea tu cuenta.') : t('Bienvenido de vuelta.')}</h2>
        <p id={introId} className="auth-intro">{t('Guarda tu progreso y continúa en cualquier dispositivo.')}</p>
      </header>
      <div className="auth-tabs" role="group" aria-label={t("Acceso a la cuenta")}>
        <button aria-pressed={mode === 'login'} disabled={submitting || googleSubmitting} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setShowPassword(false); setError(''); setNotice(''); }}>{t("Iniciar sesión")}</button>
        <button aria-pressed={mode === 'register'} disabled={submitting || googleSubmitting} className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setShowPassword(false); setError(''); setNotice(''); }}>{t("Crear cuenta")}</button>
      </div>
      <button type="button" className="google-sign-in" onClick={signInGoogle} disabled={submitting || googleSubmitting}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.06.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.93a6 6 0 0 1 0-3.86V7.48H3.07a10 10 0 0 0 0 9.04l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.82 1.5l2.86-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.34 2.59C7.2 7.71 9.4 5.95 12 5.95Z"/></svg>
        {t(googleSubmitting ? 'Conectando con Google…' : 'Continuar con Google')}
      </button>
      <div className="auth-divider"><span>{t('o con tu correo')}</span></div>
      {notice && <p className="auth-notice" role="status">{t(notice)}</p>}
      {error && <div className="auth-error" role="alert">{t(error)}</div>}
      <form ref={formRef} onSubmit={submit} aria-busy={submitting || googleSubmitting}>
        {mode === 'register' && <label key="name">{t("Nombre")}<input disabled={submitting || googleSubmitting} name="name" autoComplete="name" required minLength={2} placeholder={t("Tu nombre")} /></label>}
        <label key="email">{t("Correo")}<input disabled={submitting || googleSubmitting} name="email" type="email" inputMode="email" autoComplete="email" required placeholder={t("tu@correo.com")} /></label>
        <div className="auth-password-field" key="password">
          <label htmlFor={`${titleId}-password`}>{t("Contraseña")}</label>
          <div className="auth-password-input">
            <input id={`${titleId}-password`} disabled={submitting || googleSubmitting} name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 8 : undefined} aria-describedby={mode === 'register' ? passwordHintId : undefined} placeholder={t('Tu contraseña')} />
            <button type="button" className="password-visibility" disabled={submitting || googleSubmitting} aria-label={t(showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña')} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{t(showPassword ? 'Ocultar' : 'Mostrar')}</button>
          </div>
          {mode === 'register' && <small id={passwordHintId} className="password-hint">{t('Mínimo 8 caracteres')}</small>}
        </div>
        {mode === 'login' && <button type="button" className="forgot-password" disabled={submitting || googleSubmitting} onClick={resetPassword}>{t('¿Olvidaste tu contraseña?')}</button>}
        <button className="auth-submit" disabled={submitting || googleSubmitting}>{submitting ? t('Un momento…') : mode === 'register' ? t('Crear mi cuenta') : t('Entrar')}</button>
      </form>
      <button type="button" className="auth-guest" onClick={close}>{t('Seguir sin cuenta')} <span aria-hidden="true">→</span></button>
      <small className="auth-note">{t("No compartimos tus datos. Tus grabaciones de pronunciación no se guardan.")}</small>
    </dialog>
  </>;
}
