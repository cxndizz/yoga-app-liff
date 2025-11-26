import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { placeholderImage } from '../lib/formatters';

function HeroCarousel({ slides = [], isLoading = false, labels }) {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  const mergedLabels = useMemo(
    () => ({
      loading: 'Loading courses...',
      empty: 'No courses are open for booking yet',
      signature: 'SIGNATURE EXPERIENCE',
      secondaryCta: 'Find the right course',
      ...(labels || {}),
    }),
    [labels],
  );

  useEffect(() => {
    if (slides.length === 0) return undefined;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (isLoading) {
    return (
      <section 
        className="card-surface loading-shimmer" 
        style={{ 
          padding: 24, 
          borderRadius: 28, 
          minHeight: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="helper-text" style={{ fontSize: '1rem' }}>{mergedLabels.loading}</div>
      </section>
    );
  }

  if (!slides.length) {
    return (
      <section 
        className="card-surface" 
        style={{ 
          padding: 24, 
          borderRadius: 28, 
          minHeight: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.3) 0%, rgba(59, 7, 100, 0.2) 100%)',
        }}
      >
        <div className="helper-text" style={{ fontSize: '1rem' }}>{mergedLabels.empty}</div>
      </section>
    );
  }

  return (
    <section
      className="card-surface"
      style={{
        padding: '24px',
        borderRadius: '28px',
        overflow: 'hidden',
        position: 'relative',
        minHeight: 380,
        background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.4) 0%, rgba(59, 7, 100, 0.3) 100%)',
      }}
    >
      {slides.map((slide, index) => (
        <article
          key={slide.id}
          aria-hidden={active !== index}
          style={{
            display: active === index ? 'grid' : 'none',
            gridTemplateColumns: '1fr',
            gap: 24,
            alignItems: 'center',
            animation: active === index ? 'fadeIn 0.5s ease-out' : undefined,
          }}
        >
          <div className="hero-grid">
            {/* Text Content */}
            <div>
              <div style={{ 
                color: '#fbbf24', 
                fontWeight: 700, 
                letterSpacing: '0.15em', 
                fontSize: '0.85rem',
                marginBottom: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{ 
                  width: '32px', 
                  height: '2px', 
                  background: '#fbbf24',
                  borderRadius: '2px',
                }} />
                {mergedLabels.signature}
              </div>
              <h1
                style={{
                  margin: '12px 0 14px',
                  fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                  lineHeight: 1.15,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.01em',
                  background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {slide.title}
              </h1>
              <p style={{ 
                color: 'var(--secondary-200)', 
                margin: '0 0 16px', 
                fontSize: '1.05rem',
                lineHeight: 1.6,
                maxWidth: '500px',
              }}>
                {slide.subtitle}
              </p>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '10px', 
                marginBottom: 18,
              }}>
                {slide.branchName && (
                  <span 
                    className="badge"
                    style={{
                      background: 'rgba(251, 191, 36, 0.15)',
                      borderColor: 'rgba(251, 191, 36, 0.4)',
                      color: '#fbbf24',
                    }}
                  >
                    📍 {slide.branchName}
                  </span>
                )}
                {slide.channel && (
                  <span 
                    className="badge"
                    style={{
                      background: 'rgba(196, 181, 253, 0.1)',
                      borderColor: 'rgba(196, 181, 253, 0.3)',
                    }}
                  >
                    {slide.channel}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => navigate('/courses')}
                  style={{ 
                    padding: '14px 28px',
                    fontSize: '1rem',
                  }}
                >
                  {slide.ctaLabel}
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => navigate('/courses?filter=premium')}
                  style={{ 
                    padding: '14px 24px',
                  }}
                >
                  {mergedLabels.secondaryCta}
                </button>
              </div>
            </div>
            
            {/* Image */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 10,
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(76, 29, 149, 0.4))',
                  borderRadius: '24px',
                  filter: 'blur(24px)',
                  transform: 'scale(0.95)',
                  zIndex: 0,
                }}
              />
              <img
                src={slide.image || placeholderImage}
                alt={slide.title}
                style={{
                  width: '100%',
                  borderRadius: '20px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  zIndex: 1,
                  objectFit: 'cover',
                  minHeight: 240,
                  maxHeight: 400,
                  border: '1px solid rgba(196, 181, 253, 0.2)',
                }}
              />
            </div>
          </div>
        </article>
      ))}

      {/* Slide Indicators */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          position: 'absolute',
          bottom: 24,
          right: 24,
        }}
      >
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setActive(index)}
            style={{
              width: active === index ? 28 : 12,
              height: 12,
              borderRadius: '6px',
              border: '1px solid',
              borderColor: active === index ? '#fbbf24' : 'rgba(196, 181, 253, 0.4)',
              background: active === index 
                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
                : 'rgba(196, 181, 253, 0.15)',
              opacity: active === index ? 1 : 0.7,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </section>
  );
}

export default HeroCarousel;