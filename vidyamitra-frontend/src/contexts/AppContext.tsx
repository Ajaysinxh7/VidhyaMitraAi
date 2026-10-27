import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ParsedResumeData } from '../services/api';

// Types
export interface User {
    id: string;
    name: string;
    role: string;
}

export interface ResumeResult {
    score: number;
    missingSkills: Array<{ name: string; severity: 'high' | 'medium' | 'low' }>;
    categories: Array<{ subject: string; A: number; fullMark: number }>;
    courses: Array<{ title: string; provider: string; url: string }>;
}

export interface InterviewFeedback {
    question: string;
    answer: string;
    confidence: number;
    clarity: number;
    accuracy: number;
    suggestion: string;
}

export interface InterviewQuestionItem {
    id: string;
    text: string;
    category: string;
}

export interface AnswerWindowMsItem {
    question_id: string;
    startMs: number | null;
    endMs: number | null;
    skipped?: boolean;
}

export type InterviewSessionStatus = 'in_progress' | 'evaluating' | 'completed' | 'error';

export interface ActiveInterviewSession {
    sessionId: string;
    userId: string;
    status: InterviewSessionStatus;
    questions: InterviewQuestionItem[];
    currentIdx: number;
    answerWindows: AnswerWindowMsItem[];
    createdAt: string;
    updatedAt: string;
    resumeSnapshot?: ParsedResumeData | null;
}

export interface CompletedInterviewSession {
    sessionId: string;
    userId: string;
    createdAt: string;
    questions: InterviewQuestionItem[];
    report: any;
    videoUrl?: string | null;
    timelineData?: any;
    resumeSnapshot?: ParsedResumeData | null;
}

export const ACTIVE_RESUME_STORAGE_KEY = 'vidyamitra_active_resume';
export const ACTIVE_INTERVIEW_SESSION_KEY = 'vidyamitra_active_interview_session';
export const COMPLETED_INTERVIEWS_KEY = 'vidyamitra_completed_interviews';

interface AppContextType {
    user: User | null;
    resumeResult: ResumeResult | null;
    parsedResume: ParsedResumeData | null;
    interviewHistory: InterviewFeedback[];
    activeInterviewSession: ActiveInterviewSession | null;
    completedInterviews: CompletedInterviewSession[];
    setResumeResult: (result: ResumeResult | null) => void;
    setParsedResume: (data: ParsedResumeData | null) => void;
    clearActiveResume: () => void;
    setActiveInterviewSession: (session: ActiveInterviewSession | null) => void;
    clearActiveInterviewSession: () => void;
    saveCompletedInterview: (session: CompletedInterviewSession) => void;
    addInterviewFeedback: (feedback: InterviewFeedback) => void;
    clearInterview: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [user] = useState<User>({ id: '1', name: 'Alex Johnson', role: 'Software Engineer' });
    const [resumeResult, setResumeResult] = useState<ResumeResult | null>(null);

