# Administración y comunidad

`/admin` utiliza una instancia separada de Firebase Authentication. La cuenta de administración tiene un claim `admin: true` aplicado con privilegios de servidor. La contraseña se almacena en Firebase Authentication; no aparece en el código ni en los paquetes del navegador. Las reglas de Firestore protegen el buzón, perfiles, progreso y analíticas por ese claim, incluso si alguien modifica la interfaz o llama al SDK directamente.

## Moderación

- Los botones «Corregir» están junto a traducciones de biblioteca, libro, ejemplos, desgloses, tarjetas, listening (después de revelar la respuesta), speaking, writing y progreso.
- «Agregar vocabulario» y «Buzón de sugerencias» están en la biblioteca y al pie de todas las secciones.
- Se admiten propuestas sin cuenta; el nombre del autor es opcional y declarado por la persona.
- Todas las propuestas llegan a `communityInbox` con estado `pending`. Los visitantes pueden crearlas con campos y límites validados por reglas, pero no leerlas ni aprobarlas.
- La aprobación escribe `publishedContent` y marca la propuesta revisada en una sola transacción. Rechazar conserva el contenido original. No se borra el historial de propuestas.
- El administrador puede ajustar el texto de traducción antes de aprobar. Chino, idioma y tipo de la propuesta se conservan para mantener su contexto.
- El contenido aprobado se carga al abrir la web. Una corrección se aplica a su chino e idioma en todas las traducciones mostradas. Las contribuciones nuevas aparecen en la categoría Comunidad y pueden estudiarse. Si el chino ya existe, su traducción se actualiza sin duplicar la entrada. El audio de una contribución utiliza la voz china disponible del navegador; no se genera una grabación.
- Las correcciones tratan la traducción. El pinyin mostrado en ese formulario es de referencia; el vocabulario nuevo incluye pinyin.
- La bandeja carga las 200 propuestas más recientes y permite cargar páginas anteriores. Los filtros actúan sobre las propuestas cargadas; el contador de pendientes consulta toda la colección.

## Analíticas

`learningEvents` registra visitas por sesión y respuestas de flashcards, listening, writing y speaking. Usa un identificador aleatorio persistido en el navegador; no registra IP, correo, grabaciones ni transcripciones. Son eventos declarados por el cliente, no medidas antifraude.

El panel resume los últimos 30 días (máximo 10.000 eventos, indicado cuando se alcanza). Flashcards mide recuerdo declarado; listening mide una respuesta comprobada; writing mide caracteres completados sin errores; speaking mide reconocimiento del navegador, no una evaluación fonética profesional. El historial anterior aporta cuentas con progreso y número de repasos acumulados, pero no contiene fallos completos por intento. Estos se registran desde esta implementación. Los gráficos agrupan días UTC.

El total exacto de cuentas se consulta en `/api/admin/accounts`. El servidor verifica el ID token con Firebase y el claim administrativo antes de consultar Authentication; solo devuelve el número, excluyendo administradores. En desarrollo se reutiliza la sesión CLI mediante una variable privada en `.env.local`. En producción, configurar `FIREBASE_SERVICE_ACCOUNT_JSON` con una cuenta de servicio del proyecto `chino-web` y permiso Firebase Authentication Viewer. No copiar la sesión CLI a producción. Si faltan credenciales, la tarjeta indica «Perfiles sincronizados», sin presentarla como total exacto. El registro inicial contiene las tres cuentas migradas y se actualiza al iniciar sesión o crear cuenta.

La web aún no está desplegada con estas funciones. Las reglas y la cuenta administrativa sí están configuradas en el proyecto real.

## Verificación

37 pruebas de aplicación y 4 pruebas de reglas. Flujo de corrección, aprobación y aplicación pública comprobado con emuladores `demo-chino-web`; ninguna propuesta de prueba se publica en el proyecto real. Compilaciones de Next.js y Vinext verificadas. También se comprobó acceso administrativo real y recuento exacto de 3 estudiantes.

Referencias: [claims administrativos de Firebase](https://firebase.google.com/docs/auth/admin/custom-claims), [REST de Firestore](https://firebase.google.com/docs/firestore/use-rest-api), [administrar usuarios](https://firebase.google.com/docs/auth/admin/manage-users).
