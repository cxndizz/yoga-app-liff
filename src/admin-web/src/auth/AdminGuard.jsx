import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearSession, getSessionSnapshot, persistSession } from './session';
import { decodeJwtPayload, isTokenExpired, shouldRefreshToken } from './tokenUtils';

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
  const url = `/admin/login?redirect=${encodeURIComponent(redirectPath)}`;
  navigate(url, { replace: true });
};

const handleUnauthorized = (navigate, location) => {
  clearSession();
  setAxiosAuthHeader(null);
  redirectToLogin(navigate, location);
};

const useAdminAuthorization = (allowedRoles) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState({ status: 'checking', user: null });

  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      setState({ status: 'checking', user: null });
      const { accessToken, refreshToken, user } = getSessionSnapshot();
      if (!accessToken || !refreshToken) {
        handleUnauthorized(navigate, location);
        return;
      }

      let currentAccessToken = accessToken;
      let currentUser = user;
      let payload = decodeJwtPayload(accessToken);

      try {
        if (!payload || isTokenExpired(payload)) {
          const refreshed = await requestRefresh(refreshToken);
          currentAccessToken = refreshed.accessToken;
          currentUser = refreshed.user;
          payload = decodeJwtPayload(refreshed.accessToken);
        } else if (shouldRefreshToken(payload)) {
          try {
            const refreshed = await requestRefresh(refreshToken);
            currentAccessToken = refreshed.accessToken;
            currentUser = refreshed.user;
            payload = decodeJwtPayload(refreshed.accessToken);
          } catch (refreshError) {
            console.warn('Unable to refresh token pre-emptively', refreshError);
          }
        }
      } catch (error) {
        console.warn('Session validation failed', error);
        handleUnauthorized(navigate, location);
        return;
      }

      const resolvedUser = resolveUserFromPayload(payload, currentUser);
      if (!currentAccessToken || !resolvedUser) {
        handleUnauthorized(navigate, location);
        return;
      }

      if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        if (!allowedRoles.includes(resolvedUser.role)) {
          handleUnauthorized(navigate, location);
          return;
        }
      }

      setAxiosAuthHeader(currentAccessToken);

      if (isMounted) {
        setState({ status: 'authorized', user: resolvedUser });
      }
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [allowedRoles, location.pathname, location.search, navigate]);

  return state;
};

const AdminGuard = ({ allowedRoles, children }) => {
  const state = useAdminAuthorization(allowedRoles);

  if (state.status === 'checking') {
    return (
      <div style={{ padding: '48px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        กำลังตรวจสอบสิทธิ์การใช้งาน...
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
