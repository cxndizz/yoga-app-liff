import React, { useMemo } from 'react';
import { useAutoTranslate, useTranslatedText } from '../lib/autoTranslate';

function LanguageSwitcher({ inline = false }) {
  const { language, setLanguage, languageOptions } = useAutoTranslate();
  const labels = useTranslatedText(
    useMemo(
      () => ({
        language: 'Language',
      }),
      [],
    ),
  );

  return (
    <label
      style={{ display: 'flex', alignItems: 'center', gap: 8, color: inline ? 'inherit' : '#fff', fontWeight: 600 }}
    >
      <span style={{ fontSize: '0.95rem' }}>{labels.language}</span>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="input"
        style={{
          width: inline ? 'auto' : '100%',
          minWidth: 120,
          background: inline ? 'rgba(255,255,255,0.08)' : undefined,
          borderColor: 'rgba(255,255,255,0.2)',
        }}
      >
        {languageOptions.map((opt) => (
          <option key={opt.code} value={opt.code} style={{ color: '#000' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default LanguageSwitcher;
