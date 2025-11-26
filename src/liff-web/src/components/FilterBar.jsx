import React from 'react';
import { useTranslation } from 'react-i18next';

function FilterBar({ search, onSearch, category, onCategory, instructor, onInstructor, categories, instructors }) {
  const { t } = useTranslation();

  return (
    <div
      className="card-surface"
      style={{
        padding: '20px',
        display: 'grid',
        gap: '16px',
        gridTemplateColumns: '1fr',
        background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.2) 0%, rgba(59, 7, 100, 0.15) 100%)',
      }}
    >
      {/* Search Input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            background: 'rgba(251, 191, 36, 0.1)',
            display: 'grid',
            placeItems: 'center',
            color: '#fbbf24',
            fontSize: '1.2rem',
            flexShrink: 0,
          }}
        >
          🔍
        </div>
        <div style={{ flex: 1 }}>
          <label 
            htmlFor="search" 
            style={{ 
              display: 'block', 
              color: 'var(--secondary-200)', 
              marginBottom: 8,
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
          >
            {t('filter.searchPlaceholder')}
          </label>
          <input
            id="search"
            className="input"
            placeholder={t('filter.searchHint')}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderColor: 'rgba(196, 181, 253, 0.25)',
            }}
          />
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '14px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(196, 181, 253, 0.1)',
      }}>
        {/* Branch Filter */}
        <div>
          <div style={{ 
            color: 'var(--secondary-200)', 
            marginBottom: 8,
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ color: '#fbbf24' }}>📍</span>
            {t('filter.branch')}
          </div>
          <select 
            className="input" 
            value={category} 
            onChange={(e) => onCategory(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderColor: category 
                ? 'rgba(251, 191, 36, 0.4)' 
                : 'rgba(196, 181, 253, 0.25)',
            }}
          >
            <option value="">{t('filter.allLocations')}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        
        {/* Instructor Filter */}
        <div>
          <div style={{ 
            color: 'var(--secondary-200)', 
            marginBottom: 8,
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ color: '#c4b5fd' }}>👤</span>
            {t('filter.instructor')}
          </div>
          <select 
            className="input" 
            value={instructor} 
            onChange={(e) => onInstructor(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              borderColor: instructor 
                ? 'rgba(251, 191, 36, 0.4)' 
                : 'rgba(196, 181, 253, 0.25)',
            }}
          >
            <option value="">{t('filter.allInstructors')}</option>
            {instructors.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(category || instructor || search) && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(196, 181, 253, 0.1)',
        }}>
          {search && (
            <span 
              className="badge"
              style={{
                background: 'rgba(251, 191, 36, 0.15)',
                borderColor: 'rgba(251, 191, 36, 0.4)',
                color: '#fbbf24',
              }}
            >
              Search: "{search}"
              <button
                type="button"
                onClick={() => onSearch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fbbf24',
                  cursor: 'pointer',
                  padding: '0 0 0 6px',
                  fontSize: '1rem',
                }}
              >
                ×
              </button>
            </span>
          )}
          {category && (
            <span 
              className="badge"
              style={{
                background: 'rgba(196, 181, 253, 0.1)',
                borderColor: 'rgba(196, 181, 253, 0.4)',
              }}
            >
              📍 {category}
              <button
                type="button"
                onClick={() => onCategory('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary-200)',
                  cursor: 'pointer',
                  padding: '0 0 0 6px',
                  fontSize: '1rem',
                }}
              >
                ×
              </button>
            </span>
          )}
          {instructor && (
            <span 
              className="badge"
              style={{
                background: 'rgba(196, 181, 253, 0.1)',
                borderColor: 'rgba(196, 181, 253, 0.4)',
              }}
            >
              👤 {instructor}
              <button
                type="button"
                onClick={() => onInstructor('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--secondary-200)',
                  cursor: 'pointer',
                  padding: '0 0 0 6px',
                  fontSize: '1rem',
                }}
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterBar;