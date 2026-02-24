import axios from 'axios';
import type { ResumeResult, InterviewFeedback } from '../contexts/AppContext';
import { getAccessToken, getRefreshToken, setAccessToken, clearAllTokens } from '../utils/tokenManager';

const BASE_URL = 'http://localhost:8000'; // FastAPI backend

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach access token
apiClient.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 and refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                clearAllTokens();
                // Option: dispatch a custom event or redirect to /login
                window.dispatchEvent(new Event('auth:unauthorized'));
                return Promise.reject(error);
            }

            try {
                // Attempt to refresh the token
                const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
                    headers: {
                        Authorization: `Bearer ${refreshToken}`
                    }
                });

                const { access_token } = res.data;
                if (access_token) {
                    setAccessToken(access_token);
                    // Retry the original request with the new access token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed (e.g., refresh token expired)
                clearAllTokens();
                window.dispatchEvent(new Event('auth:unauthorized'));
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const analyzeResume = async (_file: File | string, _targetRole: string): Promise<ResumeResult> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mock response
    return {
        score: 72,
        missingSkills: [
            { name: 'Docker', severity: 'high' },
            { name: 'GraphQL', severity: 'medium' },
            { name: 'AWS', severity: 'low' },
        ],
        categories: [
            { subject: 'Frontend', A: 90, fullMark: 100 },
            { subject: 'Backend', A: 65, fullMark: 100 },
            { subject: 'DevOps', A: 40, fullMark: 100 },
            { subject: 'Database', A: 85, fullMark: 100 },
            { subject: 'Testing', A: 60, fullMark: 100 },
        ],
        courses: [
            { title: 'Docker for Beginners', provider: 'Coursera', url: '#' },
            { title: 'AWS Cloud Practitioner', provider: 'Udemy', url: '#' },
            { title: 'GraphQL with Apollo', provider: 'Pluralsight', url: '#' }
        ]
    };
};

export const submitInterviewAnswer = async (question: string, answer: string): Promise<InterviewFeedback> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
        question,
        answer,
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100
        clarity: Math.floor(Math.random() * 30) + 70, // 70-100
        accuracy: Math.floor(Math.random() * 40) + 60, // 60-100
        suggestion: "Good answer! Try to include more specific examples from your past projects to back up your claims."
    };
};

export const getMockQuestions = (type: string): string[] => {
    if (type === 'HR') {
        return [
            "Tell me about yourself.",
            "What are your greatest strengths and weaknesses?",
            "Describe a time you faced a conflict at work and how you handled it."
        ];
    } else if (type === 'Technical') {
        return [
            "Explain the difference between REST and GraphQL.",
            "How do you handle state management in a React application?",
            "Can you describe the event loop in JavaScript?"
        ];
    }
    return [
        "Walk me through a complex problem you solved recently.",
        "How do you prioritize your work when you have multiple deadlines?"
    ];
};
