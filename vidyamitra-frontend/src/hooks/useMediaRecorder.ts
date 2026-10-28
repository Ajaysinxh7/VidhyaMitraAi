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
  /** The validated MediaStream (available once status === 'ready' or 'recording') */
  stream: MediaStream | null;
  initCamera: () => Promise<boolean>;
  startRecording: () => void;
  stopRecording: () => void;
  reset: () => void;
}

export function useMediaRecorder(): UseMediaRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Keep active stream attached to videoRef if element remounts
  useEffect(() => {
    if (stream && videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  });

  /**
   * Acquires a camera + microphone stream.
   * Camera is MANDATORY — no audio-only fallback.
   * Returns true if the stream was successfully acquired, false otherwise.
   */
  const initCamera = useCallback(async (): Promise<boolean> => {
    // Stop any existing stream first to avoid duplicate tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }

    setStatus('requesting');
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
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

      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {
          // play() can be rejected due to autoplay policy — not fatal for recording
        });
      }

      setStatus('ready');
      return true;
    } catch (err: unknown) {
      let message: string;
      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            message = 'Camera and microphone access denied. Please allow permissions and try again.';
            break;
          case 'NotFoundError':
            message = 'No camera or microphone found on this device.';
            break;
          case 'NotReadableError':
          case 'AbortError':
            message = 'Camera or microphone is already in use by another application.';
            break;
          case 'OverconstrainedError':
            message = 'Camera does not meet the required constraints.';
            break;
          default:
            message = `Media device error: ${err.message}`;
        }
      } else {
        message = 'Failed to access camera and microphone.';
      }
      setError(message);
      setStatus('error');
      return false;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    const liveStream = streamRef.current;
    const videoTracks = liveStream.getVideoTracks();
    const audioTracks = liveStream.getAudioTracks();

    // Both tracks are mandatory at recording time
    if (videoTracks.length === 0 || audioTracks.length === 0) {
      setError('Recording requires both camera and microphone.');
      setStatus('error');
      return;
    }

    // Reset chunks
    videoChunksRef.current = [];
    audioChunksRef.current = [];
    setResult(null);

    // Pick codec with fallback
    const videoMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

    const audioMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    // Video recorder (full stream — video + audio)
    const videoRecorder = new MediaRecorder(liveStream, {
      mimeType: videoMime,
      videoBitsPerSecond: 2_500_000,
    });
    videoRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };

    // Audio-only recorder (for separate audio track analysis)
    const audioOnlyStream = new MediaStream(audioTracks);
    const audioRecorder = new MediaRecorder(audioOnlyStream, {
      mimeType: audioMime,
      audioBitsPerSecond: 128_000,
    });
    audioRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    // Result is produced when the video recorder stops
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

    videoRecorderRef.current = videoRecorder;
    audioRecorderRef.current = audioRecorder;

    startTimeRef.current = new Date().toISOString();
    setDuration(0);

    videoRecorder.start(1000);
    audioRecorder.start(1000);

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
    const hasVideoRec = videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive';
    const hasAudioRec = audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive';

    if (hasVideoRec) {
      videoRecorderRef.current?.stop();
    }
    if (hasAudioRec) {
      audioRecorderRef.current?.stop();
    }

    if (!hasVideoRec && !hasAudioRec) {
      // Neither recorder active — emit safe blobs so downstream pipeline completes smoothly
      const emptyVideoBlob = new Blob([], { type: 'video/webm' });
      const emptyAudioBlob = new Blob([], { type: 'audio/webm' });
      setResult({
        video_url: URL.createObjectURL(emptyVideoBlob),
        audio_url: URL.createObjectURL(emptyAudioBlob),
        video_blob: emptyVideoBlob,
        audio_blob: emptyAudioBlob,
        start_time: startTimeRef.current || new Date().toISOString(),
      });
      setStatus('stopped');
    }
  }, []);

  const reset = useCallback(() => {
    // Revoke old blob URLs
    if (result) {
      URL.revokeObjectURL(result.video_url);
      URL.revokeObjectURL(result.audio_url);
    }

    // Stop and release camera tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
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
    stream,
    initCamera,
    startRecording,
    stopRecording,
    reset,
  };
}


