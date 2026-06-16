import { createContext, useContext, useMemo, useState } from 'react';
import { api, setAuthToken } from '../services/api';

type User = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('infraops.token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('infraops.user');
    return raw ? JSON.parse(raw) : null;
  });
  const [isBootstrapping] = useState(false);

  if (token) setAuthToken(token);

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const nextToken = response.data.token;
    const nextUser = response.data.user;
    localStorage.setItem('infraops.token', nextToken);
    localStorage.setItem('infraops.user', JSON.stringify(nextUser));
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function logout() {
    localStorage.removeItem('infraops.token');
    localStorage.removeItem('infraops.user');
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({ token, user, isBootstrapping, login, logout }), [token, user, isBootstrapping]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
