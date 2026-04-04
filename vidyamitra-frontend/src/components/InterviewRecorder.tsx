import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  VideoOff,
  Mic,
  CircleDot,
  Square,
  RotateCcw,
  Download,
  AlertTriangle,
  Clock,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import {
  useMediaRecorder,
  type RecordingResult,
} from '../hooks/useMediaRecorder';

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
export interface InterviewRecorderProps {
  /** Called when a recording finishes with video/audio URLs and timestamp */
  onRecordingComplete?: (result: RecordingResult) => void;
  /** Extra CSS class names applied to the root wrapper */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function InterviewRecorder({
  onRecordingComplete,
  className = '',
}: InterviewRecorderProps) {
  const {
    status,
    error,
    duration,
    result,
    videoRef,
    initCamera,
    startRecording,
    stopRecording,
    reset,
  } = useMediaRecorder();

  // Fire callback when a result is produced
  useEffect(() => {
    if (result && onRecordingComplete) {
      onRecordingComplete(result);
    }
  }, [result, onRecordingComplete]);

  const isRecording = status === 'recording';
  const isReady = status === 'ready';
  const isStopped = status === 'stopped';
  const isIdle = status === 'idle';
  const isRequesting = status === 'requesting';
  const hasError = status === 'error';

  /* readable start-time for UI */
  const formattedStart = useMemo(() => {
    if (!result?.start_time) return '';
    return new Date(result.start_time).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [result?.start_time]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <div className={`w-full max-w-3xl mx-auto ${className}`}>
      {/* ---- Video viewport ---- */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl aspect-video">
        {/* Live / playback video element */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          autoPlay={!isStopped}
          muted={!isStopped}
        />

        {/* Idle overlay — camera off */}
        <AnimatePresence>
          {(isIdle || isRequesting || hasError) && (
            <motion.div
              key="idle-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm gap-4"
            >
              {hasError ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-red-300 text-sm text-center max-w-xs px-4">
                    {error}
                  </p>
                  <button
                    onClick={initCamera}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-red-500/20 text-red-300 text-sm font-medium border border-red-500/30 hover:bg-red-500/30 transition-colors"
                  >
                    Retry
                  </button>
                </>
              ) : isRequesting ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center animate-pulse">
                    <Camera className="w-8 h-8 text-primary-light" />
                  </div>
                  <p className="text-slate-400 text-sm">
                    Requesting camera &amp; microphone access…
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center border border-primary/20">
                    <VideoOff className="w-9 h-9 text-primary-light" />
                  </div>
                  <p className="text-slate-400 text-sm mt-1">
                    Camera is off
                  </p>
                  <button
                    onClick={initCamera}
                    id="init-camera-btn"
                    className="mt-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Enable Camera
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Recording HUD ---- */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              key="rec-badge"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-red-500/40"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
              <span className="text-xs font-semibold tracking-wide text-red-300 uppercase">
                Rec
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Timer */}
        <AnimatePresence>
          {(isRecording || isReady) && (
            <motion.div
              key="timer"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-slate-600/40"
            >
              <Clock className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-xs font-mono font-semibold text-slate-200">
                {formatDuration(duration)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom gradient for controls blending */}
        {!isIdle && !isRequesting && !hasError && (
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
        )}

        {/* Microphone level indicator (decorative) */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              key="mic-indicator"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-emerald-500/30"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex items-end gap-[2px] h-3">
                {[1, 2, 3, 4, 5].map((bar) => (
                  <motion.div
                    key={bar}
                    className="w-[3px] rounded-full bg-emerald-400"
                    animate={{
                      height: ['30%', `${30 + Math.random() * 70}%`, '30%'],
                    }}
                    transition={{
                      duration: 0.4 + Math.random() * 0.3,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      delay: bar * 0.08,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- Controls ---- */}
      <div className="mt-5 flex items-center justify-center gap-3">
        {/* Start / Stop toggle */}
        {isReady && (
          <motion.button
            id="start-recording-btn"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5 transition-all"
          >
            <CircleDot className="w-5 h-5" />
            Start Recording
          </motion.button>
        )}

        {isRecording && (
          <motion.button
            id="stop-recording-btn"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold border border-slate-600 hover:-translate-y-0.5 transition-all"
          >
            <Square className="w-4 h-4 fill-current" />
            Stop
          </motion.button>
        )}

        {isStopped && (
          <>
            <motion.button
              id="reset-recording-btn"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={reset}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              New Recording
            </motion.button>

            {result && (
              <motion.a
                id="download-recording-btn"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                href={result.video_url}
                download={`interview-${result.start_time}.webm`}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
              >
                <Download className="w-4 h-4" />
                Download
              </motion.a>
            )}
          </>
        )}
      </div>

      {/* ---- Result card ---- */}
      <AnimatePresence>
        {result && isStopped && (
          <motion.div
            key="result-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ delay: 0.1 }}
            className="mt-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-100">
                Recording Complete
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {/* Video blob */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/40">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-1">
                  Video
                </p>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary-light" />
                  <span className="text-slate-200 truncate text-xs font-mono">
                    {result.video_url.slice(-20)}
                  </span>
                </div>
              </div>

              {/* Audio blob */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/40">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-1">
                  Audio
                </p>
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-200 truncate text-xs font-mono">
                    {result.audio_url.slice(-20)}
                  </span>
                </div>
              </div>

              {/* Timestamp */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/40">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-medium mb-1">
                  Started At
                </p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-200 text-xs font-mono">
                    {formattedStart}
                  </span>
                </div>
              </div>
            </div>

            {/* Duration */}
            <p className="mt-3 text-xs text-slate-500 text-right">
              Duration: {formatDuration(duration)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
