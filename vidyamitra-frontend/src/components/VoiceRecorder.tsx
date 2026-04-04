import type React from 'react';
import { useEffect } from 'react';

import { useMediaRecorder, type RecordingResult, type UseMediaRecorderReturn } from '../hooks/useMediaRecorder';

export interface VoiceRecorderRenderProps extends UseMediaRecorderReturn {}

export interface VoiceRecorderProps {
  onRecordingComplete?: (result: RecordingResult) => void;
  children: (props: VoiceRecorderRenderProps) => React.ReactNode;
}

export default function VoiceRecorder({ onRecordingComplete, children }: VoiceRecorderProps) {
  const recorder = useMediaRecorder();

  useEffect(() => {
    if (recorder.result && onRecordingComplete) {
      onRecordingComplete(recorder.result);
    }
  }, [recorder.result, onRecordingComplete]);

  return <>{children(recorder)}</>;
}