    const [parsedResume, setParsedResumeState] = useState<ParsedResumeData | null>(() => {
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                const stored = window.sessionStorage.getItem(ACTIVE_RESUME_STORAGE_KEY);
                return stored ? JSON.parse(stored) : null;
            }
        } catch {
            // Ignore storage parse errors
        }
        return null;
    });

    const [interviewHistory, setInterviewHistory] = useState<InterviewFeedback[]>([]);

    const [activeInterviewSession, setActiveInterviewSessionState] = useState<ActiveInterviewSession | null>(() => {
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                const stored = window.sessionStorage.getItem(ACTIVE_INTERVIEW_SESSION_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed && (parsed.status === 'in_progress' || parsed.status === 'evaluating')) {
                        return parsed;
                    }
                }
            }
        } catch {
            // Ignore storage parse errors
        }
        return null;
    });

    const [completedInterviews, setCompletedInterviews] = useState<CompletedInterviewSession[]>(() => {
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                const stored = window.sessionStorage.getItem(COMPLETED_INTERVIEWS_KEY);
                if (stored) {
                    return JSON.parse(stored);
                }
            }
        } catch {
            // Ignore storage parse errors
        }
        return [];
    });

    const setParsedResume = (data: ParsedResumeData | null) => {
        setParsedResumeState(data);
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                if (data) {
                    window.sessionStorage.setItem(ACTIVE_RESUME_STORAGE_KEY, JSON.stringify(data));
                } else {
                    window.sessionStorage.removeItem(ACTIVE_RESUME_STORAGE_KEY);
                }
            }
        } catch {
            // Ignore storage errors
        }
    };

    const clearActiveResume = () => {
        setParsedResumeState(null);
        setResumeResult(null);
        try {
            if (typeof window !== 'undefined') {
                window.sessionStorage?.removeItem(ACTIVE_RESUME_STORAGE_KEY);
                window.sessionStorage?.removeItem('vidyamitra_parsed_resume');
                window.localStorage?.removeItem(ACTIVE_RESUME_STORAGE_KEY);
                window.localStorage?.removeItem('vidyamitra_parsed_resume');
            }
        } catch {
            // Ignore storage errors
        }
    };

    const setActiveInterviewSession = (session: ActiveInterviewSession | null) => {
        setActiveInterviewSessionState(session);
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                if (session && (session.status === 'in_progress' || session.status === 'evaluating')) {
                    window.sessionStorage.setItem(ACTIVE_INTERVIEW_SESSION_KEY, JSON.stringify(session));
                } else {
                    window.sessionStorage.removeItem(ACTIVE_INTERVIEW_SESSION_KEY);
                }
            }
        } catch {
            // Ignore storage errors
        }
    };

    const clearActiveInterviewSession = () => {
        setActiveInterviewSessionState(null);
        try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
                window.sessionStorage.removeItem(ACTIVE_INTERVIEW_SESSION_KEY);
            }
        } catch {
            // Ignore storage errors
        }
    };

    const saveCompletedInterview = (completedSession: CompletedInterviewSession) => {
        setCompletedInterviews((prev) => {
            const exists = prev.some((s) => s.sessionId === completedSession.sessionId);
            const updated = exists
                ? prev.map((s) => (s.sessionId === completedSession.sessionId ? completedSession : s))
                : [completedSession, ...prev];
            try {
                if (typeof window !== 'undefined' && window.sessionStorage) {
                    window.sessionStorage.setItem(COMPLETED_INTERVIEWS_KEY, JSON.stringify(updated));
                }
            } catch {
                // Ignore storage errors
            }
            return updated;
        });

        // Also push feedback items for backward compatibility
        if (completedSession.report?.per_question_feedback) {
            const items: InterviewFeedback[] = completedSession.report.per_question_feedback.map((f: any) => {
                const q = completedSession.questions?.find((x) => x.id === f.question_id);
                return {
                    question: q?.text || 'Interview Question',
                    answer: f.transcript_excerpt || 'Answer recorded',
                    confidence: f.confidence || 0,
                    clarity: f.scores?.communication || 0,
                    accuracy: f.scores?.technical || 0,
                    suggestion: f.feedback || '',
                };
            });
            setInterviewHistory((prev) => [...prev, ...items]);
        }
    };

    const addInterviewFeedback = (feedback: InterviewFeedback) => {
        setInterviewHistory((prev) => [...prev, feedback]);
    };

    const clearInterview = () => {
        setInterviewHistory([]);
    };

    return (
        <AppContext.Provider value={{
            user,
            resumeResult,
            setResumeResult,
            parsedResume,
            setParsedResume,
            clearActiveResume,
            activeInterviewSession,
            setActiveInterviewSession,
            clearActiveInterviewSession,
            completedInterviews,
            saveCompletedInterview,
            interviewHistory,
            addInterviewFeedback,
            clearInterview
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
