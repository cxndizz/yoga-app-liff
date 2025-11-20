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
        padding: '18px',
        borderRadius: '20px',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>{t('nav.brand')}</div>
        <div style={{ color: 'var(--muted)', marginTop: 4 }}>Boutique LIFF Studio • Luxury movement and mindfulness experiences</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/about" className="badge">
          {t('footer.about')}
        </Link>
        <Link to="/contact" className="badge">
          {t('footer.contact')}
        </Link>
        <Link to="/terms" className="badge">
          {t('footer.terms')}
        </Link>
        <Link to="/privacy" className="badge">
          {t('footer.privacy')}
        </Link>
      </div>
      <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('footer.copyright', { year: currentYear })}</div>
    </footer>
  );
}

export default Footer;
