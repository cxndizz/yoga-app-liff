import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { placeholderImage } from '../lib/formatters';
import { useI18n } from '../lib/i18n';

function HeroCarousel({ slides = [], isLoading = false }) {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    if (slides.length === 0) return undefined;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (isLoading) {
    return (
      <section className="card-surface" style={{ padding: 18, borderRadius: 28, minHeight: 240 }}>
        <div className="helper-text">{t('home.loading')}</div>
      </section>
    );
  }

  if (!slides.length) {
    return (
      <section className="card-surface" style={{ padding: 18, borderRadius: 28, minHeight: 240 }}>
        <div className="helper-text">{t('home.empty')}</div>
      </section>
    );
  }

  return (
    <section
      className="card-surface"
      style={{
        padding: '18px',
        borderRadius: '28px',
        overflow: 'hidden',
        position: 'relative',
        minHeight: 360,
      }}
    >
      {slides.map((slide, index) => (
        <article
          key={slide.id}
          aria-hidden={active !== index}
          style={{
            display: active === index ? 'grid' : 'none',
            gridTemplateColumns: '1fr',
            gap: 18,
            alignItems: 'center',
          }}
        >
          <div className="hero-grid">
            <div>
              <div style={{ color: 'var(--rose)', fontWeight: 600, letterSpacing: '0.12em', fontSize: '0.85rem' }}>
                {t('hero.signature')}
              </div>
              <h1
                style={{
                  margin: '12px 0 10px',
                  fontSize: '2rem',
                  lineHeight: 1.2,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.02em',
                }}
              >
                {slide.title}
              </h1>
              <p style={{ color: '#dbe2ef', margin: '0 0 12px', fontSize: '1.02rem' }}>{slide.subtitle}</p>
              <div style={{ color: 'var(--muted)', marginBottom: 12 }}>
                {slide.branchName && <span className="badge">{slide.branchName}</span>}
                {slide.channel && <span className="badge">{slide.channel}</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/courses')}>
                  {slide.ctaLabel}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => navigate('/courses?filter=premium')}>
                  {t('hero.secondaryCta')}
                </button>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 10,
                  background: 'linear-gradient(135deg, rgba(231, 177, 160, 0.35), rgba(12, 20, 51, 0.8))',
                  borderRadius: '24px',
                  filter: 'blur(18px)',
                  transform: 'scale(0.96)',
                  zIndex: 0,
                }}
              />
              <img
                src={slide.image || placeholderImage}
                alt={slide.title}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  boxShadow: 'var(--shadow-soft)',
                  position: 'relative',
                  zIndex: 1,
                  objectFit: 'cover',
                  minHeight: 220,
                  maxHeight: 360,
                }}
              />
            </div>
          </div>
        </article>
      ))}

      <div
        style={{
          display: 'flex',
          gap: 10,
          position: 'absolute',
          bottom: 18,
          right: 18,
        }}
      >
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setActive(index)}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              border: '1px solid var(--rose)',
              background: active === index ? 'var(--rose)' : 'transparent',
              opacity: active === index ? 1 : 0.6,
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </section>
  );
}

export default HeroCarousel;
