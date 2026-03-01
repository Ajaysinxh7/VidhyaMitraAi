import axios from 'axios';

const BASE_URL = 'http://localhost:8000'; // FastAPI backend

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

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

    // We map the backend response structure to the frontend ResumeResult structure 
    // depending on the exact shape, but for now we'll pass the whole data through.
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
}

export interface SubmitQuizResponse {
    status: string;
    score: string;
    score_percentage: number;
    detailed_results: DetailedResult[];
}

/** Generates an AI quiz for a given topic via POST /quiz/generate */
export const generateQuiz = async (
    userId: string,
    topic: string,
    difficulty: string,
    numQuestions: number
): Promise<GenerateQuizResponse> => {
    const { data } = await apiClient.post('/quiz/generate', {
        user_id: userId,
        topic,
        difficulty,
        num_questions: numQuestions,
    });
    return data;
};

/** Submits quiz answers for grading via POST /quiz/submit */
export const submitQuiz = async (
    quizId: string,
    userId: string,
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
    timelineMonths: number = 6
): Promise<GenerateRoadmapResponse> => {
    const { data } = await apiClient.post('/roadmap/generate', {
        user_id: userId,
        goal,
        timeline_months: timelineMonths,
    });
    return data;
};
