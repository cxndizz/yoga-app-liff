import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n';

function Footer() {
  const { t } = useI18n();

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
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>Yoga Luxe</div>
        <div style={{ color: 'var(--muted)', marginTop: 4 }}>{t('footer.tagline')}</div>
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
      <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{t('footer.rights')}</div>
    </footer>
  );
}

export default Footer;
