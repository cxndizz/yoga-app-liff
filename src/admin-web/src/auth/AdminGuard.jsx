import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSessionSnapshot, persistSession } from './session';
import { decodeJwtPayload, isTokenExpired, shouldRefreshToken } from './tokenUtils';
import { useAdminAuth } from './AdminAuthContext';

const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const setAxiosAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
};

const requestRefresh = async (refreshToken) => {
  const response = await axios.post(`${apiBase}/admin/auth/refresh`, {
    refreshToken,
  });
  persistSession(response.data || {});
  return response.data || {};
};

const resolveUserFromPayload = (payload, fallbackUser) => {
  if (fallbackUser) {
    return fallbackUser;
  }
  if (!payload) return null;
  return {
    id: payload.sub ? Number(payload.sub) : null,
    role: payload.role,
    permissions: payload.permissions || [],
  };
};

const redirectToLogin = (navigate, location) => {
  const redirectPath = `${location.pathname}${location.search}`;
  const url = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  navigate(url, { replace: true });
};

const handleUnauthorized = (navigate, location, clearSession) => {
  clearSession();
  setAxiosAuthHeader(null);
  redirectToLogin(navigate, location);
};

const fetchCurrentAdmin = async () => {
  const response = await axios.get(`${apiBase}/admin/auth/me`);
  return response.data?.user || null;
};

const useAdminAuthorization = (allowedRoles) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accessToken, refreshToken, user, setSession, clearSession } = useAdminAuth();
  const [state, setState] = useState({ status: 'checking', user: null });
  const isValidatingRef = React.useRef(false);

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      // Prevent multiple concurrent validation attempts
      if (isValidatingRef.current) {
        return;
      }

      isValidatingRef.current = true;
      setState({ status: 'checking', user: null });

      const snapshot = getSessionSnapshot();
      const initialAccessToken = accessToken || snapshot.accessToken;
      const initialRefreshToken = refreshToken || snapshot.refreshToken;
      const initialUser = user || snapshot.user;

      if (!initialAccessToken || !initialRefreshToken) {
        isValidatingRef.current = false;
        handleUnauthorized(navigate, location, clearSession);
        return;
      }

      let currentAccessToken = initialAccessToken;
      let currentRefreshToken = initialRefreshToken;
      let currentUser = initialUser;
      let payload = decodeJwtPayload(initialAccessToken);

      try {
        if (!payload || isTokenExpired(payload)) {
          const refreshed = await requestRefresh(initialRefreshToken);
          currentAccessToken = refreshed.accessToken;
          currentRefreshToken = refreshed.refreshToken || currentRefreshToken;
          currentUser = refreshed.user;
          payload = decodeJwtPayload(refreshed.accessToken);
        } else if (shouldRefreshToken(payload)) {
          try {
            const refreshed = await requestRefresh(initialRefreshToken);
            currentAccessToken = refreshed.accessToken;
            currentRefreshToken = refreshed.refreshToken || currentRefreshToken;
            currentUser = refreshed.user;
            payload = decodeJwtPayload(refreshed.accessToken);
          } catch (refreshError) {
            console.warn('Unable to refresh token pre-emptively', refreshError);
          }
        }
      } catch (error) {
        console.warn('Session validation failed', error);
        isValidatingRef.current = false;
        handleUnauthorized(navigate, location, clearSession);
        return;
      }

      const resolvedUser = resolveUserFromPayload(payload, currentUser);
      if (!currentAccessToken || !resolvedUser) {
        isValidatingRef.current = false;
        handleUnauthorized(navigate, location, clearSession);
        return;
      }

      setAxiosAuthHeader(currentAccessToken);

      let syncedUser = resolvedUser;
      try {
        const latestUser = await fetchCurrentAdmin();
        if (latestUser) {
          syncedUser = latestUser;
        }
      } catch (error) {
        console.warn('Unable to fetch current admin profile', error);
      }

      if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        if (!allowedRoles.includes(syncedUser.role)) {
          isValidatingRef.current = false;
          handleUnauthorized(navigate, location, clearSession);
          return;
        }
      }

      setSession({ accessToken: currentAccessToken, refreshToken: currentRefreshToken, user: syncedUser });

      if (isMounted) {
        setState({ status: 'authorized', user: syncedUser });
      }

      isValidatingRef.current = false;
    };

    validateSession();

    return () => {
      isMounted = false;
      isValidatingRef.current = false;
    };
  }, [accessToken, refreshToken, user]);

  return state;
};

const AdminGuard = ({ allowedRoles, children }) => {
  const state = useAdminAuthorization(allowedRoles);

  if (state.status === 'checking') {
    return (
      <div style={{ 
        padding: '48px', 
        textAlign: 'center', 
        fontFamily: 'system-ui, sans-serif',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ margin: 0, color: '#6b7280', fontSize: '15px' }}>กำลังตรวจสอบสิทธิ์การใช้งาน...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export const withAdminGuard = (Component, options = {}) => {
  const GuardedComponent = (props) => (
    <AdminGuard allowedRoles={options.allowedRoles}>
      <Component {...props} />
    </AdminGuard>
  );
  GuardedComponent.displayName = `withAdminGuard(${Component.displayName || Component.name || 'Component'})`;
  return GuardedComponent;
};

export default AdminGuard;