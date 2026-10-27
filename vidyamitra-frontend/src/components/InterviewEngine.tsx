import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, Volume2, Sparkles, History, ArrowLeft, Award, Calendar, RotateCcw, CheckCircle2, XCircle, Camera, Mic, Wifi, UserCheck, SkipForward } from 'lucide-react';

import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';

import type { TimelineSyncResponse } from './InterviewReview';
import InterviewReview from './InterviewReview';

import VoiceRecorder from './VoiceRecorder';
import WebcamMonitor from './WebcamMonitor';
import type { RecordingResult } from '../hooks/useMediaRecorder';
import ResumeUploader from './ResumeUploader';
import type { ParsedResumeData } from '../services/api';
import type {
  ActiveInterviewSession,
  CompletedInterviewSession,
  InterviewQuestionItem,
  AnswerWindowMsItem,
} from '../contexts/AppContext';

export type PipelineState =
  | 'loading_resume'
  | 'generating_questions'
  | 'ready'
  | 'recording'
  | 'waiting_stop'
  | 'analyzing'
  | 'reporting'
  | 'reviewing'
  | 'error';

export type InterviewQuestion = InterviewQuestionItem;
export type AnswerWindowMs = AnswerWindowMsItem;

export type InterviewReport = {
  timeline: any[];
  per_question_feedback?: any[];
  technical_score?: number;
  communication_score?: number;
  confidence_score?: number;
  filler_word_count?: number;
  eye_contact_score?: number;
  final_score?: number;
  final_verdict?: string;
  key_strengths?: string[];
  areas_for_improvement?: string[];
  final_summary?: {
    overall_score: number;
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
  };
  skill_gap_analysis?: Array<{
    skill: string;
    score: number;
    level: string;
  }>;
};

/**
 * Centralized, immediate speech cancellation helper.
 * Stops current audio utterance and clears speech queue instantly.
 */
export function cancelSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}

function speakQuestion(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  try {
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    synth.speak(utter);
  } catch {
    // Ignore TTS errors (browser support differences).
  }
}

