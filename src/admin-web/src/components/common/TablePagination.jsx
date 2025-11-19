import React from 'react';

function TablePagination({
  page = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}) {
  const safePageSize = pageSize > 0 ? pageSize : 10;
  const totalPages = Math.max(1, Math.ceil(Math.max(totalItems, 0) / safePageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(totalItems, safePage * safePageSize);
  const canGoPrev = safePage > 1;
  const canGoNext = safePage < totalPages;

  const handlePageChange = (nextPage) => {
    if (typeof onPageChange === 'function') {
      onPageChange(nextPage);
    }
  };

  const handlePageSizeChange = (event) => {
    const nextSize = Number(event.target.value) || safePageSize;
    if (typeof onPageSizeChange === 'function') {
      onPageSizeChange(nextSize);
    }
  };

  return (
    <div className="table-pagination">
      <div className="table-pagination__info">
        แสดง {startItem.toLocaleString('th-TH')} - {endItem.toLocaleString('th-TH')} จาก{' '}
        {totalItems.toLocaleString('th-TH')} รายการ
      </div>

      <div className="table-pagination__controls">
        <label className="table-pagination__page-size">
          ต่อหน้า
          <select
            value={safePageSize}
            onChange={handlePageSizeChange}
            className="table-pagination__select"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="table-pagination__buttons">
          <button
            type="button"
            onClick={() => handlePageChange(1)}
            disabled={!canGoPrev}
            className="table-pagination__button"
          >
            «
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(safePage - 1)}
            disabled={!canGoPrev}
            className="table-pagination__button"
          >
            ก่อนหน้า
          </button>
          <span style={{ fontSize: '14px', color: '#334155', minWidth: '80px', textAlign: 'center' }}>
            หน้า {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(safePage + 1)}
            disabled={!canGoNext}
            className="table-pagination__button"
          >
            ถัดไป
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(totalPages)}
            disabled={!canGoNext}
            className="table-pagination__button"
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}

export default TablePagination;
