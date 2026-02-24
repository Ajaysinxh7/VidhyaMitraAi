import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiClient } from '../services/api';
import {
    setAccessToken,
    setRefreshToken,
    clearAllTokens
} from '../utils/tokenManager';

export interface User {
    id: number | string;
    email: string;
    name?: string;
    role?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (access: string, refresh: string, user: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // Parse token on mount to restore session if possible
    useEffect(() => {
        const initAuth = async () => {
            // If we don't have access token in memory, try fetching user info from backend using api interceptor behavior.
            // Or we can just let interceptors refresh our session.
            try {
                const res = await apiClient.get('/auth/me');
                setUser(res.data);
                setIsAuthenticated(true);
            } catch (err) {
                // Ignore, means no valid session
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen to unauthorized events from api interceptor
        const handleUnauthorized = () => {
            logout();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, []);

    const login = (access: string, refresh: string, userData: User) => {
        setAccessToken(access);
        setRefreshToken(refresh);
        setUser(userData);
        setIsAuthenticated(true);
    };

    const logout = () => {
        clearAllTokens();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
