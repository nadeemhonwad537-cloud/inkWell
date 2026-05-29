import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('inkwell_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await authAPI.me();
      setUser(data.user);
    } catch {
      localStorage.removeItem('inkwell_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const signin = async (email, password) => {
    const { data } = await authAPI.signin({ email, password });
    localStorage.setItem('inkwell_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (name, email, password) => {
    const { data } = await authAPI.signup({ name, email, password });
    localStorage.setItem('inkwell_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const signout = () => {
    localStorage.removeItem('inkwell_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signin, signup, signout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
