import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslatedText } from '../lib/autoTranslate';

function Footer() {
  const labels = useTranslatedText(
    useMemo(
      () => ({
        tagline: 'Boutique LIFF Studio • Luxury movement and mindfulness experiences',
        about: 'About',
        contact: 'Contact',
        terms: 'Terms',
        privacy: 'Privacy',
        rights: '© 2024 Yoga Luxe LIFF. All rights reserved.',
      }),
      [],
    ),
  );

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
        <div style={{ color: 'var(--muted)', marginTop: 4 }}>{labels.tagline}</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/about" className="badge">
          {labels.about}
        </Link>
        <Link to="/contact" className="badge">
          {labels.contact}
        </Link>
        <Link to="/terms" className="badge">
          {labels.terms}
        </Link>
        <Link to="/privacy" className="badge">
          {labels.privacy}
        </Link>
      </div>
      <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{labels.rights}</div>
    </footer>
  );
}

export default Footer;
