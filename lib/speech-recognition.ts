export type SpeechStatus = 'idle' | 'starting' | 'listening' | 'processing';
type RecognitionResult = ArrayLike<{ transcript: string }> & { isFinal: boolean };
export type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
export type BrowserSpeechRecognition = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onstart: () => void; onend: () => void;
  onerror: (event: { error: string }) => void;
  onresult: (event: RecognitionEvent) => void;
  onnomatch: () => void;
  start: () => void; stop: () => void; abort: () => void;
};
export function speechErrorMessage(code: string) {
  switch (code) {
    case 'not-allowed': return 'El permiso del micrófono está bloqueado. Permite el micrófono en los ajustes de este sitio y en los permisos del navegador de tu dispositivo. Después vuelve a intentarlo.';
    case 'service-not-allowed': return 'Este navegador no permite su servicio de reconocimiento de voz. Abre la página directamente en Chrome o Safari con el micrófono permitido.';
    case 'network': return 'El servicio de reconocimiento no pudo conectarse. Revisa tu conexión; algunas redes bloquean este servicio aunque la página cargue correctamente.';
    case 'audio-capture': return 'No se pudo acceder al micrófono. Comprueba que esté conectado y que otra aplicación no lo esté usando.';
    case 'language-not-supported': return 'Este navegador no ofrece reconocimiento en mandarín. Prueba abrir la página directamente en Chrome o Safari.';
    case 'no-speech': return 'No se detectó tu voz. Pulsa el micrófono otra vez y habla cuando aparezca “Escuchando”.';
    case 'start-timeout': return 'El micrófono no llegó a activarse. Revisa la solicitud de permiso y los permisos del navegador. Si estás en un navegador integrado, abre la página en Chrome o Safari.';
    case 'result-timeout': return 'El servicio no devolvió una respuesta. Revisa tu conexión y vuelve a intentarlo.';
    case 'aborted': return 'La escucha se interrumpió. Puedes volver a intentarlo.';
    default: return 'No se pudo iniciar el reconocimiento de voz. Revisa el micrófono y vuelve a intentarlo.';
  }
}

// One attempt owns its callbacks and timers; late events cannot change a later attempt.
export function createSpeechAttempt({ recognition, onStatus, onTranscript, onResult, onError, schedule = setTimeout, cancel = clearTimeout }: {
  recognition: BrowserSpeechRecognition;
  onStatus: (status: SpeechStatus) => void;
  onTranscript: (text: string) => void;
  onResult: (alternatives: string[]) => void;
  onError: (message: string) => void;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel?: (timer: ReturnType<typeof setTimeout>) => void;
}) {
  let active = true;
  let phase: SpeechStatus = 'idle';
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clear = () => { if (timer !== undefined) cancel(timer); timer = undefined; };
  const abort = () => { try { recognition.abort(); } catch { /* Already ended. */ } };
  const finish = (error?: string) => {
    if (!active) return;
    active = false; clear(); phase = 'idle'; onStatus(phase);
    if (error) onError(speechErrorMessage(error));
  };
  const deadline = (milliseconds: number, error: string) => { clear(); timer = schedule(() => { finish(error); abort(); }, milliseconds); };
  const stop = () => {
    if (!active) return;
    if (phase === 'starting') { finish(); abort(); return; }
    if (phase !== 'listening') return;
    phase = 'processing'; onStatus(phase); deadline(5000, 'result-timeout');
    try { recognition.stop(); } catch { finish('aborted'); abort(); }
  };
  recognition.onstart = () => { if (!active) return; phase = 'listening'; onStatus(phase); clear(); timer = schedule(stop, 30000); };
  recognition.onerror = event => finish(event.error);
  recognition.onnomatch = () => finish('no-speech');
  recognition.onend = () => finish('no-speech');
  recognition.onresult = event => {
    if (!active) return;
    const all = Array.from(event.results);
    onTranscript(all.map(result => result[0]?.transcript || '').join(''));
    const final = all.filter(result => result.isFinal);
    if (!final.length) return;
    const alternatives = Array.from(final[0]).map(entry => entry.transcript);
    finish(); onResult(alternatives); abort();
  };
  return {
    start: () => { phase = 'starting'; onStatus(phase); deadline(15000, 'start-timeout'); try { recognition.start(); } catch { finish('start-failed'); abort(); } },
    stop,
    dispose: () => { active = false; clear(); abort(); },
  };
}
