import { create } from 'zustand';
import { User, Organization, UserRole } from '../types';
import { api } from '../lib/axios';

interface AuthState {
  user: User | null;
  activeOrganization: Organization | null;
  organizations: Organization[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  switchOrg: (organizationId: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  activeOrganization: null,
  organizations: [],
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await api.post('/auth/login', credentials);
      set({
        user: res.data.user,
        activeOrganization: res.data.activeOrganization,
        organizations: res.data.organizations || [],
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Login failed. Please verify your credentials.',
        isLoading: false,
      });
      throw err;
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await api.post('/auth/register', payload);
      set({
        user: res.data.user,
        activeOrganization: res.data.activeOrganization,
        organizations: [res.data.activeOrganization],
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      set({
        error: err.message || 'Registration failed.',
        isLoading: false,
      });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout error ignored:', err);
    } finally {
      set({
        user: null,
        activeOrganization: null,
        organizations: [],
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  switchOrg: async (organizationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await api.post('/auth/switch-org', { organizationId });
      set((state) => ({
        activeOrganization: res.data.activeOrganization,
        isLoading: false,
      }));
    } catch (err: any) {
      set({
        error: err.message || 'Failed to switch organization workspace.',
        isLoading: false,
      });
      throw err;
    }
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const res: any = await api.get('/auth/me');
      set({
        user: res.data.user,
        activeOrganization: res.data.activeOrganization,
        organizations: res.data.organizations || [],
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({
        user: null,
        activeOrganization: null,
        organizations: [],
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
