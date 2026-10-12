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

// A session remains active across the browser's silence/end events until explicit stop.
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
  let stopping = false;
  let running = false;
  let phase: SpeechStatus = 'idle';
  let timer: ReturnType<typeof setTimeout> | undefined;
  let completed: string[] = [''];
  let current: RecognitionResult[] = [];
  const clear = () => { if (timer !== undefined) cancel(timer); timer = undefined; };
  const abort = () => { try { recognition.abort(); } catch { /* Already ended. */ } };
  const alternatives = () => {
    let candidates = completed;
    for (const result of current.filter(result => result.isFinal)) {
      candidates = candidates.flatMap(prefix => Array.from(result).map(entry => prefix + entry.transcript)).slice(0, 5);
    }
    return candidates;
  };
  const finish = (error?: string) => {
    if (!active) return;
    active = false; clear(); phase = 'idle'; onStatus(phase);
    if (error) onError(speechErrorMessage(error));
    else { const matches = alternatives().filter(Boolean); if (matches.length) onResult(matches); else onError(speechErrorMessage('no-speech')); }
  };
  const deadline = (milliseconds: number, error: string) => { clear(); timer = schedule(() => { finish(error); abort(); }, milliseconds); };
  const startRun = () => {
    if (!active || stopping) return;
    clear(); current = []; deadline(15000, 'start-timeout');
    try { recognition.start(); } catch { finish('start-failed'); abort(); }
  };
  const stop = () => {
    if (!active || stopping) return;
    stopping = true; clear();
    if (phase === 'starting') { active = false; phase = 'idle'; onStatus(phase); abort(); return; }
    if (!running) { finish(); return; }
    phase = 'processing'; onStatus(phase);
    // A browser may never send onend; accept collected speech on the deadline.
    timer = schedule(() => { finish(); abort(); }, 5000);
    try { recognition.stop(); } catch { finish(); abort(); }
  };
  recognition.onstart = () => { if (!active) return; running = true; phase = stopping ? 'processing' : 'listening'; onStatus(phase); if (!stopping) clear(); };
  recognition.onerror = event => {
    if (!active) return;
    // Silence is a normal pause, not the end of the user's session.
    if (event.error === 'no-speech' && !stopping) return;
    if (event.error === 'no-speech' && stopping) finish();
    else { finish(event.error); abort(); }
  };
  recognition.onnomatch = () => { /* Keep listening; user may continue after a pause. */ };
  recognition.onend = () => {
    if (!active) return;
    running = false;
    if (stopping) { finish(); return; }
    completed = alternatives(); current = []; clear();
    // Avoid a tight restart loop when the platform ends immediately.
    timer = schedule(startRun, 300);
  };
  recognition.onresult = event => {
    if (!active) return;
    current = Array.from(event.results);
    onTranscript(completed[0] + current.map(result => result[0]?.transcript || '').join(''));
  };
  return {
    start: () => { if (!active || phase !== 'idle') return; phase = 'starting'; onStatus(phase); startRun(); },
    stop,
    dispose: () => { active = false; stopping = true; clear(); abort(); },
  };
}
