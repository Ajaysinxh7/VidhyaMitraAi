import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play, Pause, Volume2, VolumeX, EyeOff, Eye,
  MessageSquareWarning, UserMinus, Info, Clock, Sparkles,
  Target, FileText, ChevronDown, ChevronUp, TrendingUp,
  Award, AlertCircle, Zap, BarChart3, CheckCircle2,
  SkipForward, SkipBack
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface TimelineEventItem {
  timestamp: number;
  event: string;
  label: string;
  source?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface TimelineSyncResponse {
  video_start_time: string;
  duration_seconds: number;
  total_events: number;
  timeline: TimelineEventItem[];
  summary: Record<string, number>;
}

export interface PerQuestionScores {
  technical: number;
  communication: number;
  confidence: number;
}

export interface PerQuestionFeedbackItem {
  question_id: string;
  score: number;
  confidence: number;
  scores?: PerQuestionScores;
  feedback: string;
  improvements?: string[];
  better_response?: string;
  ideal_answer?: string;
  transcript_excerpt?: string;
  answer_start_offset_seconds?: number;
  answer_end_offset_seconds?: number;
  filler_word_count?: number;
  eye_contact_ratio?: number;
}

export interface SkillGapItem {
  skill: string;
  score: number;
  level: string;
}

export interface FinalSummary {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
}

export interface InterviewReport {
  technical_score?: number;
  communication_score?: number;
  confidence_score?: number;
  filler_word_count?: number;
  eye_contact_score?: number;
  final_score?: number;
  final_verdict?: string;
  key_strengths?: string[];
  areas_for_improvement?: string[];
  final_summary?: FinalSummary;
  skill_gap_analysis?: SkillGapItem[];
  per_question_feedback?: PerQuestionFeedbackItem[];
  timeline?: any[];
}

export interface InterviewReviewProps {
  videoUrl: string;
  timelineData: TimelineSyncResponse;
  className?: string;
  perQuestionFeedback?: PerQuestionFeedbackItem[];
  questions?: Array<{ id: string; text: string; category?: string }>;
  report?: InterviewReport | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || Number.isNaN(seconds) || seconds < 0) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-rose-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-400';
  if (score >= 50) return 'bg-amber-400';
  return 'bg-rose-400';
}

function getScoreBorderColor(score: number): string {
  if (score >= 70) return 'border-emerald-500/30';
  if (score >= 50) return 'border-amber-500/30';
  return 'border-rose-500/30';
}



function getScoreLabel(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Average';
  if (score >= 30) return 'Needs Work';
  return 'Weak';
}

function getEventVisuals(eventItem: TimelineEventItem | string) {
  const eventType = typeof eventItem === 'string' ? eventItem : eventItem.event;
  const label = typeof eventItem === 'string' ? '' : eventItem.label || '';

  if (eventType === 'filler_word') {
    return { icon: <MessageSquareWarning className="w-4 h-4 text-amber-400" />, color: 'bg-amber-400' };
  }
  if (eventType === 'eye_contact') {
    if (label.includes('maintained')) {
      return { icon: <Eye className="w-4 h-4 text-emerald-400" />, color: 'bg-emerald-400' };
    }
    return { icon: <EyeOff className="w-4 h-4 text-rose-400" />, color: 'bg-rose-400' };
  }
  if (eventType === 'posture') {
    return { icon: <UserMinus className="w-4 h-4 text-purple-400" />, color: 'bg-purple-400' };
  }
  return { icon: <Info className="w-4 h-4 text-blue-400" />, color: 'bg-blue-400' };
}

