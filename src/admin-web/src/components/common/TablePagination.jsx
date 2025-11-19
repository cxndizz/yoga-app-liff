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
    <div
      style={{
        marginTop: '16px',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        background: '#f8fafc',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ fontSize: '14px', color: '#475569' }}>
        แสดง {startItem.toLocaleString('th-TH')} - {endItem.toLocaleString('th-TH')} จาก{' '}
        {totalItems.toLocaleString('th-TH')} รายการ
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ต่อหน้า
          <select
            value={safePageSize}
            onChange={handlePageSizeChange}
            style={{
              border: '1px solid #cbd5f5',
              borderRadius: '8px',
              padding: '6px 10px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => handlePageChange(1)}
            disabled={!canGoPrev}
            style={buttonStyle(!canGoPrev)}
          >
            «
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(safePage - 1)}
            disabled={!canGoPrev}
            style={buttonStyle(!canGoPrev)}
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
            style={buttonStyle(!canGoNext)}
          >
            ถัดไป
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(totalPages)}
            disabled={!canGoNext}
            style={buttonStyle(!canGoNext)}
          >
            »
          </button>
        </div>
      </div>
    </div>
  );
}

const buttonStyle = (disabled) => ({
  border: '1px solid #cbd5f5',
  background: disabled ? '#e2e8f0' : '#fff',
  color: disabled ? '#94a3b8' : '#1e293b',
  borderRadius: '8px',
  padding: '6px 12px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  minWidth: '48px',
});

export default TablePagination;
