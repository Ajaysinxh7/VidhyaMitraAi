import type React from 'react';

export interface WebcamMonitorProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: string;
  error: string | null;
  className?: string;
  initCameraLabel?: string;
  onInitCamera?: () => void | Promise<void>;
}

export default function WebcamMonitor({
  videoRef,
  status,
  error,
  className = '',
  initCameraLabel = 'Enable Camera',
  onInitCamera,
}: WebcamMonitorProps) {
  const isRequesting = status === 'requesting';
  const isReady = status === 'ready';
  const isRecording = status === 'recording';
  const isError = status === 'error';

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl aspect-video group ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {(isError || !isRecording) && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="text-center">
            {isError ? (
              <>
                <p className="text-sm text-rose-300 mb-3">{error || 'Recording error'}</p>
                {onInitCamera && (
                  <button
                    onClick={() => void onInitCamera()}
                    className="px-5 py-2.5 rounded-xl bg-red-500/20 text-red-300 text-sm font-medium border border-red-500/30 hover:bg-red-500/30 transition-colors"
                  >
                    {initCameraLabel}
                  </button>
                )}
              </>
            ) : isRequesting ? (
              <p className="text-sm text-slate-300">Requesting camera and microphone access...</p>
            ) : (
              <>
                <p className="text-sm text-slate-300 mb-3">
                  Camera preview is {isReady ? 'ready' : 'not started'}.
                </p>
                {onInitCamera && (
                  <button
                    onClick={() => void onInitCamera()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                  >
                    {initCameraLabel}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {isRecording && (
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 border border-red-500/40 backdrop-blur-md">
          <span className="text-xs font-semibold tracking-wide text-red-300 uppercase">Recording</span>
        </div>
      )}
    </div>
  );
}

