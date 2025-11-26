import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAutoTranslate } from '../lib/autoTranslate';

function LanguageSwitcher({ inline = false }) {
  const { language, setLanguage, languageOptions } = useAutoTranslate();
  const { t } = useTranslation();

  return (
    <label
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10, 
        color: inline ? 'var(--secondary-200)' : '#fff', 
        fontWeight: 600,
      }}
    >
      <span 
        style={{ 
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ fontSize: '1rem' }}>🌐</span>
        {t('common.language')}
      </span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="input"
        style={{
          width: inline ? 'auto' : '100%',
          minWidth: 120,
          background: inline 
            ? 'rgba(196, 181, 253, 0.1)' 
            : 'rgba(255, 255, 255, 0.06)',
          borderColor: inline 
            ? 'rgba(196, 181, 253, 0.3)' 
            : 'rgba(196, 181, 253, 0.25)',
          padding: '10px 36px 10px 14px',
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
      >
        {languageOptions.map((opt) => (
          <option 
            key={opt.code} 
            value={opt.code} 
            style={{ 
              color: '#1e1b4b',
              background: '#f5f3ff',
              padding: '8px',
            }}
          >
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default LanguageSwitcher;