import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="card-surface"
      style={{
        width: 'min(1200px, 92vw)',
        margin: '48px auto 24px',
        padding: '24px',
        borderRadius: '20px',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 16,
        background: 'linear-gradient(135deg, rgba(146, 64, 14, 0.1) 0%, rgba(76, 29, 149, 0.15) 100%)',
        border: '1px solid rgba(146, 64, 14, 0.2)',
      }}
    >
      {/* Brand Section */}
      <div>
        <div style={{ 
          fontFamily: 'var(--font-heading)', 
          fontSize: '1.25rem',
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {t('nav.brand')}
        </div>
        <div style={{ color: 'var(--secondary-300)', marginTop: 6, lineHeight: 1.5 }}>
          Boutique LIFF Studio • Luxury movement and mindfulness experiences
        </div>
      </div>
      
      {/* Links Section */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '10px',
        paddingTop: '12px',
        borderTop: '1px solid rgba(146, 64, 14, 0.15)',
      }}>
        <Link 
          to="/about" 
          className="badge"
          style={{
            background: 'rgba(146, 64, 14, 0.1)',
            borderColor: 'rgba(146, 64, 14, 0.3)',
            color: '#fcd34d',
            transition: 'all 0.2s ease',
          }}
        >
          {t('footer.about')}
        </Link>
        <Link 
          to="/contact" 
          className="badge"
          style={{
            background: 'rgba(146, 64, 14, 0.1)',
            borderColor: 'rgba(146, 64, 14, 0.3)',
            color: '#fcd34d',
            transition: 'all 0.2s ease',
          }}
        >
          {t('footer.contact')}
        </Link>
        <Link 
          to="/terms" 
          className="badge"
          style={{
            background: 'rgba(196, 181, 253, 0.08)',
            borderColor: 'rgba(196, 181, 253, 0.25)',
            color: 'var(--secondary-200)',
          }}
        >
          {t('footer.terms')}
        </Link>
        <Link 
          to="/privacy" 
          className="badge"
          style={{
            background: 'rgba(196, 181, 253, 0.08)',
            borderColor: 'rgba(196, 181, 253, 0.25)',
            color: 'var(--secondary-200)',
          }}
        >
          {t('footer.privacy')}
        </Link>
      </div>
      
      {/* Copyright Section */}
      <div style={{ 
        color: 'var(--secondary-300)', 
        fontSize: '0.875rem',
        paddingTop: '12px',
        borderTop: '1px solid rgba(146, 64, 14, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{ color: '#b45309' }}>●</span>
        {t('footer.copyright', { year: currentYear })}
      </div>
    </footer>
  );
}

export default Footer;