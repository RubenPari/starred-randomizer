import { createContext, useMemo, useCallback, type ReactNode } from 'react';
import axios from 'axios';
import { authClient, AuthActionError } from '../lib/auth-client';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateToken: (token: string) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateToken: async () => {},
});

axios.defaults.withCredentials = true;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: loading } = authClient.useSession();
  const user = useMemo<User | null>(() => session ? {
    id: session.user.id,
    email: session.user.email,
    created_at: new Date(session.user.createdAt).toISOString(),
  } : null, [session]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) throw new AuthActionError(error);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: email.split('@')[0],
    });
    if (error) throw new AuthActionError(error);
  }, []);

  const logout = useCallback(async () => {
    const { error } = await authClient.signOut();
    if (error) throw new AuthActionError(error);
  }, []);

  const updateToken = useCallback(async (token: string) => {
    await axios.put('/api/auth/me/token', { token });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
}
