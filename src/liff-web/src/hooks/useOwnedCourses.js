import { useEffect, useState } from 'react';
import { fetchOrdersForUser } from '../lib/orderApi';
import { collectOwnedCourseIds } from '../lib/orderUtils';

const initialState = { checked: false, ownedIds: new Set() };

const useOwnedCourses = (userId) => {
  const [ownership, setOwnership] = useState(initialState);

  useEffect(() => {
    if (!userId) {
      setOwnership({ checked: true, ownedIds: new Set() });
      return undefined;
    }

    let active = true;
    let timeoutId = null;

    timeoutId = setTimeout(() => {
      if (active) {
        console.warn('Ownership check timed out, allowing purchase anyway');
        setOwnership({ checked: true, ownedIds: new Set() });
      }
    }, 6000);

    fetchOrdersForUser(userId)
      .then((orders) => {
        if (!active) return;
        if (timeoutId) clearTimeout(timeoutId);
        const ownedIds = collectOwnedCourseIds(Array.isArray(orders) ? orders : []);
        setOwnership({ checked: true, ownedIds });
      })
      .catch((error) => {
        if (!active) return;
        if (timeoutId) clearTimeout(timeoutId);
        console.error('Failed to fetch orders:', error);
        setOwnership({ checked: true, ownedIds: new Set() });
      });

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [userId]);

  return ownership;
};

export default useOwnedCourses;
