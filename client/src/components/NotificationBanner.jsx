import React from 'react';
import { Radio, AlertTriangle, Bell, X, ChevronRight, Check } from 'lucide-react';

export default function NotificationBanner({ notifications = [], liveAgenda = null, onSelectTab, onDismiss }) {
  if (!notifications.length && !liveAgenda?.nowPerforming) return null;

  // Most urgent active item
  const urgentAlert = notifications.find(n => n.type === 'alert' && !n.is_read);
  const nowPerforming = liveAgenda?.nowPerforming;
  const recentGeneral = notifications.find(n => !n.is_read) || notifications[0];

  return (
    <div className="top-notification-banner">
      <div className="banner-content">
        {urgentAlert ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
            <span style={{
              background: '#EF4444',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 800,
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <AlertTriangle size={12} /> URGENT ALERT
            </span>
            <span style={{ fontWeight: 600 }}>{urgentAlert.title}:</span>
            <span style={{ opacity: 0.9 }}>{urgentAlert.message}</span>
          </div>
        ) : nowPerforming ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <span className="live-pulse">
              <span className="pulse-dot"></span> LIVE ON STAGE
            </span>
            <span style={{ fontWeight: 600 }}>
              Now Performing: "{nowPerforming.title}"
            </span>
            <span style={{ opacity: 0.85, fontSize: '0.8rem' }}>
              — by {nowPerforming.performer_speaker} ({nowPerforming.scheduled_time})
            </span>
            {liveAgenda.nextUp && (
              <span style={{ opacity: 0.7, fontSize: '0.75rem', marginLeft: 'auto' }}>
                Next Up: {liveAgenda.nextUp.title}
              </span>
            )}
          </div>
        ) : recentGeneral ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
            <span style={{
              background: 'rgba(59, 130, 246, 0.3)',
              color: '#93C5FD',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-full)'
            }}>
              <Bell size={12} style={{ display: 'inline', marginRight: '3px' }} /> UPDATE
            </span>
            <span style={{ fontWeight: 600 }}>{recentGeneral.title}:</span>
            <span style={{ opacity: 0.9 }}>{recentGeneral.message}</span>
          </div>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {nowPerforming && onSelectTab && (
            <button
              onClick={() => onSelectTab('agenda')}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem'
              }}
            >
              View Agenda <ChevronRight size={14} />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{
                background: 'transparent',
                color: 'white',
                opacity: 0.6,
                padding: '0.2rem',
                borderRadius: 'var(--radius-full)'
              }}
              title="Dismiss banner"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
