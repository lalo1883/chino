# Chino

Aplicación web para aprender chino simplificado mediante tarjetas, vocabulario, frases, audio y práctica de pronunciación.

La app Android nativa vive en `../chino-android` y carga este sitio desplegado.

## Contenido y audio

- Las tarjetas viven en `app/content.ts`; los ejemplos de cada palabra en `app/examples.ts` (`palabra|frase|traducción`; el pinyin y el desglose se generan solos con el diccionario).
- Tras añadir palabras, frases o ejemplos, genera el audio que falte con `python3 scripts/generate-library-audio.py` (necesita `edge-tts`).
- La versión blanco y negro se activa con el botón **B/N** de la cabecera y se recuerda en el dispositivo.
