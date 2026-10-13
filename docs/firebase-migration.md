# Migración a Firebase — 13 de octubre de 2026

La web local usa Firebase Authentication y Cloud Firestore del proyecto `chino-web`. Correo y Google comparten la misma sesión Firebase; el progreso ya no pasa por Better Auth o PostgreSQL.

## Verificado

- Compilaciones de Next.js y Vinext correctas.
- 34 pruebas de aplicación correctas.
- 2 pruebas de reglas en Firestore Emulator: acceso exclusivo del propietario, rechazo de consultas de colección, escrituras inválidas, borrados y reinicios con una marca anterior.
- Flujo de navegador con un usuario desechable en `demo-chino-web`: acceso por correo, escritura de un repaso en Firestore, sesión persistente y recuperación del progreso después de recargar.
- En el proyecto real, `localhost` está entre los dominios autorizados y una lectura anónima de progreso devuelve `PERMISSION_DENIED`.
- Inspección de PostgreSQL en modo solo lectura: 3 cuentas con contraseña y 3 documentos de progreso. Los hashes coinciden con el formato soportado por el importador.

## Migración real completada

La sesión de Firebase CLI ya tiene acceso a `chino-web`. Se publicaron las reglas y los índices de Firestore, se importaron las 3 cuentas con sus hashes de contraseña y UID originales y se copiaron los 3 documentos de progreso. Una lectura independiente confirmó los 3 UID con contraseña y la coincidencia de los 3 documentos con los datos de origen sanitizados.

Para repetir el importador, que conserva las cuentas existentes:

```sh
npm run firebase:rules
npm run firebase:migrate -- --apply
```

`chino-xi.vercel.app` ya está agregado a los dominios autorizados de Authentication. La base PostgreSQL original se conserva intacta.

Queda pendiente comprobar el acceso con la contraseña de una cuenta antigua y completar Google con una cuenta real; no se conocen las contraseñas ni se ha completado consentimiento OAuth en nombre del usuario. Los flujos de correo y progreso ya fueron probados con emuladores. Estos cambios de la web todavía no se han desplegado en producción.
