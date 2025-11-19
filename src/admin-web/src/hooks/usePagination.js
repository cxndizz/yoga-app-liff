import { useCallback, useEffect, useMemo, useState } from 'react';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const usePagination = (items = [], { initialPageSize = 10 } = {}) => {
  const safeItems = Array.isArray(items) ? items : [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = safeItems.length;
  const safePageSize = pageSize > 0 ? pageSize : 10;
  const totalPages = Math.max(1, Math.ceil(Math.max(totalItems, 0) / safePageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * safePageSize;
    return safeItems.slice(startIndex, startIndex + safePageSize);
  }, [safeItems, currentPage, safePageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const goToPage = useCallback(
    (nextPage) => {
      setPage((prev) => {
        if (typeof nextPage === 'number') {
          return clamp(nextPage, 1, totalPages);
        }
        return clamp(prev, 1, totalPages);
      });
    },
    [totalPages]
  );

  const changePageSize = useCallback((nextSize) => {
    const normalized = Number(nextSize);
    setPageSize(Number.isFinite(normalized) && normalized > 0 ? normalized : initialPageSize);
    setPage(1);
  }, [initialPageSize]);

  const resetPage = useCallback(() => setPage(1), []);

  return {
    page: currentPage,
    pageSize: safePageSize,
    totalItems,
    totalPages,
    paginatedItems,
    setPage: goToPage,
    setPageSize: changePageSize,
    resetPage,
  };
};

export default usePagination;
