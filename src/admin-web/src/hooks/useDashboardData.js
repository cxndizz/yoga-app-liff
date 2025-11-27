import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';

import { apiBase } from '../config';
const DEFAULT_INTERVAL = 60_000;

const getErrorMessage = (error) => {
  if (!error) return 'ไม่สามารถโหลดข้อมูลได้';
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  return 'ไม่สามารถโหลดข้อมูลได้';
};

const useDashboardData = ({ autoRefreshMs = DEFAULT_INTERVAL } = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const { on: onSocketEvent } = useSocket();

  const fetchData = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await axios.post(
          `${apiBase}/api/admin/dashboard`,
          {},
          { signal: controller.signal }
        );
        if (!isMountedRef.current) return;
        setData(response.data);
        setLastUpdated(new Date());
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        if (!isMountedRef.current) return;
        setError(getErrorMessage(err));
      } finally {
        if (!isMountedRef.current) return;
        if (!silent) {
          setLoading(false);
        }
      }
    },
    []
  );

  const refresh = useCallback(() => fetchData({ silent: false }), [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefreshMs || typeof window === 'undefined') {
      return undefined;
    }

    const visibilityAvailable = typeof document !== 'undefined' && typeof document.addEventListener === 'function';
    const runSilentRefresh = () => fetchData({ silent: true });

    let timerId = window.setInterval(() => {
      if (visibilityAvailable && document.hidden) {
        return;
      }
      runSilentRefresh();
    }, autoRefreshMs);

    const handleVisibilityChange = () => {
      if (!visibilityAvailable) return;
      if (document.hidden) {
        if (timerId) {
          clearInterval(timerId);
          timerId = null;
        }
      } else {
        runSilentRefresh();
        if (!timerId) {
          timerId = window.setInterval(runSilentRefresh, autoRefreshMs);
        }
      }
    };

    if (visibilityAvailable) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
      if (visibilityAvailable) {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [autoRefreshMs, fetchData]);

  // WebSocket real-time updates
  useEffect(() => {
    if (!onSocketEvent) return undefined;

    console.log('[Dashboard] Setting up WebSocket listeners for real-time updates');

    // Listen for dashboard refresh events
    const unsubscribe = onSocketEvent('dashboard:refresh', () => {
      console.log('[Dashboard] Received dashboard:refresh event - refreshing data');
      fetchData({ silent: true });
    });

    return () => {
      unsubscribe();
    };
  }, [onSocketEvent, fetchData]);

  return { data, loading, error, refresh, lastUpdated };
};

export default useDashboardData;
