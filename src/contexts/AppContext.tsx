import { createContext, useContext, useState, type ReactNode } from 'react';

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

interface AppContextType {
    user: User | null;
    resumeResult: ResumeResult | null;
    interviewHistory: InterviewFeedback[];
    setResumeResult: (result: ResumeResult | null) => void;
    addInterviewFeedback: (feedback: InterviewFeedback) => void;
    clearInterview: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [user] = useState<User>({ id: '1', name: 'Alex Johnson', role: 'Software Engineer' });
    const [resumeResult, setResumeResult] = useState<ResumeResult | null>(null);
    const [interviewHistory, setInterviewHistory] = useState<InterviewFeedback[]>([]);

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
