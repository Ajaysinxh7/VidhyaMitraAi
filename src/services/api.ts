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
