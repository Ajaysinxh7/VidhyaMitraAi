import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, Volume2, Sparkles } from 'lucide-react';

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

type PipelineState =
  | 'loading_resume'
  | 'generating_questions'
  | 'ready'
  | 'recording'
  | 'waiting_stop'
  | 'analyzing'
  | 'reporting'
  | 'reviewing'
  | 'error';

type InterviewQuestion = {
  id: string;
  text: string;
  category: string;
};

type AnswerWindowMs = {
  question_id: string;
  startMs: number | null;
  endMs: number | null;
};

type InterviewReport = {
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

function speakQuestion(text: string) {
  if (typeof window === 'undefined') return;
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
  const { parsedResume, setParsedResume } = useAppContext();
  const { user } = useAuth();

  const [state, setState] = useState<PipelineState>('loading_resume');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [answerWindows, setAnswerWindows] = useState<AnswerWindowMs[]>([]);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineSyncResponse | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);

  const [error, setError] = useState<string | null>(null);

  const isRecordingActive = state === 'recording';
  const userId = user?.id ?? null;

  const currentQuestion = questions[currentIdx];

  const canStartAnswer = useMemo(() => {
    if (!currentQuestion) return false;
    if (!isRecordingActive) return false;
    const w = answerWindows.find((x) => x.question_id === currentQuestion.id);
    return !!w && w.startMs === null;
  }, [answerWindows, currentQuestion, isRecordingActive]);

  const canStopAnswer = useMemo(() => {
    if (!currentQuestion) return false;
    if (!isRecordingActive) return false;
    const w = answerWindows.find((x) => x.question_id === currentQuestion.id);
    return !!w && w.startMs !== null && w.endMs === null;
  }, [answerWindows, currentQuestion, isRecordingActive]);

  const canGoNext = useMemo(() => {
    if (!currentQuestion) return false;
    const w = answerWindows.find((x) => x.question_id === currentQuestion.id);
    return !!w && w.startMs !== null && w.endMs !== null;
  }, [answerWindows, currentQuestion]);

  // Ref guard to prevent double-firing of question generation
  const isGeneratingRef = useRef(false);

  const generateQuestions = async (resumeData: ParsedResumeData, uid: string) => {
    // Prevent double invocation
    if (isGeneratingRef.current) {
      console.log('[InterviewEngine] Already generating, skipping duplicate call');
      return;
    }
    isGeneratingRef.current = true;

    console.log('[InterviewEngine] generateQuestions called. userId:', uid);
    setState('generating_questions');
    setError(null);

    try {
      console.log('[InterviewEngine] Calling /interview/questions...');
      const resp = await apiClient.post('/interview/questions', {
        user_id: uid,
        resume_data: resumeData,
        num_questions: 6,
        difficulty: 'intermediate',
      });

      console.log('[InterviewEngine] API success:', resp.data?.status);
      const data = resp.data as { session_id: string; questions: InterviewQuestion[] };
      setSessionId(data.session_id);
      setQuestions(data.questions);
      setCurrentIdx(0);
      setAnswerWindows(
        data.questions.map((q) => ({
          question_id: q.id,
          startMs: null,
          endMs: null,
        })),
      );
      setState('ready');
    } catch (e: any) {
      console.error('[InterviewEngine] API failed:', e?.response?.data || e?.message);
      setState('error');
      setError(e?.response?.data?.detail || e?.message || 'Failed to generate questions.');
    } finally {
      isGeneratingRef.current = false;
    }
  };

  // On mount: if parsedResume already exists in context (e.g. navigating back),
  // auto-start question generation.
  useEffect(() => {
    if (!userId) {
      // Auth not ready yet — wait for it
      return;
    }
    if (parsedResume && state === 'loading_resume') {
      console.log('[InterviewEngine] Mount/context: parsedResume found, auto-generating');
      generateQuestions(parsedResume, userId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedResume, userId]);

  useEffect(() => {
    if (!currentQuestion) return;
    // Text + TTS (demo-ready)
    speakQuestion(currentQuestion.text);
  }, [currentIdx, currentQuestion]);

  const onSessionRecordingComplete = async (result: RecordingResult) => {
    if (!sessionId || !userId) {
      setState('error');
      setError('Missing sessionId or userId.');
      return;
    }

    setState('analyzing');

    // Compute answer offsets from absolute ms.
    const videoStartMs = new Date(result.start_time).getTime();

    const windowsPayload = answerWindows.map((w) => {
      const start_offset_seconds =
        w.startMs !== null ? Math.max(0, (w.startMs - videoStartMs) / 1000) : 0;
      const end_offset_seconds =
        w.endMs !== null ? Math.max(0, (w.endMs - videoStartMs) / 1000) : start_offset_seconds;
      return {
        question_id: w.question_id,
        start_offset_seconds,
        end_offset_seconds,
      };
    });

    // Ensure all windows are non-empty (basic safety).
    const invalid = windowsPayload.some((w) => w.end_offset_seconds <= w.start_offset_seconds);
    if (invalid) {
      setState('error');
      setError('Some answers have invalid time ranges. Please re-record.');
      return;
    }

    try {
      // 1) Record/upload
      const recordForm = new FormData();
      recordForm.append('session_id', sessionId);
      recordForm.append('user_id', userId);
      recordForm.append('video_start_time', result.start_time);
      recordForm.append('answer_windows', JSON.stringify(windowsPayload));
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

      setState('reviewing');
    } catch (e: any) {
      setState('error');
      setError(e?.response?.data?.detail || e?.message || 'Interview pipeline failed.');
    }
  };

  const updateWindow = (questionId: string, patch: Partial<Pick<AnswerWindowMs, 'startMs' | 'endMs'>>) => {
    setAnswerWindows((prev) =>
      prev.map((w) => (w.question_id === questionId ? { ...w, ...patch } : w)),
    );
  };

  const resetAll = () => {
    setParsedResume(null);
    setState('loading_resume');
    setQuestions([]);
    setSessionId(null);
    setCurrentIdx(0);
    setAnswerWindows([]);
    setVideoUrl(null);
    setTimelineData(null);
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-full flex flex-col w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">AI Mock Interview Simulator</h1>
        <p className="text-indigo-200/60 max-w-2xl text-sm sm:text-base">
          Resume-aware questions, continuous recording, timestamped feedback.
        </p>
      </div>

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
                      setParsedResume(data);
                      setError(null);
                      if (userId) {
                        generateQuestions(data, userId);
                      }
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
                {(rec) => (
                  <>
                    <div className="flex-1 min-w-0">
                      <WebcamMonitor
                        videoRef={rec.videoRef}
                        status={rec.status}
                        error={rec.error}
                        initCameraLabel="Enable Camera"
                        onInitCamera={rec.initCamera}
                      />
                    </div>

                    <div className="w-full lg:w-96 flex flex-col bg-slate-800/30 border border-slate-700/50 rounded-2xl h-[520px] overflow-hidden">
                      <div className="p-5 border-b border-slate-700/50 bg-slate-900/40 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-400" />
                            Interview Flow
                          </h2>
                          <span className="text-xs text-slate-400">Q{currentIdx + 1}/{questions.length}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {rec.status === 'recording' ? 'Recording... mark your answer window.' : 'Start recording to begin.'}
                        </p>
                      </div>

                      <div className="p-5 flex-1 overflow-y-auto">
                        {!currentQuestion && (
                          <div className="text-slate-400 text-sm">No questions available.</div>
                        )}

                        {currentQuestion && (
                          <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/50">
                              <div className="text-xs uppercase tracking-wider text-indigo-300 font-semibold mb-2">
                                {currentQuestion.category.replace('_', ' ')}
                              </div>
                              <div className="text-sm text-slate-100 font-medium leading-relaxed">
                                {currentQuestion.text}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              {state === 'ready' && (
                                <button
                                  onClick={async () => {
                                    await rec.initCamera();
                                    setState('recording');
                                    rec.startRecording();
                                  }}
                                  disabled={rec.status !== 'ready' && rec.status !== 'idle'}
                                  className="col-span-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50"
                                >
                                  Start Interview Recording
                                </button>
                              )}

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

                              {canGoNext && currentIdx < questions.length - 1 && (
                                <button
                                  onClick={() => setCurrentIdx((i) => Math.min(i + 1, questions.length - 1))}
                                  className="col-span-2 px-4 py-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 font-semibold transition-colors"
                                >
                                  Next Question
                                </button>
                              )}

                              {canGoNext && currentIdx === questions.length - 1 && (
                                <button
                                  onClick={() => {
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
                              Tip: Keep answering until you click "Stop Answer" for each question.
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
                )}
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
                <p className="text-slate-400 text-sm">{state === 'analyzing' ? 'Speech + eye contact + timeline synchronization...' : 'AI scoring + actionable feedback...'}</p>
              </div>
            </motion.div>
          )}

          {state === 'reviewing' && videoUrl && timelineData && (
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
                videoUrl={videoUrl}
                timelineData={timelineData}
                perQuestionFeedback={report?.per_question_feedback}
                questions={questions}
                report={report}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

