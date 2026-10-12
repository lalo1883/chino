'use client';

import { useLanguage } from '@/components/language-provider';

import { useEffect, useRef, useState, type FormEvent } from 'react';
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
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
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
      setError(mode === 'register'
        ? 'No se pudo crear la cuenta. Revisa el correo y usa al menos 8 caracteres.'
        : 'Correo o contraseña incorrectos.');
      return;
    }

    close();
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

    <dialog ref={dialogRef} className="auth-dialog" onClose={close} onCancel={close}>
      <button className="dialog-close" onClick={close} aria-label={t("Cerrar")}>{"×"}</button>
      <div className="auth-mark">{"字"}</div>
      <p className="eyebrow">{t("TU PROGRESO EN CUALQUIER DISPOSITIVO")}</p>
      <h2>{mode === 'register' ? t('Crea tu cuenta.') : t('Bienvenido de vuelta.')}</h2>
      <p className="auth-intro">{mode === 'register' ? t('Tu avance se guardará de forma privada y podrás continuarlo desde tu celular o computadora.') : t('Continúa exactamente donde te quedaste.')}</p>
      <div className="auth-tabs" role="tablist" aria-label={t("Acceso a la cuenta")}>
        <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>{t("Crear cuenta")}</button>
        <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>{t("Iniciar sesión")}</button>
      </div>
      <form onSubmit={submit}>
        {mode === 'register' && <label>{t("Nombre")}<input name="name" autoComplete="name" required minLength={2} placeholder={t("Tu nombre")} /></label>}
        <label>{t("Correo")}<input name="email" type="email" inputMode="email" autoComplete="email" required placeholder={t("tu@correo.com")} /></label>
        <label>{t("Contraseña")}<input name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={8} placeholder={t("Mínimo 8 caracteres")} /></label>
        {error && <div className="auth-error" role="alert">{t(error)}</div>}
        <button className="auth-submit" disabled={submitting}>{submitting ? t('Un momento…') : mode === 'register' ? t('Crear mi cuenta') : t('Entrar')}</button>
      </form>
      <small className="auth-note">{t("No compartimos tus datos. Tus grabaciones de pronunciación no se guardan.")}</small>
    </dialog>
  </>;
}
