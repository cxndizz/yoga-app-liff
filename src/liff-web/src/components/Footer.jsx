import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
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
        <div style={{ color: 'var(--muted)', marginTop: 4 }}>
          Boutique LIFF Studio • Luxury movement and mindfulness experiences
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
        <Link to="/about" className="badge">
          About
        </Link>
        <Link to="/contact" className="badge">
          Contact
        </Link>
        <Link to="/terms" className="badge">
          Terms
        </Link>
        <Link to="/privacy" className="badge">
          Privacy
        </Link>
      </div>
      <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>© 2024 Yoga Luxe LIFF. All rights reserved.</div>
    </footer>
  );
}

export default Footer;
