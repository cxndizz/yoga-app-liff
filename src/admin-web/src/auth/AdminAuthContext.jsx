import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession as clearStoredSession, getSessionSnapshot, persistSession } from './session';

const initialSession = () => ({
  accessToken: null,
  refreshToken: null,
  user: null,
});

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => ({ ...initialSession(), ...getSessionSnapshot() }));

  useEffect(() => {
    const handleStorage = () => {
      setSession((prev) => ({ ...prev, ...getSessionSnapshot() }));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updateSession = (nextSession = {}) => {
    const merged = {
      accessToken: typeof nextSession.accessToken !== 'undefined' ? nextSession.accessToken : session.accessToken,
      refreshToken: typeof nextSession.refreshToken !== 'undefined' ? nextSession.refreshToken : session.refreshToken,
      user: typeof nextSession.user !== 'undefined' ? nextSession.user : session.user,
    };
    persistSession(merged);
    setSession(merged);
  };

  const clearSession = () => {
    clearStoredSession();
    setSession(initialSession());
  };

  const value = useMemo(
    () => ({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      user: session.user,
      role: session.user?.role || null,
      setSession: updateSession,
      clearSession,
    }),
    [session]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