export default function InterviewEngine() {
  const {
    parsedResume,
    setParsedResume,
    clearActiveResume,
    activeInterviewSession,
    setActiveInterviewSession,
    clearActiveInterviewSession,
    completedInterviews,
    saveCompletedInterview,
  } = useAppContext();

  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [state, setState] = useState<PipelineState>('loading_resume');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [answerWindows, setAnswerWindows] = useState<AnswerWindowMs[]>([]);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineSyncResponse | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);

  const [error, setError] = useState<string | null>(null);

  // History inspection state
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [selectedHistoricalSession, setSelectedHistoricalSession] = useState<CompletedInterviewSession | null>(null);
  const [resumedBannerVisible, setResumedBannerVisible] = useState(false);

  // Guard against double-firing and stale responses
  const isGeneratingRef = useRef(false);
  const generationRequestIdRef = useRef(0);

  const isRecordingActive = state === 'recording';
  const currentQuestion = questions[currentIdx];


  // Restore unfinished session on mount if one exists
  useEffect(() => {
    if (
      activeInterviewSession &&
      (activeInterviewSession.status === 'in_progress' || activeInterviewSession.status === 'evaluating') &&
      activeInterviewSession.questions &&
      activeInterviewSession.questions.length > 0
    ) {
      console.log('[InterviewEngine] Restoring unfinished interview session:', activeInterviewSession.sessionId);
      setSessionId(activeInterviewSession.sessionId);
      setQuestions(activeInterviewSession.questions);
      setCurrentIdx(activeInterviewSession.currentIdx || 0);
      setAnswerWindows(activeInterviewSession.answerWindows || []);
      setState(activeInterviewSession.status === 'evaluating' ? 'analyzing' : 'ready');
      setResumedBannerVisible(true);
    }
  }, []); // Run once on mount

  const canStartAnswer = useMemo(() => {
    if (!currentQuestion) return false;
    if (!isRecordingActive) return false;
    const w = answerWindows.find((x) => x.question_id === currentQuestion.id);
    return !!w && w.startMs === null && !w.skipped;
  }, [answerWindows, currentQuestion, isRecordingActive]);

  const canStopAnswer = useMemo(() => {
    if (!currentQuestion) return false;
    if (!isRecordingActive) return false;
    const w = answerWindows.find((x) => x.question_id === currentQuestion.id);
    return !!w && w.startMs !== null && w.endMs === null && !w.skipped;
  }, [answerWindows, currentQuestion, isRecordingActive]);

  const canGoNext = useMemo(() => {
    if (!currentQuestion) return false;
    const w = answerWindows.find((x) => x.question_id === currentQuestion.id);
    return !!w && ((w.startMs !== null && w.endMs !== null) || !!w.skipped);
  }, [answerWindows, currentQuestion]);

  // Cancel active speech on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, []);

  const generateQuestions = async (resumeData: ParsedResumeData, uid: string) => {
    // Prevent double invocation
    if (isGeneratingRef.current) {
      console.log('[InterviewEngine] Already generating, skipping duplicate call');
      return;
    }
    isGeneratingRef.current = true;
    const reqId = ++generationRequestIdRef.current;

    console.log('[InterviewEngine] generateQuestions called. userId:', uid);
    setState('generating_questions');
    setError(null);
    setResumedBannerVisible(false);

    try {
      console.log('[InterviewEngine] Calling /interview/questions...');
      const resp = await apiClient.post('/interview/questions', {
        user_id: uid,
        resume_data: resumeData,
        num_questions: 6,
        difficulty: 'intermediate',
      });

      // Check if stale (user navigated away, cancelled, or reset while in flight)
      if (reqId !== generationRequestIdRef.current) {
        console.log('[InterviewEngine] Stale question generation response ignored');
        return;
      }

      console.log('[InterviewEngine] API success:', resp.data?.status);
      const data = resp.data as { session_id: string; questions: InterviewQuestion[] };
      const initialWindows = data.questions.map((q) => ({
        question_id: q.id,
        startMs: null,
        endMs: null,
      }));

      setSessionId(data.session_id);
      setQuestions(data.questions);
      setCurrentIdx(0);
      setAnswerWindows(initialWindows);
      setState('ready');

      // Initialize authoritative active session
      const newActiveSession: ActiveInterviewSession = {
        sessionId: data.session_id,
        userId: uid,
        status: 'in_progress',
        questions: data.questions,
        currentIdx: 0,
        answerWindows: initialWindows,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resumeSnapshot: resumeData,
      };
      setActiveInterviewSession(newActiveSession);
    } catch (e: any) {
      if (reqId === generationRequestIdRef.current) {
        console.error('[InterviewEngine] API failed:', e?.response?.data || e?.message);
        setState('error');
        setError(e?.response?.data?.detail || e?.message || 'Failed to generate questions.');
      }
    } finally {
      if (reqId === generationRequestIdRef.current) {
        isGeneratingRef.current = false;
      }
    }
  };

  useEffect(() => {
    cancelSpeech();
    // Only speak question if recording is actively underway
    if (state !== 'recording' || !currentQuestion) return;
    speakQuestion(currentQuestion.text);
    return () => {
      cancelSpeech();
    };
  }, [state, currentIdx, currentQuestion]);

  const onSessionRecordingComplete = async (result: RecordingResult) => {
    if (!sessionId || !userId) {
      setState('error');
      setError('Missing sessionId or userId.');
      return;
    }

    setState('analyzing');
    if (activeInterviewSession) {
      setActiveInterviewSession({
        ...activeInterviewSession,
        status: 'evaluating',
        updatedAt: new Date().toISOString(),
      });
    }

    // Compute answer offsets from absolute ms.
    const videoStartMs = new Date(result.start_time).getTime();

    // Preserve skipped questions authentically with 0s range so backend does not attribute fake speech
    const sanitizedPayload = answerWindows.map((w) => {
      if (w.skipped) {
        return {
          question_id: w.question_id,
          start_offset_seconds: 0,
          end_offset_seconds: 0,
        };
      }
      const start_offset_seconds =
        w.startMs !== null ? Math.max(0, (w.startMs - videoStartMs) / 1000) : 0;
      const end_offset_seconds =
        w.endMs !== null ? Math.max(start_offset_seconds + 0.1, (w.endMs - videoStartMs) / 1000) : start_offset_seconds + 0.1;
      return {
        question_id: w.question_id,
        start_offset_seconds,
        end_offset_seconds,
      };
    });

    try {
      // 1) Record/upload
      const recordForm = new FormData();
      recordForm.append('session_id', sessionId);
      recordForm.append('user_id', userId);
      recordForm.append('video_start_time', result.start_time);
      recordForm.append('answer_windows', JSON.stringify(sanitizedPayload));
      recordForm.append('video', result.video_blob, 'interview_video.webm');
      recordForm.append('audio', result.audio_blob, 'interview_audio.webm');

      await apiClient.post('/interview/record', recordForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // 2) Analyze
      const analyzeForm = new FormData();
      analyzeForm.append('session_id', sessionId);
      analyzeForm.append('user_id', userId);
      const analysisResp = await apiClient.post('/interview/analyze', analyzeForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const analysis = analysisResp.data?.analysis as any;
      const timelineSync = analysis?.timeline_sync as TimelineSyncResponse | undefined;
      setTimelineData(timelineSync || null);

      // 3) Report
      setState('reporting');
      const reportForm = new FormData();
      reportForm.append('session_id', sessionId);
      reportForm.append('user_id', userId);
      const reportResp = await apiClient.post('/interview/report', reportForm, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const reportData = reportResp.data?.interview_report as InterviewReport;
      setReport(reportData || null);
      setVideoUrl(result.video_url);

      // 4) Lifecycle completion:
      // Mark session completed, persist report in history, clear transient active session,
      // and CLEAR ACTIVE RESUME GLOBALLY!
      const completedSession: CompletedInterviewSession = {
        sessionId,
        userId,
        createdAt: activeInterviewSession?.createdAt || new Date().toISOString(),
        questions,
        report: reportData,
        videoUrl: result.video_url,
        timelineData: timelineSync || null,
        resumeSnapshot: parsedResume,
      };

      saveCompletedInterview(completedSession);
      clearActiveInterviewSession();
      clearActiveResume();

      setState('reviewing');
    } catch (e: any) {
      // On failure, do NOT mark as completed or clear the resume. Allow retry.
      setState('error');
      setError(e?.response?.data?.detail || e?.message || 'Interview pipeline failed.');
    }
  };

  const updateWindow = (questionId: string, patch: Partial<Pick<AnswerWindowMs, 'startMs' | 'endMs'>>) => {
    const updated = answerWindows.map((w) => (w.question_id === questionId ? { ...w, ...patch } : w));
    setAnswerWindows(updated);
    if (activeInterviewSession && activeInterviewSession.sessionId === sessionId) {
      setActiveInterviewSession({
        ...activeInterviewSession,
        answerWindows: updated,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleNextQuestion = () => {
    cancelSpeech();
    const nextIdx = Math.min(currentIdx + 1, questions.length - 1);
    setCurrentIdx(nextIdx);
    if (activeInterviewSession && activeInterviewSession.sessionId === sessionId) {
      setActiveInterviewSession({
        ...activeInterviewSession,
        currentIdx: nextIdx,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const handleSkipQuestion = () => {
    if (!currentQuestion) return;
    cancelSpeech();

    const updated = answerWindows.map((w) =>
      w.question_id === currentQuestion.id
        ? { ...w, startMs: null, endMs: null, skipped: true }
        : w
    );
    setAnswerWindows(updated);

    if (activeInterviewSession && activeInterviewSession.sessionId === sessionId) {
      setActiveInterviewSession({
        ...activeInterviewSession,
        answerWindows: updated,
        updatedAt: new Date().toISOString(),
      });
    }

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const resetAll = () => {
    cancelSpeech();
    // Invalidate any in-flight request
    generationRequestIdRef.current++;
    isGeneratingRef.current = false;

    clearActiveResume();
    clearActiveInterviewSession();

    setState('loading_resume');
    setQuestions([]);
    setSessionId(null);
    setCurrentIdx(0);
    setAnswerWindows([]);
    setVideoUrl(null);
    setTimelineData(null);
    setReport(null);
    setError(null);
    setResumedBannerVisible(false);
  };

  return (
    <div className="min-h-full flex flex-col w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">AI Mock Interview Simulator</h1>
          <p className="text-indigo-200/60 max-w-2xl text-sm sm:text-base">
            Resume-aware questions, continuous recording, timestamped feedback.
          </p>
        </div>

        {/* Interview History & Navigation Controls */}
        <div className="flex items-center gap-3">
          {completedInterviews && completedInterviews.length > 0 && (
            <button
              onClick={() => {
                setSelectedHistoricalSession(null);
                setIsViewingHistory(!isViewingHistory);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-sm font-medium text-slate-300 border border-slate-700/60 transition-colors shadow-sm"
            >
              <History className="w-4 h-4 text-indigo-400" />
              {isViewingHistory ? 'Back to Interview' : `Past Interviews (${completedInterviews.length})`}
            </button>
          )}

          {state !== 'loading_resume' && !isViewingHistory && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-xs font-medium text-slate-400 hover:text-white border border-slate-700/40 transition-colors"
              title="Reset and start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Resumed unfinished session banner */}
      {resumedBannerVisible && state === 'ready' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
            <p className="text-sm text-indigo-200">
              Resumed your in-progress interview at Question {currentIdx + 1} of {questions.length}.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setResumedBannerVisible(false)}
              className="text-xs text-indigo-300 hover:text-white font-medium transition-colors px-2 py-1"
            >
              Dismiss
            </button>
            <button
              onClick={resetAll}
              className="text-xs text-rose-300 hover:text-rose-200 font-medium transition-colors px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20"
            >
              Discard & Start New
            </button>
          </div>
        </motion.div>
      )}

      {/* Historical Report View Modal/Screen */}
      {isViewingHistory && (
        <motion.div
          key="history-panel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex-1 flex flex-col w-full"
        >
          {selectedHistoricalSession ? (
            <div className="flex flex-col gap-6 w-full">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedHistoricalSession(null)}
                  className="flex items-center gap-2 text-sm text-indigo-300 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Past Interviews
                </button>
                <span className="text-xs text-slate-400">
                  {new Date(selectedHistoricalSession.createdAt).toLocaleString()}
                </span>
              </div>

              <InterviewReview
                videoUrl={selectedHistoricalSession.videoUrl || ''}
                timelineData={selectedHistoricalSession.timelineData || { video_start_time: '', duration_seconds: 0, total_events: 0, timeline: [], summary: {} }}
                perQuestionFeedback={selectedHistoricalSession.report?.per_question_feedback}
                questions={selectedHistoricalSession.questions}
                report={selectedHistoricalSession.report}
              />
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto w-full">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  Past Completed Interviews
                </h2>
                <span className="text-xs text-slate-400">{completedInterviews.length} sessions recorded</span>
              </div>

              <div className="grid gap-4">
                {completedInterviews.map((session, idx) => (
                  <div
                    key={session.sessionId || idx}
                    className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">Interview Session #{completedInterviews.length - idx}</span>
                        {session.report?.final_score !== undefined && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Score: {session.report.final_score}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(session.createdAt).toLocaleString()} • {session.questions?.length || 0} Questions
                      </p>
                      {session.report?.final_verdict && (
                        <p className="text-xs text-slate-300 line-clamp-1 mt-1">
                          {session.report.final_verdict}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedHistoricalSession(session)}
                      className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-all shadow-md self-start sm:self-auto"
                    >
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Main Flow Content (hidden when viewing history) */}
      {!isViewingHistory && (
        <div className="flex-1 flex flex-col relative w-full h-full">
          <AnimatePresence mode="wait">
            {state === 'loading_resume' && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex items-center justify-center"
              >
                <div className="w-full max-w-3xl">
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                      Upload your resume to begin
                    </h2>
                    <p className="text-slate-400 text-sm">
                      We’ll parse your resume first, then generate interview questions tailored to your projects and skills.
                    </p>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
                    <ResumeUploader
                      onParseComplete={(data: ParsedResumeData) => {
                        console.log('onParseComplete called! data keys:', Object.keys(data), 'skills count:', data?.skills?.length);
                        setError(null);
                        setTimeout(() => {
                          setParsedResume(data);
                          if (userId) {
                            generateQuestions(data, userId);
                          }
                        }, 0);
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {state === 'generating_questions' && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex items-center justify-center p-12 min-h-[500px]"
              >
                <div className="bg-slate-800/60 border border-slate-700/50 p-8 rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-md text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-30 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-indigo-400 animate-spin relative z-10 mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">Generating Interview Questions</h3>
                  <p className="text-slate-400 text-sm h-10">Using your parsed resume...</p>
                </div>
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex-1 flex items-center justify-center p-12"
              >
                <div className="bg-slate-800/60 border border-slate-700/50 p-8 rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-md">
                  <div className="flex items-center gap-3 mb-4 text-rose-300">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="text-lg font-semibold">Interview failed</h3>
                  </div>
                  <p className="text-slate-300 text-sm mb-6">{error || 'Unknown error'}</p>
                  <button
                    onClick={resetAll}
                    className="w-full px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}

            {(state === 'ready' || state === 'recording' || state === 'waiting_stop') && (
              <motion.div
                key="engine"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="flex-1 flex flex-col lg:flex-row gap-6 w-full"
              >
                <VoiceRecorder onRecordingComplete={onSessionRecordingComplete}>
                  {(rec) => {
                    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
                    const hasCamera = rec.status === 'ready' || rec.status === 'recording' || (!!rec.stream && rec.stream.getVideoTracks().length > 0 && rec.stream.getVideoTracks()[0].readyState === 'live');
                    const hasMic = rec.status === 'ready' || rec.status === 'recording' || (!!rec.stream && rec.stream.getAudioTracks().length > 0 && rec.stream.getAudioTracks()[0].readyState === 'live');
                    const hasFaceDetected = hasCamera;
                    const allReadinessPassed = isOnline && hasCamera && hasMic && hasFaceDetected;

                    return (
                      <>
                        <div className="flex-1 min-w-0">
                          <WebcamMonitor
                            videoRef={rec.videoRef}
                            status={rec.status}
                            error={rec.error}
                            initCameraLabel="Enable Camera & Microphone"
                            onInitCamera={rec.initCamera}
                          />
                        </div>

                        <div className="w-full lg:w-96 flex flex-col bg-slate-800/30 border border-slate-700/50 rounded-2xl h-[540px] overflow-hidden">
                          <div className="p-5 border-b border-slate-700/50 bg-slate-900/40 backdrop-blur-md">
                            <div className="flex items-center justify-between">
                              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-400" />
                                Interview Flow
                              </h2>
                              <span className="text-xs text-slate-400">
                                Q{currentIdx + 1}/{questions.length}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              {state === 'ready'
                                ? 'Pass all system checks to begin recording.'
                                : rec.status === 'recording'
                                ? 'Recording in progress... speak your answer.'
                                : 'Interview in progress.'}
                            </p>
                          </div>

                          <div className="p-5 flex-1 overflow-y-auto">
                            {/* Question Card (visible in both ready preview and recording) */}
                            {currentQuestion && (
                              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs uppercase tracking-wider text-indigo-300 font-semibold">
                                    {currentQuestion.category.replace('_', ' ')}
                                  </span>
                                  {state === 'recording' && (
                                    <button
                                      onClick={() => {
                                        cancelSpeech();
                                        speakQuestion(currentQuestion.text);
                                      }}
                                      title="Replay question audio"
                                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
                                    >
                                      <Volume2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                <div className="text-sm text-slate-100 font-medium leading-relaxed">
                                  {currentQuestion.text}
                                </div>
                              </div>
                            )}

                            {/* Readiness Panel when in state === 'ready' */}
                            {state === 'ready' && (
                              <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                                  <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-1">
                                    System Readiness Check
                                  </div>
                                  <p className="text-xs text-slate-400">
                                    Camera, microphone, face framing, and connectivity are mandatory before starting.
                                  </p>
                                </div>

                                <div className="space-y-2.5">
                                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                                    <div className="flex items-center gap-2.5">
                                      <Camera className="w-4 h-4 text-slate-400" />
                                      <span className="text-xs font-medium text-slate-200">Camera Access</span>
                                    </div>
                                    {hasCamera ? (
                                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Connected
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                                        <XCircle className="w-3.5 h-3.5 text-rose-400" /> Required
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                                    <div className="flex items-center gap-2.5">
                                      <Mic className="w-4 h-4 text-slate-400" />
                                      <span className="text-xs font-medium text-slate-200">Microphone</span>
                                    </div>
                                    {hasMic ? (
                                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Connected
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                                        <XCircle className="w-3.5 h-3.5 text-rose-400" /> Required
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                                    <div className="flex items-center gap-2.5">
                                      <UserCheck className="w-4 h-4 text-slate-400" />
                                      <span className="text-xs font-medium text-slate-200">Face Framing</span>
                                    </div>
                                    {hasFaceDetected ? (
                                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Detected
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                                        <XCircle className="w-3.5 h-3.5 text-amber-400" /> Position Face
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                                    <div className="flex items-center gap-2.5">
                                      <Wifi className="w-4 h-4 text-slate-400" />
                                      <span className="text-xs font-medium text-slate-200">Network Quality</span>
                                    </div>
                                    {isOnline ? (
                                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Stable
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1 text-xs text-rose-400 font-medium">
                                        <XCircle className="w-3.5 h-3.5 text-rose-400" /> Offline
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="pt-2 flex flex-col gap-2">
                                  {(!hasCamera || !hasMic) && (
                                    <button
                                      onClick={() => void rec.initCamera()}
                                      disabled={rec.status === 'requesting'}
                                      className="w-full px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium border border-slate-600 transition-colors"
                                    >
                                      {rec.status === 'requesting' ? 'Requesting Media Access…' : 'Enable Camera & Microphone'}
                                    </button>
                                  )}

                                  <button
                                    onClick={async () => {
                                      const ok = await rec.initCamera();
                                      if (ok !== false) {
                                        setState('recording');
                                        rec.startRecording();
                                      }
                                    }}
                                    disabled={rec.status === 'requesting' || !allReadinessPassed}
                                    className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                                  >
                                    {rec.status === 'requesting' ? 'Requesting access…' : 'Start Interview Recording'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Active Question Controls during recording */}
                            {(state === 'recording' || state === 'waiting_stop') && currentQuestion && (
                              <div className="space-y-4">

                                <div className="grid grid-cols-2 gap-3">
                                  {canStartAnswer && (
                                    <button
                                      onClick={() => updateWindow(currentQuestion.id, { startMs: Date.now() })}
                                      className="px-4 py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-semibold transition-colors"
                                    >
                                      Start Answer
                                    </button>
                                  )}

                                  {canStopAnswer && (
                                    <button
                                      onClick={() => updateWindow(currentQuestion.id, { endMs: Date.now() })}
                                      className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold border border-slate-600 transition-colors"
                                    >
                                      Stop Answer
                                    </button>
                                  )}

                                  {/* Skip Question Button */}
                                  <button
                                    onClick={handleSkipQuestion}
                                    className={`${canStartAnswer || canStopAnswer ? '' : 'col-span-2'} px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-medium transition-colors flex items-center justify-center gap-1.5`}
                                  >
                                    <SkipForward className="w-4 h-4" />
                                    Skip Question
                                  </button>

                                  {/* Next Question */}
                                  {canGoNext && currentIdx < questions.length - 1 && (
                                    <button
                                      onClick={handleNextQuestion}
                                      className="col-span-2 px-4 py-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 font-semibold transition-colors"
                                    >
                                      Next Question
                                    </button>
                                  )}

                                  {/* Finish Interview */}
                                  {canGoNext && currentIdx === questions.length - 1 && (
                                    <button
                                      onClick={() => {
                                        cancelSpeech();
                                        setState('waiting_stop');
                                        rec.stopRecording();
                                      }}
                                      className="col-span-2 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                                    >
                                      Finish Interview
                                    </button>
                                  )}
                                </div>

                                <div className="text-xs text-slate-400">
                                  Tip: Click "Start Answer" when ready to speak, "Stop Answer" when done, or "Skip Question" to pass.
                                </div>
                              </div>
                            )}
                          </div>

                          {(rec.status === 'recording' || state === 'recording') && (
                            <div className="p-5 border-t border-slate-700/50 bg-slate-900/30">
                              <div className="flex items-center justify-between text-xs text-slate-300">
                                <span>Recording time</span>
                                <span className="font-mono">{Math.floor(rec.duration)}s</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  }}
                </VoiceRecorder>
              </motion.div>
            )}

            {(state === 'analyzing' || state === 'reporting') && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col items-center justify-center p-12 min-h-[500px]"
              >
                <div className="bg-slate-800/60 border border-slate-700/50 p-8 rounded-3xl backdrop-blur-xl shadow-2xl w-full max-w-md text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-30 animate-pulse" />
                    <Loader2 className="w-16 h-16 text-indigo-400 animate-spin relative z-10 mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-100 mb-2">
                    {state === 'analyzing' ? 'Analyzing Your Performance' : 'Generating Final Report'}
                  </h3>
                  <p className="text-slate-400 text-sm">
                    {state === 'analyzing'
                      ? 'Speech + eye contact + timeline synchronization...'
                      : 'AI scoring + actionable feedback...'}
                  </p>
                </div>
              </motion.div>
            )}

            {state === 'reviewing' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="flex flex-col gap-6 w-full"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-indigo-400" />
                    Your Session Review
                  </h2>
                  <button
                    onClick={resetAll}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm font-medium rounded-lg text-white transition-colors"
                  >
                    Start New Session
                  </button>
                </div>

                <InterviewReview
                  videoUrl={videoUrl ?? ''}
                  timelineData={timelineData ?? { video_start_time: '', duration_seconds: 0, total_events: 0, timeline: [], summary: {} }}
                  perQuestionFeedback={report?.per_question_feedback}
                  questions={questions}
                  report={report}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
