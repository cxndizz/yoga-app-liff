import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import axios from 'axios';

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
  const { t } = useTranslation();
  const [customization, setCustomization] = useState({
    app_name: t('nav.brand'),
    app_description: 'Boutique LIFF Studio',
    logo_url: null,
    logo_initials: 'YL',
    primary_color: '#0b1a3c',
  });

  useEffect(() => {
    const fetchCustomization = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
        const response = await axios.post(`${apiBase}/api/customization/get`);
        if (response.data) {
          setCustomization(response.data);
        }
      } catch (error) {
        console.error('Error fetching customization:', error);
        // Use default values on error
      }
    };
    fetchCustomization();
  }, []);

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
        top: 0,
        zIndex: 30,
        margin: '0 auto',
        width: 'min(1200px, 92vw)',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: 'var(--navy-900)',
        border: '1px solid var(--border)',
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
            background: customization.logo_url
              ? `url(${customization.logo_url}) center/cover`
              : 'linear-gradient(135deg, rgba(231, 177, 160, 0.35), rgba(231, 177, 160, 0.05))',
            color: customization.primary_color,
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
        >
          {!customization.logo_url && customization.logo_initials}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', letterSpacing: '0.01em' }}>
            {customization.app_name}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            {customization.app_description}
          </div>
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
          onClick={() => navigate('/my-courses')}
          style={{ paddingInline: 18 }}
        >
          {t('nav.myCourses')}
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
            background: 'var(--navy-900)',
          }}
        >
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