/* ------------------------------------------------------------------ */
/*  Score Ring Component                                                */
/* ------------------------------------------------------------------ */
function ScoreRing({ score, size = 120, strokeWidth = 8, label }: {
  score: number; size?: number; strokeWidth?: number; label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(148,163,184,0.1)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold text-slate-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">/100</span>
        </div>
      </div>
      {label && <span className="text-xs text-slate-400 font-medium">{label}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Score Bar Component                                                 */
/* ------------------------------------------------------------------ */
function ScoreBar({ label, score, icon }: { label: string; score: number; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-medium text-slate-300">{label}</span>
        </div>
        <span className={`text-xs font-bold ${getScoreColor(score)}`}>{score}/100</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${getScoreBgColor(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function InterviewReview({
  videoUrl,
  timelineData,
  className = '',
  perQuestionFeedback,
  questions,
  report,
}: InterviewReviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(() => {
    const d = timelineData.duration_seconds;
    return Number.isFinite(d) && d > 0 ? d : 0;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isDurationReady, setIsDurationReady] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const segmentEndRef = useRef<number | null>(null);

  // Merge report data
  const finalScore = report?.final_score ?? 0;
  const techScore = report?.technical_score ?? 0;
  const commScore = report?.communication_score ?? 0;
  const confScore = report?.confidence_score ?? 0;
  const eyeScore = report?.eye_contact_score ?? 0;
  const fillerCount = report?.filler_word_count ?? 0;
  const finalVerdict = report?.final_verdict ?? '';
  const finalSummary = report?.final_summary;
  const skillGaps = report?.skill_gap_analysis ?? [];
  const feedbackItems = perQuestionFeedback ?? report?.per_question_feedback ?? [];

  // Video handlers
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const d = videoRef.current.duration;
      if (Number.isFinite(d) && d > 0) {
        setDuration(d);
        setIsDurationReady(true);
      } else {
        // Fallback to timeline data
        const fallback = timelineData.duration_seconds;
        if (Number.isFinite(fallback) && fallback > 0) {
          setDuration(fallback);
          setIsDurationReady(true);
        }
      }
    }
  }, [timelineData.duration_seconds]);

  // Also listen for durationchange event (some browsers fire this later for blob URLs)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onDurChange = () => {
      const d = v.duration;
      if (Number.isFinite(d) && d > 0) {
        setDuration(d);
        setIsDurationReady(true);
      }
    };
    v.addEventListener('durationchange', onDurChange);
    // Also check immediately in case already loaded
    onDurChange();
    return () => v.removeEventListener('durationchange', onDurChange);
  }, [videoUrl]);

  const skipForward = useCallback(() => {
    if (!videoRef.current) return;
    const newTime = Math.min(videoRef.current.currentTime + 10, duration);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const skipBackward = useCallback(() => {
    if (!videoRef.current) return;
    const newTime = Math.max(videoRef.current.currentTime - 10, 0);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) { videoRef.current.pause(); }
    else { videoRef.current.play(); }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const seekTo = useCallback((time: number) => {
    if (!videoRef.current) return;
    // Fix #4: Check readyState before seeking
    if (videoRef.current.readyState < 2) {
      // Video not loaded yet — queue a seek after it loads
      const onCanPlay = () => {
        if (videoRef.current) {
          videoRef.current.currentTime = Math.max(0, time);
          videoRef.current.play();
          setIsPlaying(true);
        }
        videoRef.current?.removeEventListener('canplay', onCanPlay);
      };
      videoRef.current.addEventListener('canplay', onCanPlay);
      videoRef.current.load();
      return;
    }
    videoRef.current.currentTime = Math.max(0, time);
    setCurrentTime(time);
    if (!isPlaying) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const playSegment = useCallback((start: number, end: number) => {
    if (!videoRef.current) return;
    const safeStart = Math.max(0, start);
    const safeEnd = Math.max(safeStart, end);
    segmentEndRef.current = safeEnd;
    if (videoRef.current.readyState >= 2) {
      videoRef.current.currentTime = safeStart;
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (segmentEndRef.current == null) return;
      if (v.currentTime >= segmentEndRef.current) {
        segmentEndRef.current = null;
        v.pause();
        setIsPlaying(false);
      }
    };
    v.addEventListener('timeupdate', onTime);
    return () => v.removeEventListener('timeupdate', onTime);
  }, []);

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seekTo(pos * duration);
  }, [seekTo, duration]);

  const toggleCard = useCallback((qid: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid); else next.add(qid);
      return next;
    });
  }, []);

  // Question text lookup
  const questionTextById = useMemo(() => {
    const map = new Map<string, { text: string; category?: string }>();
    if (questions) {
      for (const q of questions) map.set(q.id, q);
    }
    return map;
  }, [questions]);

  // Build answer regions for the scrubber (Q1, Q2, ... markers)
  const answerRegions = useMemo(() => {
    return feedbackItems.map((item, idx) => ({
      qIndex: idx + 1,
      qid: item.question_id,
      start: item.answer_start_offset_seconds ?? 0,
      end: item.answer_end_offset_seconds ?? 0,
      score: item.score ?? 0,
    }));
  }, [feedbackItems]);

  // Safe duration for percentage calculations (avoid division by zero / Infinity)
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 1;

  return (
    <div className={`flex flex-col gap-8 w-full max-w-5xl mx-auto ${className}`}>

      {/* ================================================================ */}
      {/*  SECTION 1: Video Player                                         */}
      {/* ================================================================ */}
      <section className="w-full">
        <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl">
          {/* Video element */}
          <div className="relative aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
            />
            {/* Center play button overlay (when paused) */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
              >
                <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Play className="w-7 h-7 text-white fill-current ml-1" />
                </div>
              </button>
            )}
          </div>

          {/* Controls bar — always visible */}
          <div className="bg-slate-900/95 backdrop-blur-md px-4 py-3 border-t border-slate-700/50">

            {/* Timeline scrubber with answer regions */}
            <div className="mb-3">
              <div
                className="w-full h-3 bg-slate-800 rounded-full cursor-pointer relative group/scrubber"
                onClick={handleTimelineClick}
              >
                {/* Answer region highlights */}
                {answerRegions.map((region) => {
                  const startPct = (region.start / safeDuration) * 100;
                  const widthPct = Math.max(0.5, ((region.end - region.start) / safeDuration) * 100);
                  const regionColor = region.score >= 70
                    ? 'bg-emerald-500/25 border-emerald-500/40'
                    : region.score >= 50
                    ? 'bg-amber-500/25 border-amber-500/40'
                    : 'bg-rose-500/25 border-rose-500/40';
                  return (
                    <div
                      key={`region-${region.qid}`}
                      className={`absolute top-0 h-full rounded-full ${regionColor} border pointer-events-none`}
                      style={{
                        left: `${Math.max(0, Math.min(100, startPct))}%`,
                        width: `${Math.min(widthPct, 100 - startPct)}%`,
                      }}
                    />
                  );
                })}

                {/* Progress fill */}
                <div
                  className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full pointer-events-none z-10"
                  style={{ width: `${(currentTime / safeDuration) * 100}%` }}
                />

                {/* Playhead dot */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-400 border-2 border-white shadow-lg z-20 pointer-events-none -ml-2 transition-[left] duration-75"
                  style={{ left: `${(currentTime / safeDuration) * 100}%` }}
                />

                {/* Answer start/end markers with Q labels */}
                {answerRegions.map((region) => {
                  const startPct = (region.start / safeDuration) * 100;
                  const endPct = (region.end / safeDuration) * 100;
                  const labelColor = region.score >= 70
                    ? 'bg-emerald-500 text-white'
                    : region.score >= 50
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-500 text-white';
                  return (
                    <div key={`qmarker-${region.qid}`}>
                      {/* Start marker with Q label */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); seekTo(region.start); }}
                        className="absolute z-30 flex flex-col items-center group/marker"
                        style={{ left: `${Math.max(0, Math.min(98, startPct))}%`, top: '-22px' }}
                        title={`Q${region.qIndex} Start — ${formatTime(region.start)}`}
                      >
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${labelColor} shadow-sm whitespace-nowrap leading-none`}>
                          Q{region.qIndex}
                        </span>
                        <div className="w-0.5 h-2 bg-slate-400/50 mt-0.5" />
                      </button>
                      {/* End marker (thin line) */}
                      <div
                        className="absolute z-20 w-0.5 h-full bg-slate-500/40 top-0 pointer-events-none"
                        style={{ left: `${Math.max(0, Math.min(100, endPct))}%` }}
                        title={`Q${region.qIndex} End — ${formatTime(region.end)}`}
                      />
                    </div>
                  );
                })}

                {/* Timeline event markers (filler words, eye contact, etc.) */}
                {timelineData.timeline.map((event, idx) => {
                  const posPercent = (event.timestamp / safeDuration) * 100;
                  const { color: markerColor } = getEventVisuals(event);
                  return (
                    <div
                      key={`marker-${idx}`}
                      className={`absolute bottom-0 w-1 h-1.5 rounded-full ${markerColor} z-10 opacity-50 pointer-events-none`}
                      style={{ left: `${Math.max(0, Math.min(100, posPercent))}%` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Playback controls row */}
            <div className="flex items-center justify-between text-slate-200">
              <div className="flex items-center gap-2">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>

                {/* Skip back 10s */}
                <button
                  onClick={skipBackward}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  title="Back 10s"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Skip forward 10s */}
                <button
                  onClick={skipForward}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  title="Forward 10s"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Time display */}
                <div className="text-sm font-mono tracking-wider ml-2">
                  {formatTime(currentTime)}
                  <span className="text-slate-500 mx-1">/</span>
                  {isDurationReady ? formatTime(duration) : <span className="text-slate-500">--:--</span>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Answer count badge */}
                {answerRegions.length > 0 && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-medium">
                    {answerRegions.length} answers
                  </span>
                )}

                {/* Mute */}
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 2: Overall Score Hero                                    */}
      {/* ================================================================ */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Main score ring */}
            <div className="flex flex-col items-center gap-3">
              <ScoreRing score={finalScore} size={140} strokeWidth={10} />
              <div className={`text-sm font-bold ${getScoreColor(finalScore)}`}>
                {getScoreLabel(finalScore)}
              </div>
            </div>

            {/* Sub-scores grid */}
            <div className="flex-1 w-full grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl bg-slate-900/40 border ${getScoreBorderColor(techScore)} flex flex-col items-center gap-2`}>
                <Zap className={`w-5 h-5 ${getScoreColor(techScore)}`} />
                <span className={`text-2xl font-bold ${getScoreColor(techScore)}`}>{techScore}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Technical</span>
              </div>
              <div className={`p-4 rounded-xl bg-slate-900/40 border ${getScoreBorderColor(commScore)} flex flex-col items-center gap-2`}>
                <MessageSquareWarning className={`w-5 h-5 ${getScoreColor(commScore)}`} />
                <span className={`text-2xl font-bold ${getScoreColor(commScore)}`}>{commScore}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Communication</span>
              </div>
              <div className={`p-4 rounded-xl bg-slate-900/40 border ${getScoreBorderColor(confScore)} flex flex-col items-center gap-2`}>
                <Award className={`w-5 h-5 ${getScoreColor(confScore)}`} />
                <span className={`text-2xl font-bold ${getScoreColor(confScore)}`}>{confScore}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Confidence</span>
              </div>
              <div className={`p-4 rounded-xl bg-slate-900/40 border ${getScoreBorderColor(eyeScore)} flex flex-col items-center gap-2`}>
                <Eye className={`w-5 h-5 ${getScoreColor(eyeScore)}`} />
                <span className={`text-2xl font-bold ${getScoreColor(eyeScore)}`}>{eyeScore}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Eye Contact</span>
              </div>
            </div>
          </div>

          {/* Verdict */}
          {finalVerdict && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20"
            >
              <p className="text-sm text-slate-200 leading-relaxed italic">"{finalVerdict}"</p>
            </motion.div>
          )}

          {/* Quick stats row */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="px-3 py-1.5 rounded-full bg-slate-900/40 border border-slate-700/50 flex items-center gap-1.5">
              <MessageSquareWarning className="w-3.5 h-3.5 text-amber-400" />
              {fillerCount} filler words
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-900/40 border border-slate-700/50 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {formatTime(duration)} duration
            </span>
            <span className="px-3 py-1.5 rounded-full bg-slate-900/40 border border-slate-700/50 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              {feedbackItems.length} questions
            </span>
          </div>
        </div>
      </motion.section>

      {/* ================================================================ */}
      {/*  SECTION 3: Answer-by-Answer Analysis                            */}
      {/* ================================================================ */}
      <section className="w-full">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-slate-100">Answer-by-Answer Analysis</h3>
        </div>

        <div className="space-y-3">
          {feedbackItems.map((item, idx) => {
            const qid = item.question_id;
            const q = questionTextById.get(qid);
            const isExpanded = expandedCards.has(qid);
            const startTs = item.answer_start_offset_seconds ?? 0;
            const endTs = item.answer_end_offset_seconds ?? startTs;
            const scores = item.scores ?? { technical: 0, communication: 0, confidence: 0 };
            const cardScore = item.score ?? Math.round((scores.technical + scores.communication + scores.confidence) / 3);

            return (
              <motion.div
                key={`${qid}-${idx}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  cardScore >= 70
                    ? 'border-emerald-500/20 bg-slate-800/30'
                    : cardScore >= 50
                    ? 'border-amber-500/20 bg-slate-800/30'
                    : 'border-rose-500/20 bg-slate-800/30'
                }`}
              >
                {/* Card header (always visible) */}
                <button
                  type="button"
                  onClick={() => toggleCard(qid)}
                  className="w-full text-left p-5 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold">
                          Q{idx + 1} — {q?.category?.replace('_', ' ') ?? 'question'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); seekTo(startTs); }}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700/50 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/30 transition-colors font-mono"
                        >
                          ⏱ {formatTime(startTs)}
                        </button>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                        {q?.text ?? qid}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Score badge */}
                      <div className={`flex flex-col items-center px-3 py-1.5 rounded-xl ${
                        cardScore >= 70 ? 'bg-emerald-500/10' : cardScore >= 50 ? 'bg-amber-500/10' : 'bg-rose-500/10'
                      }`}>
                        <span className={`text-lg font-bold ${getScoreColor(cardScore)}`}>{cardScore}</span>
                        <span className="text-[9px] text-slate-500">{getScoreLabel(cardScore)}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {/* Compact badge row */}
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MessageSquareWarning className="w-3 h-3 text-amber-400" />
                      {item.filler_word_count ?? 0} fillers
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-emerald-400" />
                      {Math.round((item.eye_contact_ratio ?? 0) * 100)}% eye contact
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {formatTime(startTs)} – {formatTime(endTs)}
                    </span>
                  </div>
                </button>

                {/* Expanded content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-4 border-t border-slate-700/30 pt-4">

                        {/* 3-axis score bars */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <ScoreBar label="Technical" score={scores.technical} icon={<Zap className="w-3 h-3 text-indigo-400" />} />
                          <ScoreBar label="Communication" score={scores.communication} icon={<MessageSquareWarning className="w-3 h-3 text-cyan-400" />} />
                          <ScoreBar label="Confidence" score={scores.confidence} icon={<Award className="w-3 h-3 text-amber-400" />} />
                        </div>

                        {/* User's transcript */}
                        {item.transcript_excerpt && (
                          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/40">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2">
                              <FileText className="w-4 h-4 text-purple-300" />
                              Your Answer
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {item.transcript_excerpt}
                            </p>
                          </div>
                        )}

                        {/* AI Feedback */}
                        {item.feedback && (
                          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/40">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2">
                              <AlertCircle className="w-4 h-4 text-cyan-300" />
                              AI Feedback
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{item.feedback}</p>
                          </div>
                        )}

                        {/* Better response */}
                        {item.better_response && (
                          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200 mb-2">
                              <Target className="w-4 h-4 text-emerald-300" />
                              Improved Answer
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                              {item.better_response}
                            </p>
                          </div>
                        )}

                        {/* Ideal answer */}
                        {item.ideal_answer && (
                          <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200 mb-2">
                              <Sparkles className="w-4 h-4 text-indigo-300" />
                              AI Best Answer
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                              {item.ideal_answer}
                            </p>
                          </div>
                        )}

                        {/* Improvements list */}
                        {item.improvements && item.improvements.length > 0 && (
                          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/40">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2">
                              <TrendingUp className="w-4 h-4 text-amber-300" />
                              Key Improvements
                            </div>
                            <ul className="space-y-1.5">
                              {item.improvements.map((imp, i) => (
                                <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                                  <span className="text-amber-400 mt-0.5">•</span>
                                  {imp}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => playSegment(startTs, endTs)}
                            className="px-4 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <Play className="w-3 h-3" /> Play Full Answer
                          </button>
                          <button
                            type="button"
                            onClick={() => seekTo(startTs)}
                            className="px-4 py-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 text-slate-200 border border-slate-700/50 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <Clock className="w-3 h-3" /> Jump to Start
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {feedbackItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <Clock className="w-10 h-10 mb-3 opacity-20" />
              <p>No answer analysis available.</p>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/*  SECTION 4: Final Summary                                        */}
      {/* ================================================================ */}
      {finalSummary && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full"
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">Final Summary</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Strengths */}
            {finalSummary.strengths.length > 0 && (
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider mb-3">
                  <TrendingUp className="w-4 h-4" />
                  Strengths
                </div>
                <ul className="space-y-2">
                  {finalSummary.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {finalSummary.weaknesses.length > 0 && (
              <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300 uppercase tracking-wider mb-3">
                  <AlertCircle className="w-4 h-4" />
                  Weaknesses
                </div>
                <ul className="space-y-2">
                  {finalSummary.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                      <span className="text-rose-400 mt-0.5">✗</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {finalSummary.improvements.length > 0 && (
              <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider mb-3">
                  <Sparkles className="w-4 h-4" />
                  Suggestions
                </div>
                <ul className="space-y-2">
                  {finalSummary.improvements.map((imp, i) => (
                    <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">→</span> {imp}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.section>
      )}

      {/* ================================================================ */}
      {/*  SECTION 5: Skill Gap Analysis                                   */}
      {/* ================================================================ */}
      {skillGaps.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">Skill Gap Analysis</h3>
          </div>

          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {skillGaps.map((sg, idx) => (
                <motion.div
                  key={`${sg.skill}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.08 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-200">{sg.skill}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${getScoreColor(sg.score)}`}>{sg.score}%</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        sg.score >= 70
                          ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                          : sg.score >= 50
                          ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                          : 'text-rose-300 bg-rose-500/10 border-rose-500/20'
                      }`}>
                        {sg.level}
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${getScoreBgColor(sg.score)}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${sg.score}%` }}
                      transition={{ duration: 0.8, delay: 0.8 + idx * 0.08, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
