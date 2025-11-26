import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

const NavLink = ({ to, label, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="nav-link"
  >
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
    <header
      className="card-surface"
      style={{
        position: 'sticky',
        top: 12,
        zIndex: 50,
        margin: '0 auto',
        width: 'min(1200px, 92vw)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.95) 0%, rgba(59, 7, 100, 0.98) 100%)',
        border: '1px solid rgba(196, 181, 253, 0.25)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo Section */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px solid rgba(251, 191, 36, 0.5)',
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.05) 100%)',
            color: '#fbbf24',
            fontWeight: 800,
            fontSize: '1.1rem',
            letterSpacing: '-0.02em',
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.15)',
          }}
        >
          YL
        </div>
        <div>
          <div style={{ 
            fontFamily: 'var(--font-heading)', 
            fontSize: '1.3rem', 
            letterSpacing: '0.01em',
            background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {t('nav.brand')}
          </div>
          <div style={{ color: 'var(--secondary-300)', fontSize: '0.85rem' }}>
            Boutique LIFF Studio
          </div>
        </div>
      </Link>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Toggle menu"
        style={{
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '12px',
          padding: '10px',
          color: '#fbbf24',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          minWidth: 46,
          minHeight: 46,
          fontSize: '1.2rem',
          transition: 'all 0.2s ease',
        }}
        className="only-mobile"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(251, 191, 36, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
        }}
      >
        {open ? '✕' : '☰'}
      </button>

      {/* Desktop Navigation */}
      <nav
        style={{
          display: 'none',
          alignItems: 'center',
          gap: '6px',
        }}
        className="desktop-nav"
      >
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} label={link.label} />
        ))}
        <div style={{ marginLeft: '8px', marginRight: '8px' }}>
          <LanguageSwitcher inline />
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/my-courses')}
          style={{ paddingInline: 20 }}
        >
          {t('nav.myCourses')}
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      {open && (
        <div
          className="card-surface"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            left: 0,
            margin: '0 auto',
            width: 'min(92vw, 320px)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.98) 0%, rgba(59, 7, 100, 0.99) 100%)',
            border: '1px solid rgba(196, 181, 253, 0.25)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            zIndex: 100,
          }}
        >
          {links.map((link) => (
            <NavLink 
              key={link.to} 
              to={link.to} 
              label={link.label} 
              onClick={() => setOpen(false)} 
            />
          ))}
          <div style={{ 
            borderTop: '1px solid rgba(196, 181, 253, 0.15)', 
            paddingTop: '12px',
            marginTop: '4px',
          }}>
            <LanguageSwitcher />
          </div>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => {
              navigate('/my-courses');
              setOpen(false);
            }}
            style={{ marginTop: '4px' }}
          >
            {t('nav.myCourses')}
          </button>
        </div>
      )}
    </header>
  );
}

export default Navbar;