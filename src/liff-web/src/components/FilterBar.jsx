import React from 'react';
import { useTranslation } from 'react-i18next';

function FilterBar({ search, onSearch, category, onCategory, instructor, onInstructor, categories, instructors }) {
  const { t } = useTranslation();

  return (
    <div
      className="card-surface"
      style={{
        padding: '14px',
        display: 'grid',
        gap: '12px',
        gridTemplateColumns: '1fr',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--rose)',
          }}
        >
          🔍
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="search" style={{ display: 'block', color: 'var(--muted)', marginBottom: 6 }}>
            {t('filter.searchPlaceholder')}
          </label>
          <input
            id="search"
            className="input"
            placeholder={t('filter.searchHint')}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
        <div>
          <div style={{ color: 'var(--muted)', marginBottom: 6 }}>{t('filter.branch')}</div>
          <select className="input" value={category} onChange={(e) => onCategory(e.target.value)}>
            <option value="">{t('filter.allLocations')}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ color: 'var(--muted)', marginBottom: 6 }}>{t('filter.instructor')}</div>
          <select className="input" value={instructor} onChange={(e) => onInstructor(e.target.value)}>
            <option value="">{t('filter.allInstructors')}</option>
            {instructors.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;
