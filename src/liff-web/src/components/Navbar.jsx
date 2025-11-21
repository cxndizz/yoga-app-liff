import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const NavLink = ({ to, label, onClick }) => (
  <Link to={to} onClick={onClick} className="nav-link">
    {label}
  </Link>
);

function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/courses', label: t('nav.courses') },
    { to: '/courses?filter=premium', label: t('course.premium') },
  ];

  return (
    <header className="card-surface navbar">
      <div className="nav-brand">
        <div className="nav-brand-mark" aria-hidden>
          YL
        </div>
        <div className="nav-meta">
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', letterSpacing: '0.01em' }}>
            {t('nav.brand')}
          </div>
          <div className="subtitle">Boutique LIFF Studio</div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Toggle menu"
        className="only-mobile btn btn-outline"
        style={{ minWidth: 44, minHeight: 44, padding: '10px 12px' }}
      >
        {open ? '✕' : '☰'}
      </button>

      <nav className="desktop-nav" aria-label={t('nav.primary', { defaultValue: 'Main navigation' })}>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} label={link.label} />
        ))}
        <LanguageSwitcher inline />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/my-courses')}
          style={{ paddingInline: 18 }}
        >
          {t('nav.myCourses')}
        </button>
      </nav>

      {open && (
        <div className="card-surface nav-drawer" role="menu">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} label={link.label} onClick={() => setOpen(false)} />
          ))}
          <LanguageSwitcher />
          <button type="button" className="btn btn-primary" onClick={() => navigate('/my-courses')}>
            {t('nav.myCourses')}
          </button>
        </div>
      )}
    </header>
  );
}

export default Navbar;
