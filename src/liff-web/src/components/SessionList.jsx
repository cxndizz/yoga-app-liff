import React, { useMemo } from 'react';
import { useTranslatedText } from '../lib/autoTranslate';

function SessionList({ sessions, fallbackChannel }) {
  const labels = useTranslatedText(
    useMemo(
      () => ({
        none: 'No sessions available yet',
        available: '{count} seats left',
        open: 'Open for booking',
        topicFallback: 'Session',
      }),
      [],
    ),
  );

  if (!sessions?.length) {
    return (
      <div className="card-surface" style={{ padding: 16 }}>
        <div style={{ color: 'var(--muted)' }}>{labels.none}</div>
      </div>
    );
  }

  return (
    <div className="card-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sessions.map((session) => (
        <div
          key={session.id}
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 12,
            alignItems: 'center',
            padding: '12px 10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div className="badge" style={{ background: 'rgba(231, 177, 160, 0.18)', color: '#0b1a3c' }}>
            {session.mode || fallbackChannel || labels.topicFallback}
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>{session.topic}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
              {session.date} {session.time && `· ${session.time}`}
            </div>
            {(session.branchName || session.instructorName) && (
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                {session.branchName}
                {session.branchName && session.instructorName ? ' • ' : ''}
                {session.instructorName}
              </div>
            )}
          </div>
          <div style={{ color: 'var(--rose)', fontWeight: 700 }}>
            {session.availableSpots != null
              ? labels.available.replace('{count}', session.availableSpots)
              : labels.open}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SessionList;
