import { useEffect, useState } from 'react';
import { ensureLiffUserSynced } from '../lib/liffAuth';

export const useLiffUser = () => {
  const [state, setState] = useState({ status: 'idle', user: null, profile: null, errorMessage: '' });

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      try {
        setState((prev) => ({ ...prev, status: 'loading', errorMessage: '' }));
        const result = await ensureLiffUserSynced();

        if (!isMounted) return;

        if (result?.pendingRedirect) {
          setState({ status: 'redirecting', user: null, profile: null, errorMessage: '' });
          return;
        }

        if (result?.skip) {
          setState({ status: 'skipped', user: null, profile: null, errorMessage: '' });
          return;
        }

        setState({ status: 'ready', user: result?.user || null, profile: result?.profile || null, errorMessage: '' });
      } catch (err) {
        console.error('LIFF user sync failed', err);
        if (!isMounted) return;
        setState({
          status: 'error',
          user: null,
          profile: null,
          errorMessage: err?.message || 'เชื่อมต่อ LINE ไม่สำเร็จ',
        });
      }
    };

    run();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};

export default useLiffUser;
