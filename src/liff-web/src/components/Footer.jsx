import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="card-surface footer" aria-label={t('footer.navigation', { defaultValue: 'Footer navigation' })}>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>{t('nav.brand')}</div>
        <div className="helper-text" style={{ marginTop: 4 }}>
          Boutique LIFF Studio • Luxury movement and mindfulness experiences
        </div>
      </div>
      <div className="footer-links">
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
      <div className="footer-note">{t('footer.copyright', { year: currentYear })}</div>
    </footer>
  );
}

export default Footer;
