# Chino

Aplicación web para aprender chino simplificado mediante tarjetas, vocabulario, frases, audio y práctica de pronunciación.

La app Android nativa vive en `../chino-android` y carga este sitio desplegado.

## Contenido y audio

- Las tarjetas viven en `app/content.ts`; los ejemplos de cada palabra en `app/examples.ts` (`palabra|frase|traducción`; el pinyin y el desglose se generan solos con el diccionario).
- Tras añadir palabras, frases o ejemplos, genera el audio que falte con `python3 scripts/generate-library-audio.py` (necesita `edge-tts`).
- La versión blanco y negro se activa con el botón **B/N** de la cabecera y se recuerda en el dispositivo.

## Firebase

La app usa **Firebase Authentication** (correo/contraseña y Google) y **Cloud Firestore** del proyecto `chino-web`. El navegador se conecta directamente mediante el SDK modular. El servidor de la web ya no necesita PostgreSQL, Better Auth ni credenciales OAuth de Google.

La configuración web pública está en `lib/firebase.ts` y puede reemplazarse con las variables `NEXT_PUBLIC_FIREBASE_*` de `.env.example`. No se inicializa Analytics. Las sesiones persisten en el navegador y el progreso de invitados sigue guardándose localmente.

### Preparar el proyecto

1. Habilita Correo/contraseña y Google en Authentication.
2. Añade `localhost` y el dominio de producción (`chino-xi.vercel.app`) a **Authentication → Configuración → Dominios autorizados**.
3. Crea la base Cloud Firestore predeterminada en modo nativo.
4. Inicia sesión con la cuenta propietaria: `npx firebase-tools login --reauth`.
5. Publica las reglas y exenciones de índices: `npm run firebase:rules`.

El retorno OAuth lo administra Firebase en `https://chino-web.firebaseapp.com/__/auth/handler`. La web usa el flujo de ventana emergente del SDK, sin el antiguo callback de Better Auth.

### Datos y privacidad

Cada usuario tiene un documento `userProgress/{uid}` con `records`, `studyDays`, `speed`, `resetAt` y `updatedAt`. Las reglas permiten leer y escribir exclusivamente al propietario autenticado. Las consultas de colección y borrados directos están denegados. `records` y `studyDays` no se indexan.

Los guardados usan transacciones para combinar los repasos más recientes de varios dispositivos. Un reinicio guarda una marca `resetAt` para evitar que otro dispositivo restaure repasos anteriores. Si la red falla, el estudio queda en local y se sincroniza al recuperar la conexión. El cliente conserva las claves locales existentes.

### Migrar las cuentas y el progreso anteriores

La herramienta lee la base PostgreSQL anterior sin modificarla. Importa los usuarios conservando sus ID y los hashes de contraseñas con `STANDARD_SCRYPT` (N=16384, r=16, p=1, 64 bytes; sal hexadecimal interpretada como texto UTF-8). Las contraseñas nativas de Firebase se usan sin modificar; si una contraseña antigua falla y cambia al normalizarla con NFKC, el acceso prueba también la variante compatible con Better Auth.

```sh
# Inspección sin escribir en Firebase
npm run firebase:migrate
# Importación al proyecto chino-web
npm run firebase:migrate -- --apply
```

Para importar necesitas `DATABASE_URL` de la base anterior y una sesión Firebase CLI con permisos sobre `chino-web`, o una cuenta de servicio mediante `GOOGLE_APPLICATION_CREDENTIALS`. Las credenciales administrativas nunca se incluyen en el cliente ni se necesitan para ejecutar la app.

La importación valida los hashes antes de escribir y se puede reejecutar: conserva las cuentas Firebase existentes y combina su progreso. Si ya existe otro UID con el mismo correo, solo reutiliza esa cuenta cuando el correo está verificado. No sobrescribe su contraseña. No elimina los usuarios o datos de PostgreSQL.

Antes de cambiar producción, ejecuta la importación y verifica que los usuarios antiguos pueden entrar. Si alguien crea una cuenta Firebase antes de importar, puede necesitar recuperar su contraseña desde Firebase o usar Google; su contraseña existente no se reemplaza silenciosamente.

### Verificación

`npm test` ejecuta las pruebas de progreso y conversión de contraseñas. `npm run test:firebase` ejecuta las reglas contra los emuladores locales de Auth/Firestore (requiere Java 21 o superior). No usa el proyecto real ni datos personales.

Referencias: [Google en Firebase](https://firebase.google.com/docs/auth/web/google-signin), [reglas de Firestore](https://firebase.google.com/docs/firestore/security/rules-conditions), [importar usuarios](https://firebase.google.com/docs/auth/admin/import-users).
