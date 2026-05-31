/** Reliable microphone capture for Whisper (WebM/Opus, minimum duration). */

const MIN_RECORD_MS = 600;

export function pickRecorderMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];
  for (const t of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return "audio/webm";
}

export type RecordingSession = {
  stop: () => void;
  cancel: () => void;
};

export async function startRecording(
  onComplete: (blob: Blob) => void,
  onError?: (err: Error) => void
): Promise<RecordingSession> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const mimeType = pickRecorderMimeType();
  const chunks: Blob[] = [];
  const startedAt = Date.now();

  const recorder = new MediaRecorder(stream, {
    mimeType,
    audioBitsPerSecond: 128000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const cleanup = () => {
    stream.getTracks().forEach((t) => t.stop());
  };

  recorder.onstop = () => {
    cleanup();
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_RECORD_MS) {
      onError?.(new Error("Hold the mic a little longer, then release."));
      return;
    }
    if (chunks.length === 0) {
      onError?.(new Error("No audio captured — check your microphone."));
      return;
    }
    onComplete(new Blob(chunks, { type: mimeType.split(";")[0] }));
  };

  recorder.onerror = () => {
    cleanup();
    onError?.(new Error("Recording failed"));
  };

  recorder.start(200);

  return {
    stop: () => {
      if (recorder.state !== "inactive") recorder.stop();
    },
    cancel: () => {
      if (recorder.state !== "inactive") recorder.stop();
      chunks.length = 0;
      cleanup();
    },
  };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) reject(new Error("Could not encode audio"));
      else resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read audio"));
    reader.readAsDataURL(blob);
  });
}
