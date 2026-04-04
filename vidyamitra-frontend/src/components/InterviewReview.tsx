import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, EyeOff, Eye, MessageSquareWarning, UserMinus, Info, Clock, Sparkles, Target, FileText } from 'lucide-react';

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

export interface PerQuestionFeedbackItem {
  question_id: string;
  score: number;
  confidence: number;
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

export interface InterviewReviewProps {
  videoUrl: string;
  timelineData: TimelineSyncResponse;
  className?: string;
  perQuestionFeedback?: PerQuestionFeedbackItem[];
  questions?: Array<{ id: string; text: string; category?: string }>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getEventVisuals(eventItem: TimelineEventItem | string) {
  const eventType = typeof eventItem === 'string' ? eventItem : eventItem.event;
  const label = typeof eventItem === 'string' ? '' : eventItem.label || '';

  if (eventType === 'filler_word') {
    return {
      icon: <MessageSquareWarning className="w-4 h-4 text-amber-400" />,
      color: 'bg-amber-400',
    };
  }
  if (eventType === 'eye_contact') {
    if (label.includes('maintained')) {
      return {
        icon: <Eye className="w-4 h-4 text-emerald-400" />,
        color: 'bg-emerald-400',
      };
    } else {
      return {
        icon: <EyeOff className="w-4 h-4 text-rose-400" />,
        color: 'bg-rose-400',
      };
    }
  }
  if (eventType === 'posture') {
    return {
      icon: <UserMinus className="w-4 h-4 text-purple-400" />,
      color: 'bg-purple-400',
    };
  }
  
  return {
    icon: <Info className="w-4 h-4 text-blue-400" />,
    color: 'bg-blue-400',
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function InterviewReview({
  videoUrl,
  timelineData,
  className = '',
  perQuestionFeedback,
  questions,
}: InterviewReviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(timelineData.duration_seconds || 1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeEventIndex, setActiveEventIndex] = useState<number>(-1);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const segmentEndRef = useRef<number | null>(null);

  // Sync video time with state
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // Find the most recent event that has passed
      const currentEvents = timelineData.timeline;
      let lastPassedIndex = -1;
      for (let i = 0; i < currentEvents.length; i++) {
        if (currentEvents[i].timestamp <= time) {
          lastPassedIndex = i;
        } else {
          break; // Since it's sorted chronologically
        }
      }
      setActiveEventIndex(lastPassedIndex);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration > 0 ? videoRef.current.duration : timelineData.duration_seconds || 1);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, time - 0.5); // Seek slightly before the event
      setCurrentTime(time);
      // Automatically play if paused to see the event in context
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const playSegment = useCallback((start: number, end: number) => {
    if (!videoRef.current) return;
    const safeStart = Math.max(0, start - 0.25);
    const safeEnd = Math.max(safeStart, end);
    segmentEndRef.current = safeEnd;
    videoRef.current.currentTime = safeStart;
    videoRef.current.play();
    setIsPlaying(true);
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

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    seekTo(pos * duration);
  };

  // Auto-scroll active event into view
  useEffect(() => {
    if (activeEventIndex >= 0 && scrollRef.current) {
      const activeEl = document.getElementById(`event-card-${activeEventIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeEventIndex]);

  const timelineItems = useMemo(() => {
    return timelineData.timeline.map((event, idx) => ({ event, idx }));
  }, [timelineData.timeline]);

  const questionStartById = useMemo(() => {
    const starts = new Map<string, number>();
    for (const { event } of timelineItems) {
      const qid = (event.metadata as any)?.question_id;
      if (!qid) continue;
      if (event.event !== 'question_start') continue;
      const ts = event.timestamp;
      const prev = starts.get(qid);
      if (prev === undefined || ts < prev) starts.set(qid, ts);
    }
    return starts;
  }, [timelineItems]);

  const groupedByQuestionId = useMemo(() => {
    const groups = new Map<string, Array<{ event: TimelineEventItem; idx: number }>>();
    for (const item of timelineItems) {
      const qid = (item.event.metadata as any)?.question_id;
      const key = qid ? String(qid) : 'unassigned';
      const arr = groups.get(key) ?? [];
      arr.push(item);
      groups.set(key, arr);
    }
    return groups;
  }, [timelineItems]);

  const questionOrder = useMemo(() => {
    if (perQuestionFeedback && perQuestionFeedback.length > 0) {
      return perQuestionFeedback.map((f) => f.question_id);
    }
    // fallback: question ids from start events
    return Array.from(questionStartById.keys());
  }, [perQuestionFeedback, questionStartById]);

  useEffect(() => {
    if (activeQuestionId) return;
    if (questionOrder.length > 0) {
      setActiveQuestionId(questionOrder[0]);
    }
  }, [activeQuestionId, questionOrder]);

  const displayedQuestionId = activeQuestionId && groupedByQuestionId.has(activeQuestionId) ? activeQuestionId : 'unassigned';
  const displayedItems = groupedByQuestionId.get(displayedQuestionId) ?? [];
  return (
    <div className={`flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto ${className}`}>
      
      {/* Left: Video Player */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Video Container */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/50 shadow-2xl aspect-video group">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Custom Controls Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
            
            {/* Custom Timeline Scrubber */}
            <div 
              className="w-full h-2 md:h-3 bg-slate-800/80 rounded-full mb-4 cursor-pointer relative backdrop-blur-sm border border-slate-700/50"
              onClick={handleTimelineClick}
            >
              {/* Progress fill */}
              <div 
                className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full pointer-events-none"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              
              {/* Event Markers */}
              {timelineData.timeline.map((event, idx) => {
                const posPercent = (event.timestamp / duration) * 100;
                const { color: markerColor } = getEventVisuals(event);
                return (
                  <div
                    key={`marker-${idx}`}
                    className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-3 md:h-4 rounded-full ${markerColor} z-10`}
                    style={{ left: `max(0%, min(100%, ${posPercent}% - 0.25rem))` }}
                    title={event.label}
                  />
                );
              })}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between text-slate-200">
              <div className="flex items-center gap-4">
                <button 
                  onClick={togglePlay}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <div className="text-sm font-mono tracking-wider">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <button 
                onClick={toggleMute}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries({
            eye_contact: 0,
            filler_word: 0,
            posture: 0,
            ...timelineData.summary
          }).map(([eventType, count]) => {
            const { icon } = getEventVisuals(eventType);
            return (
              <div key={eventType} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center justify-center">
                <div className="mb-2">
                   {icon}
                </div>
                <div className="text-2xl font-bold text-slate-100">{count}</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider text-center mt-1">
                  {eventType.replace('_', ' ')}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Feedback List */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-800/30 border border-slate-700/50 rounded-2xl h-[400px] lg:h-auto overflow-hidden">
        <div className="p-5 border-b border-slate-700/50 bg-slate-900/40 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            Interview Timeline
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Click an event to jump to that moment in the video.
          </p>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar"
        >
          {perQuestionFeedback && perQuestionFeedback.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                Questions
              </div>
              {perQuestionFeedback.map((item, idx) => {
                const qid = item.question_id;
                const startTs = item.answer_start_offset_seconds ?? questionStartById.get(qid) ?? 0;
                const endTs = item.answer_end_offset_seconds ?? startTs;
                const q = questions?.find((qq) => qq.id === qid);
                const isActive = qid === displayedQuestionId;
                return (
                  <div
                    key={`${qid}-${idx}`}
                    className={`rounded-2xl border transition-colors ${isActive ? 'bg-slate-800/70 border-indigo-500/40' : 'bg-slate-800/30 border-slate-700/40 hover:bg-slate-800/50 hover:border-slate-600/60'}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveQuestionId(qid);
                        setExpandedQuestionId((prev) => (prev === qid ? null : qid));
                        seekTo(startTs);
                      }}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold">
                            {q ? q.category?.replace('_', ' ') : 'question'}
                          </div>
                          <div className="text-sm text-slate-100 font-semibold leading-snug">
                            {q ? q.text : qid}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-sm font-mono text-slate-100">
                            {item.score ?? 0}
                          </div>
                          <div className="text-xs text-slate-500">
                            conf {item.confidence ?? 0}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                        <span>{formatTime(startTs)} – {formatTime(endTs)}</span>
                        <span className="text-slate-500">
                          fillers {item.filler_word_count ?? 0} • eye {Math.round((item.eye_contact_ratio ?? 0) * 100)}%
                        </span>
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedQuestionId === qid && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3">
                            <div className="text-xs text-slate-300 leading-relaxed">
                              {item.feedback}
                            </div>

                            {item.transcript_excerpt && (
                              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-1">
                                  <FileText className="w-4 h-4 text-purple-300" />
                                  Transcript (excerpt)
                                </div>
                                <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                  {item.transcript_excerpt}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => playSegment(startTs, endTs)}
                                className="px-3 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition-colors"
                              >
                                Play full answer
                              </button>
                              <button
                                type="button"
                                onClick={() => seekTo(startTs)}
                                className="px-3 py-2 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 text-slate-200 border border-slate-700/50 text-xs font-semibold transition-colors"
                              >
                                Jump to start
                              </button>
                            </div>

                            {(item.better_response || item.ideal_answer) && (
                              <div className="space-y-2">
                                {item.better_response && (
                                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200 mb-1">
                                      <Target className="w-4 h-4 text-emerald-300" />
                                      Better response (how you should answer)
                                    </div>
                                    <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                                      {item.better_response}
                                    </div>
                                  </div>
                                )}
                                {item.ideal_answer && (
                                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200 mb-1">
                                      <Sparkles className="w-4 h-4 text-indigo-300" />
                                      Ideal answer (example)
                                    </div>
                                    <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                                      {item.ideal_answer}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          {displayedItems.map(({ event, idx }) => {
            const isActive = idx === activeEventIndex;
            return (
              <motion.div
                id={`event-card-${idx}`}
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => seekTo(event.timestamp)}
                className={`
                  p-4 rounded-xl cursor-pointer border transition-all duration-200 group
                  ${isActive 
                    ? 'bg-slate-700/60 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                    : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    p-2 rounded-lg mt-0.5
                    ${isActive ? 'bg-indigo-500/20' : 'bg-slate-900/50 group-hover:bg-slate-900'}
                  `}>
                    {getEventVisuals(event).icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-indigo-300' : 'text-slate-400'}`}>
                        {event.event.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded-md">
                        {formatTime(event.timestamp)}
                      </span>
                    </div>
                    
                    <p className={`text-sm ${isActive ? 'text-slate-200' : 'text-slate-300'}`}>
                      {event.label}
                    </p>
                    
                    {event.metadata && event.metadata.word && (
                      <p className="text-xs text-amber-300/80 mt-1.5 bg-amber-500/10 inline-block px-2 py-0.5 rounded border border-amber-500/20">
                        Word: "{event.metadata.word}"
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {displayedItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <Clock className="w-10 h-10 mb-3 opacity-20" />
              <p>No timeline events recorded for this selection.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
