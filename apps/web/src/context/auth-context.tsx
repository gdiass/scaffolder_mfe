import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthMeResponseDto, LoginRequestDto, SafeUserProfileDto } from '../lib/api-client/models';

interface AuthContextType {
  user: SafeUserProfileDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginRequestDto) => Promise<SafeUserProfileDto>;
  loginFederated: (returnTo?: string) => void;
  logout: () => Promise<void>;
  manageAccount: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const shellBaseUrl = import.meta.env.VITE_SHELL_BASE_URL ?? 'http://localhost:3000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${shellBaseUrl}/api/v1/auth/me`, { credentials: 'include' });
      if (response.ok) {
        const data = (await response.json()) as AuthMeResponseDto;
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = useCallback(async (credentials: LoginRequestDto): Promise<SafeUserProfileDto> => {
    try {
      const response = await fetch(`${shellBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (response.ok) {
        const loggedUser = ((await response.json()) as AuthMeResponseDto).user;
        setUser(loggedUser);
        return loggedUser;
      }
      throw new Error('Formato de resposta inesperado.');
    } catch (err: any) {
      const detail = err?.detail || err?.message;
      throw new Error(detail || 'Não foi possível autenticar com as credenciais informadas.');
    }
  }, []);

  const loginFederated = useCallback((returnTo?: string) => {
    const searchParams = new URLSearchParams();
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      searchParams.set('returnTo', returnTo);
    }
    const query = searchParams.toString();
    window.location.href = `${shellBaseUrl}/api/v1/auth/login${query ? `?${query}` : ''}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${shellBaseUrl}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    } finally {
      setUser(null);
      window.location.href = '/login';
    }
  }, []);

  const manageAccount = useCallback(() => {
    window.location.href = `${shellBaseUrl}/api/v1/auth/account`;
  }, []);

  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        loginFederated,
        logout,
        manageAccount,
        refetchUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider.');
  }
  return context;
}
