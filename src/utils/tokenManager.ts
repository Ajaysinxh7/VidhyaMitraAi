/**
 * Utility to manage JWT tokens in the frontend.
 * Access token is stored in memory for security against XSS.
 * Refresh token is stored in localStorage (can be moved to httpOnly cookie later).
 */

let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string) => {
    inMemoryAccessToken = token;
};

export const getAccessToken = () => {
    return inMemoryAccessToken;
};

export const removeAccessToken = () => {
    inMemoryAccessToken = null;
};

export const setRefreshToken = (token: string) => {
    localStorage.setItem('refresh_token', token);
};

export const getRefreshToken = () => {
    return localStorage.getItem('refresh_token');
};

export const removeRefreshToken = () => {
    localStorage.removeItem('refresh_token');
};

export const clearAllTokens = () => {
    removeAccessToken();
    removeRefreshToken();
};
