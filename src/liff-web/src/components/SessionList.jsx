import React from 'react';
import { useTranslation } from 'react-i18next';

function SessionList({ sessions, fallbackChannel }) {
  const { t } = useTranslation();

  if (!sessions?.length) {
    return (
      <div 
        className="card-surface" 
        style={{ 
          padding: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 120,
        }}
      >
        <div style={{ color: 'var(--secondary-300)', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.5 }}>📅</div>
          {t('session.noSessions')}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="card-surface" 
      style={{ 
        padding: 20, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 0,
        overflow: 'hidden',
      }}
    >
      {sessions.map((session, index) => (
        <div
          key={session.id}
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 16,
            alignItems: 'center',
            padding: '16px 12px',
            borderBottom: index < sessions.length - 1 
              ? '1px solid rgba(196, 181, 253, 0.12)' 
              : 'none',
            transition: 'background 0.2s ease',
            borderRadius: index === 0 ? '12px 12px 0 0' : index === sessions.length - 1 ? '0 0 12px 12px' : 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(196, 181, 253, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {/* Mode Badge */}
          <div 
            className="badge" 
            style={{ 
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.08))',
              borderColor: 'rgba(251, 191, 36, 0.35)',
              color: '#fbbf24',
              fontWeight: 600,
              minWidth: 80,
              justifyContent: 'center',
            }}
          >
            {session.mode || fallbackChannel || t('course.session')}
          </div>
          
          {/* Session Details */}
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.02rem', color: '#fff' }}>
              {session.topic}
            </div>
            <div style={{ 
              color: 'var(--secondary-300)', 
              fontSize: '0.9rem',
              marginTop: '4px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              alignItems: 'center',
            }}>
              <span style={{ 
                color: 'var(--secondary-200)',
                fontWeight: 500,
              }}>
                📆 {session.date}
              </span>
              {session.time && (
                <>
                  <span style={{ color: 'rgba(196, 181, 253, 0.4)' }}>•</span>
                  <span>🕐 {session.time}</span>
                </>
              )}
            </div>
            {(session.branchName || session.instructorName) && (
              <div style={{ 
                color: 'var(--secondary-300)', 
                fontSize: '0.85rem',
                marginTop: '6px',
              }}>
                {session.branchName && <span>📍 {session.branchName}</span>}
                {session.branchName && session.instructorName && (
                  <span style={{ margin: '0 6px', opacity: 0.5 }}>•</span>
                )}
                {session.instructorName && <span>👤 {session.instructorName}</span>}
              </div>
            )}
          </div>
          
          {/* Availability */}
          <div 
            style={{ 
              textAlign: 'right',
              minWidth: 100,
            }}
          >
            <div 
              className="badge"
              style={{
                background: session.availableSpots != null && session.availableSpots < 5
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(16, 185, 129, 0.15)',
                borderColor: session.availableSpots != null && session.availableSpots < 5
                  ? 'rgba(239, 68, 68, 0.4)'
                  : 'rgba(16, 185, 129, 0.4)',
                color: session.availableSpots != null && session.availableSpots < 5
                  ? '#fca5a5'
                  : '#6ee7b7',
                fontWeight: 600,
              }}
            >
              {session.availableSpots != null
                ? t('access.seatsLeft', { count: session.availableSpots })
                : t('access.openBooking')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SessionList;