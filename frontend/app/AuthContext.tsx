'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id: number;
  email: string;
  role: 'user' | 'admin';
} | null;

type AuthContextValue = {
  user: User;
  accessToken: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    // Keep the user logged in even after a page refresh.
    const token = localStorage.getItem('accessToken');
    if (token) {
      setAccessToken(token);
      // Call the backend /auth/me endpoint to fetch the user information
      fetchUser(token);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch('http://localhost:3000/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUser({
        id: data.sub ?? data.id ?? data.userId ?? 0,
        email: data.email,
        role: data.role,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const login = async (token: string) => {
    localStorage.setItem('accessToken', token);
    setAccessToken(token);
    await fetchUser(token);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
