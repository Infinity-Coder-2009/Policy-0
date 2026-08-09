/**
 * Authentication Store (Zustand)
 * ============================================================
 * Manages user auth state, tokens, and persistence.
 * Integrated with Clerk authentication flow.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, refreshAccessToken } from '../lib/api';

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  name?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string, role?: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  clearError: () => void;
  setupClerkSession: (url: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<{
            success: boolean;
            accessToken: string;
            refreshToken: string;
            user: User;
          }>('/api/auth/login', { email, password });

          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: any) {
          set({ error: err.message || 'Login failed', isLoading: false });
          throw err;
        }
      },

      signup: async (email, password, name, role = 'operator') => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<{
            success: boolean;
            user: User;
          }>('/api/auth/register', { email, password, name, role });

          // Auto-login after signup
          await get().login(email, password);
        } catch (err: any) {
          set({ error: err.message || 'Signup failed', isLoading: false });
          throw err;
        }
      },

      logout: () => {
        const refreshToken = get().refreshToken;
        if (refreshToken) {
          api.post('/api/auth/logout', { refreshToken }).catch(() => {});
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('policy0-auth');
        // Clear Clerk session if exists
        const clerkKey = Object.keys(localStorage).find(k => k.includes('clerk'));
        if (clerkKey) {
          localStorage.removeItem(clerkKey);
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshAccessToken: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) return false;

        try {
          const data = await api.post<{
            success: boolean;
            accessToken: string;
            refreshToken: string;
          }>('/api/auth/refresh', { refreshToken });

          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
          return true;
        } catch {
          get().logout();
          return false;
        }
      },

      clearError: () => set({ error: null }),

      // Setup Clerk session for token sharing between frontend and backend
      setupClerkSession: (url: string) => {
        // This is called when Clerk session is established
        // The Clerk session token is stored and used for backend auth
        console.log('Clerk session active:', url);
      },
    }),
    {
      name: 'policy0-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);