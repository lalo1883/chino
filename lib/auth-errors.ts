export function authErrorMessage(code: string) {
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request': return '';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password': return 'Correo o contraseña incorrectos.';
    case 'auth/email-already-in-use': return 'Este correo ya tiene una cuenta. Inicia sesión o recupera tu contraseña.';
    case 'auth/account-exists-with-different-credential': return 'Este correo usa otro método de acceso. Inicia sesión con ese método primero.';
    case 'auth/weak-password': return 'Usa una contraseña de al menos 8 caracteres.';
    case 'auth/invalid-email': return 'Escribe un correo válido.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.';
    case 'auth/network-request-failed': return 'No hay conexión. Inténtalo cuando recuperes internet.';
    case 'auth/popup-blocked': return 'Permite la ventana emergente para iniciar sesión con Google.';
    case 'auth/unauthorized-domain': return 'El acceso no está disponible en esta dirección. Prueba desde la página principal.';
    case 'auth/operation-not-allowed': return 'Este método de acceso no está disponible por ahora.';
    default: return 'No se pudo iniciar sesión. Inténtalo de nuevo.';
  }
}
