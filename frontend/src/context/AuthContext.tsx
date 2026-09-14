import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, LoginCredentials, SignupData, AuthContextType } from '../types/auth';
import { loginUser, signupUser, getCurrentUser } from '../api/auth';
import { getStoredToken, removeStoredToken, setStoredToken } from '../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setToken(currentToken);
      return userData;
    } catch (error) {
      console.warn('Failed to restore session:', error);
      removeStoredToken();
      setUser(null);
      setToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    // Listen for unauthorized 401 events from apiClient
    const handleUnauthorized = () => {
      removeStoredToken();
      setUser(null);
      setToken(null);
    };

    window.addEventListener('civicrelay:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('civicrelay:unauthorized', handleUnauthorized);
    };
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await loginUser(credentials);
      if (response.access_token) {
        setToken(response.access_token);
        if (response.user) {
          setUser(response.user);
        } else {
          await refreshUser();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (signupData: SignupData): Promise<void> => {
    setIsLoading(true);
    try {
      await signupUser(signupData);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    removeStoredToken();
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isLoading,
        isStaff,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
