import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  loading: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('atrios_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('atrios_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser({ _id: '1', name: 'Super Admin', email: 'admin@atrios.lk', role: 'superadmin', active: true, createdAt: '' });
      }
    } else if (token) {
      setUser({ _id: '1', name: 'Super Admin', email: 'admin@atrios.lk', role: 'superadmin', active: true, createdAt: '' });
    }
    setLoading(false);
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('atrios_token', newToken);
    localStorage.setItem('atrios_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('atrios_token');
    localStorage.removeItem('atrios_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
