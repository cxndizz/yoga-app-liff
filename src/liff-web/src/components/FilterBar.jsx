import React, { useMemo } from 'react';
import { useTranslatedText } from '../lib/autoTranslate';

function FilterBar({ search, onSearch, category, onCategory, instructor, onInstructor, categories, instructors }) {
  const labels = useTranslatedText(
    useMemo(
      () => ({
        searchLabel: 'Search course name or keywords',
        searchPlaceholder: 'Try Yin, Mobility, Meditation',
        branchLabel: 'Branch / Location',
        branchAll: 'All locations',
        instructorLabel: 'Instructor',
        instructorAll: 'All instructors',
      }),
      [],
    ),
  );

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
            {labels.searchLabel}
          </label>
          <input
            id="search"
            className="input"
            placeholder={labels.searchPlaceholder}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
        <div>
          <div style={{ color: 'var(--muted)', marginBottom: 6 }}>{labels.branchLabel}</div>
          <select className="input" value={category} onChange={(e) => onCategory(e.target.value)}>
            <option value="">{labels.branchAll}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ color: 'var(--muted)', marginBottom: 6 }}>{labels.instructorLabel}</div>
          <select className="input" value={instructor} onChange={(e) => onInstructor(e.target.value)}>
            <option value="">{labels.instructorAll}</option>
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
