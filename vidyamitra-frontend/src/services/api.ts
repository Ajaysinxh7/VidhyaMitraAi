import axios from 'axios';

// In production, configure this via Vite env (e.g. VITE_API_URL=https://api.example.com).
// Keep localhost as a safe dev default.
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Avoid hanging requests in production networks.
    timeout: 120_000,
});

export interface AudioAnalysisResult {
    transcript: string;
    filler_words: { word: string; timestamp: number }[];
    total_count: number;
    duration_seconds: number;
}

export interface EyeContactEvent {
    timestamp: number;
    eye_contact: boolean;
}

export interface TimelineEvent {
    timestamp: number;
    event: string;
    label: string;
    source?: string;
    confidence?: number;
    metadata?: any;
}

export interface TimelineSyncResponse {
    video_start_time: string;
    duration_seconds: number;
    total_events: number;
    timeline: TimelineEvent[];
    summary: Record<string, number>;
}

export interface ATSAnalysisResult {
    atsScore: number;
    sectionScores?: Record<string, number>;
    foundKeywords?: string[];
    missingKeywords?: string[];
    recommendations?: string[];
    strengths?: string[];
    verdict?: string;
}

export const analyzeResume = async (file: File, targetRole: string, userId: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);
    if (targetRole) {
        formData.append('target_role', targetRole);
    }

    const { data } = await apiClient.post('/resume/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return data;
};

/** Analyzes pasted resume text for ATS scoring (new detailed analysis) */
export const analyzeResumeText = async (
    resumeText: string,
    targetRole: string,
    userId: string,
    targetCompany?: string
): Promise<ATSAnalysisResult> => {
    const { data } = await apiClient.post('/resume/analyze-text', {
        resume_text: resumeText,
        target_role: targetRole,
        target_company: targetCompany || '',
        user_id: userId,
    });
    return data;
};

// --- Resume Parse API ---

export interface ParsedProject {
    name: string;
    description: string;
    technologies: string[];
}

export interface ParsedExperience {
    title: string;
    company: string;
    duration: string;
    description: string;
}

export interface ParsedEducation {
    degree: string;
    institution: string;
    year: string;
}

export interface ParsedResumeData {
    skills: string[];
    projects: ParsedProject[];
    experience: ParsedExperience[];
    education: ParsedEducation[];
    summary: string;
}

/** Parses a resume and returns structured data (skills, projects, experience, education, summary) */
export const parseResume = async (file: File): Promise<ParsedResumeData> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await apiClient.post('/resume/parse', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return data;
};

// Starts an interview session
export const startInterviewSession = async (userId: string, targetRole: string): Promise<any> => {
    const { data } = await apiClient.post('/interview/start', {
        user_id: userId,
        target_role: targetRole
    });
    return data;
};

// Submits all answers for an interview session
export const submitInterviewAnswers = async (sessionId: string, userId: string, answers: any[]): Promise<any> => {
    const { data } = await apiClient.post('/interview/submit-answers', {
        session_id: sessionId,
        user_id: userId,
        answers: answers
    });
    return data;
};

// Evaluates the submitted session
export const evaluateInterviewSession = async (sessionId: string, userId: string): Promise<any> => {
    const { data } = await apiClient.post('/evaluate/interview-summary', {
        session_id: sessionId,
        user_id: userId
    });
    return data;
};

// --- Quiz API ---

export interface QuizQuestion {
    id: string;
    question_text: string;
    options: string[];
}

export interface QuizAnswerItem {
    question_id: string;
    selected_option: string;
}

export interface DetailedResult {
    question_id: string;
    question_text: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation: string;
}

export interface GenerateQuizResponse {
    status: string;
    quiz_id: string;
    topic: string;
    questions: QuizQuestion[];
    is_resume_based?: boolean;
    skills_tested?: string[];
}

export interface SubmitQuizResponse {
    status: string;
    score: string;
    score_percentage: number;
    detailed_results: DetailedResult[];
    is_resume_based?: boolean;
    skills_tested?: string[];
}

/** Generates an AI quiz for a given topic via POST /quiz/generate */
export const generateQuiz = async (
    userId: string,
    topic: string,
    difficulty: string,
    numQuestions: number,
    resumeData?: ParsedResumeData
): Promise<GenerateQuizResponse> => {
    const { data } = await apiClient.post('/quiz/generate', {
        user_id: userId,
        topic,
        difficulty,
        num_questions: numQuestions,
        resume_data: resumeData,
    });
    return data;
};

/** Submits quiz answers for grading via POST /quiz/submit */
export const submitQuiz = async (
    userId: string,
    quizId: string,
    answers: QuizAnswerItem[]
): Promise<SubmitQuizResponse> => {
    const { data } = await apiClient.post('/quiz/submit', {
        quiz_id: quizId,
        user_id: userId,
        answers,
    });
    return data;
};

// --- Roadmap API ---

export interface RoadmapMilestone {
    id: string;
    title: string;
    description: string;
    duration: string;
    status: 'completed' | 'current' | 'upcoming';
}

// --- Interview Pipeline API (questions → recording → analysis → report) ---
export interface InterviewQuestion {
    id: string;
    text: string;
    category: string; // project-based | technical | behavioral
}

export interface InterviewAnswerWindow {
    question_id: string;
    start_offset_seconds: number;
    end_offset_seconds: number;
}

export interface GenerateInterviewQuestionsResponse {
    status: string;
    session_id: string;
    questions: InterviewQuestion[];
}

export interface RecordInterviewResponse {
    status: string;
    session_id: string;
    media_refs: {
        video_url: string;
        audio_url: string;
    };
}

export interface InterviewPerQuestionAnalysis {
    question_id: string;
    answer_start_offset_seconds: number;
    answer_end_offset_seconds: number;
    transcript_excerpt: string;
    filler_word_count: number;
    top_fillers: string[];
    eye_contact_ratio: number;
    words_in_window_count: number;
}

export interface InterviewAnalysisResponse {
    status: string;
    session_id: string;
    analysis: {
        transcript: string;
        duration_seconds: number;
        filler_words: { word: string; timestamp: number; question_id?: string | null }[];
        eye_contact_edges: { timestamp: number; eye_contact: boolean }[];
        timeline: TimelineEvent[];
        timeline_summary: Record<string, number>;
        timeline_sync: TimelineSyncResponse;
        per_question: InterviewPerQuestionAnalysis[];
        video_start_time: string;
        resume_data_preview?: any;
    };
}

export interface PerQuestionScores {
    technical: number;
    communication: number;
    confidence: number;
}

export interface InterviewPerQuestionFeedback {
    question_id: string;
    score: number;
    confidence: number;
    scores: PerQuestionScores;
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

export interface InterviewReportResponse {
    status: string;
    session_id: string;
    interview_report: {
        technical_score: number;
        communication_score: number;
        confidence_score: number;
        filler_word_count: number;
        eye_contact_score: number;
        final_score: number;
        final_verdict: string;
        key_strengths: string[];
        areas_for_improvement: string[];
        final_summary: FinalSummary;
        skill_gap_analysis: SkillGapItem[];
        per_question_feedback: InterviewPerQuestionFeedback[];
        timeline: any[];
    };
}

export const generateInterviewQuestions = async (
    userId: string,
    resumeData: ParsedResumeData,
    numQuestions = 6,
    difficulty = 'intermediate'
): Promise<GenerateInterviewQuestionsResponse> => {
    const { data } = await apiClient.post('/interview/questions', {
        user_id: userId,
        resume_data: resumeData,
        num_questions: numQuestions,
        difficulty,
    });
    return data;
};

export const recordInterview = async (params: {
    sessionId: string;
    userId: string;
    videoStartTime: string;
    answerWindows: InterviewAnswerWindow[];
    videoBlob: Blob;
    audioBlob: Blob;
}): Promise<RecordInterviewResponse> => {
    const formData = new FormData();
    formData.append('session_id', params.sessionId);
    formData.append('user_id', params.userId);
    formData.append('video_start_time', params.videoStartTime);
    formData.append('answer_windows', JSON.stringify(params.answerWindows));
    formData.append('video', params.videoBlob, 'interview_video.webm');
    formData.append('audio', params.audioBlob, 'interview_audio.webm');

    const { data } = await apiClient.post('/interview/record', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const analyzeInterview = async (sessionId: string, userId: string): Promise<InterviewAnalysisResponse> => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('user_id', userId);

    const { data } = await apiClient.post('/interview/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export const getInterviewReport = async (sessionId: string, userId: string): Promise<InterviewReportResponse> => {
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('user_id', userId);

    const { data } = await apiClient.post('/interview/report', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
};

export interface VideoRecommendation {
    title: string;
    video_id: string;
    url: string;
}

export interface GenerateRoadmapResponse {
    roadmap_id: string;
    goal: string;
    milestones: RoadmapMilestone[];
    recommended_videos: VideoRecommendation[];
    dashboard_image_url: string | null;
}

/** Generates an AI career roadmap via POST /roadmap/generate */
export const generateRoadmap = async (
    userId: string,
    goal: string,
    timelineMonths: number
): Promise<GenerateRoadmapResponse> => {
    const { data } = await apiClient.post('/roadmap/generate', {
        user_id: userId,
        goal,
        timeline_months: timelineMonths,
    });
    return data;
};

// --- New Advanced Interview Analysis API ---

export interface AudioAnalysisResult {
    transcript: string;
    filler_words: { word: string; timestamp: number }[];
    total_count: number;
    duration_seconds: number;
}

export interface EyeContactEvent {
    timestamp: number;
    eye_contact: boolean;
}

export interface TimelineEvent {
    timestamp: number;
    event: string;
    label: string;
    source?: string;
    confidence?: number;
    metadata?: any;
}

export interface TimelineSyncResponse {
    video_start_time: string;
    duration_seconds: number;
    total_events: number;
    timeline: TimelineEvent[];
    summary: Record<string, number>;
}

/** Uploads audio for Whisper transcription and filler word detection */
export const analyzeAudio = async (audioBlob: Blob): Promise<AudioAnalysisResult> => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'interview_audio.webm');
    
    const { data } = await apiClient.post('/audio/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
};

/** Uploads video for eye contact/pose tracking */
export const analyzeEyeContact = async (videoBlob: Blob): Promise<EyeContactEvent[]> => {
    const formData = new FormData();
    formData.append('video', videoBlob, 'interview_video.webm');

    const { data } = await apiClient.post('/cv/eye-contact', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
};

/** Merges all analysis results into a single synced timeline */
export const syncInterviewTimeline = async (
    startTime: string,
    duration: number,
    fillerEvents: any[],
    eyeContactEvents: any[]
): Promise<TimelineSyncResponse> => {
    const { data } = await apiClient.post('/timeline/sync', {
        video_start_time: startTime,
        duration_seconds: duration,
        sources: [
            {
                name: "audio_filler",
                offset_seconds: 0,
                events: fillerEvents
            },
            {
                name: "cv_analysis",
                offset_seconds: 0,
                events: eyeContactEvents.map(e => ({
                    type: "eye_contact",
                    timestamp: e.timestamp,
                    label: e.eye_contact ? "Eye contact maintained" : "Lost eye contact",
                    confidence: 1.0
                }))
            }
        ]
    });
    return data;
};
