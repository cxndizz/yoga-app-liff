import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslatedText } from '../lib/autoTranslate';

const NavLink = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="nav-link"
    style={{
      color: 'inherit',
      textDecoration: 'none',
      fontWeight: 600,
      padding: '10px 12px',
      borderRadius: '12px',
      border: '1px solid transparent',
    }}
  >
    {label}
  </Link>
);

function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const labels = useTranslatedText(
    useMemo(
      () => ({
        home: 'Home',
        courses: 'Courses',
        premium: 'Premium picks',
        buyCourse: 'Buy courses',
        brandTagline: 'Boutique LIFF Studio',
      }),
      [],
    ),
  );

  const links = [
    { to: '/', label: labels.home },
    { to: '/courses', label: labels.courses },
    { to: '/courses?filter=premium', label: labels.premium },
  ];

  return (
    <header
      className="card-surface"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        margin: '0 auto',
        width: 'min(1200px, 92vw)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '1px solid var(--border)',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, rgba(231, 177, 160, 0.35), rgba(231, 177, 160, 0.05))',
            color: '#0b1a3c',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
        >
          YL
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', letterSpacing: '0.01em' }}>
          Yoga Luxe
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{labels.brandTagline}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Toggle menu"
        style={{
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '10px',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          minWidth: 44,
          minHeight: 44,
        }}
        className="only-mobile"
      >
        {open ? '✕' : '☰'}
      </button>

      <nav
        style={{
          display: 'none',
          alignItems: 'center',
          gap: '4px',
        }}
        className="desktop-nav"
      >
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} label={link.label} />
        ))}
        <LanguageSwitcher inline />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/courses')}
          style={{ paddingInline: 18 }}
        >
          {labels.buyCourse}
        </button>
      </nav>

      {open && (
        <div
          className="card-surface"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 10,
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            width: 'min(90vw, 260px)',
          }}
        >
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} label={link.label} onClick={() => setOpen(false)} />
          ))}
          <LanguageSwitcher />
          <button type="button" className="btn btn-primary" onClick={() => navigate('/courses')}>
            {labels.buyCourse}
          </button>
        </div>
      )}
    </header>
  );
}

export default Navbar;
