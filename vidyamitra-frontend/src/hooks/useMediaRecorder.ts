import { useState, useRef, useCallback, useEffect } from 'react';

export interface RecordingResult {
  video_url: string;
  audio_url: string;
  video_blob: Blob;
  audio_blob: Blob;
  start_time: string;
}

export type RecorderStatus =
  | 'idle'
  | 'requesting'
  | 'ready'
  | 'recording'
  | 'stopped'
  | 'error';

export interface UseMediaRecorderReturn {
  status: RecorderStatus;
  error: string | null;
  duration: number;
  result: RecordingResult | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  initCamera: () => Promise<void>;
  startRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
}

export function useMediaRecorder(): UseMediaRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [result, setResult] = useState<RecordingResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      // Release camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const initCamera = useCallback(async () => {
    setStatus('requesting');
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Prevent echo
        await videoRef.current.play();
      }

      setStatus('ready');
    } catch (err: unknown) {
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera and microphone permissions are required to record.'
          : err instanceof DOMException && err.name === 'NotFoundError'
            ? 'No camera or microphone found on this device.'
            : 'Failed to access camera and microphone.';
      setError(message);
      setStatus('error');
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    const stream = streamRef.current;

    // Reset chunks
    videoChunksRef.current = [];
    audioChunksRef.current = [];
    setResult(null);

    // Pick codecs with fallback
    const videoMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

    const audioMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    // --- Video recorder (full stream: video + audio) ---
    const videoRecorder = new MediaRecorder(stream, {
      mimeType: videoMime,
      videoBitsPerSecond: 2_500_000,
    });

    videoRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };

    // --- Audio-only recorder ---
    const audioTracks = stream.getAudioTracks();
    const audioOnlyStream = new MediaStream(audioTracks);
    const audioRecorder = new MediaRecorder(audioOnlyStream, {
      mimeType: audioMime,
      audioBitsPerSecond: 128_000,
    });

    audioRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    // Wire up "stopped" handler on the video recorder (the slower one)
    videoRecorder.onstop = () => {
      const videoBlob = new Blob(videoChunksRef.current, { type: videoMime });
      const audioBlob = new Blob(audioChunksRef.current, { type: audioMime });

      const videoUrl = URL.createObjectURL(videoBlob);
      const audioUrl = URL.createObjectURL(audioBlob);

      setResult({
        video_url: videoUrl,
        audio_url: audioUrl,
        video_blob: videoBlob,
        audio_blob: audioBlob,
        start_time: startTimeRef.current,
      });

      setStatus('stopped');
    };

    // Start both
    videoRecorderRef.current = videoRecorder;
    audioRecorderRef.current = audioRecorder;

    startTimeRef.current = new Date().toISOString();
    setDuration(0);

    videoRecorder.start(1000); // collect data every second
    audioRecorder.start(1000);

    // Duration timer
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    setStatus('recording');
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    videoRecorderRef.current?.stop();
    audioRecorderRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    // Revoke old URLs before creating new ones
    if (result) {
      URL.revokeObjectURL(result.video_url);
      URL.revokeObjectURL(result.audio_url);
    }

    // Stop camera tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    videoChunksRef.current = [];
    audioChunksRef.current = [];
    setResult(null);
    setDuration(0);
    setError(null);
    setStatus('idle');
  }, [result]);

  return {
    status,
    error,
    duration,
    result,
    videoRef,
    initCamera,
    startRecording,
    stopRecording,
    reset,
  };
}
