import React, { useState } from 'react';
import { Radio, Play, CheckCircle2, Clock, AlertCircle, Sparkles, User, Shield, ChevronUp, ChevronDown } from 'lucide-react';
import { api } from '../services/api';

export default function LiveAgendaView({ agendaData = { items: [], nowPerforming: null, nextUp: null }, onRefresh, currentUser }) {
  const [loadingId, setLoadingId] = useState(null);
  const { items = [], nowPerforming, nextUp } = agendaData;

  const isControllerOrAdmin = currentUser?.role === 'live_agenda_controller' || currentUser?.role === 'admin';

  const handleSetStatus = async (id, status) => {
    setLoadingId(id);
    try {
      await api.updateAgendaStatus(id, status);
      onRefresh();
    } catch (err) {
      alert('Error updating live agenda status');
    } finally {
      setLoadingId(null);
    }
  };

  const handleAddDelay = async (id, minutes) => {
    setLoadingId(id);
    try {
      await api.delayAgendaItem(id, minutes);
      onRefresh();
    } catch (err) {
      alert('Error updating delay');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-black)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Radio size={24} color="#EF4444" /> Live Event Agenda & Stage Tracker
          </h1>
          <p style={{ color: 'var(--secondary-gray)', fontSize: '0.875rem' }}>
            Real-time live performance status updated instantly by the student agenda controller (FR-9.1 – FR-9.5)
          </p>
        </div>

        {/* Controller Access Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isControllerOrAdmin ? (
            <span style={{
              background: '#FEF3C7',
              color: '#B45309',
              border: '1px solid #FCD34D',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <Shield size={14} /> Live Controller Mode Active
            </span>
          ) : (
            <span style={{
              background: 'var(--surface-hover)',
              color: 'var(--secondary-gray)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 600
            }}>
              Attendee Real-Time View
            </span>
          )}
        </div>
      </div>

      {/* Hero Live Cards: NOW PERFORMING and NEXT UP (FR-9.4) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* NOW PERFORMING CARD */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #111827 0%, #1e293b 100%)',
          color: 'white',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span className="live-pulse">
              <span className="pulse-dot"></span> NOW PERFORMING ON STAGE
            </span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
              Auditorium Main Stage
            </span>
          </div>

          {nowPerforming ? (
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '0.5rem', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                {nowPerforming.title}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60A5FA', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                <User size={16} /> {nowPerforming.performer_speaker}
              </div>
              <div style={{ fontSize: '0.825rem', opacity: 0.85, lineHeight: 1.4, marginBottom: '1rem' }}>
                {nowPerforming.notes || 'In progress right now. Head over to main stage to catch this segment!'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.8rem', opacity: 0.9 }}>
                <span>Scheduled: <strong>{nowPerforming.scheduled_time}</strong></span>
                <span>Duration: <strong>{nowPerforming.duration_minutes}m</strong></span>
                {nowPerforming.delay_minutes > 0 && (
                  <span style={{ color: '#F87171', fontWeight: 700 }}>
                    Delayed +{nowPerforming.delay_minutes}m
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', opacity: 0.7 }}>
              No performance currently active on stage.
            </div>
          )}
        </div>

        {/* NEXT UP CARD */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--accent-blue)',
                background: 'var(--accent-blue-subtle)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)'
              }}>
                ⏳ NEXT UP IN QUEUE
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--secondary-gray)' }}>
                Upcoming segment
              </span>
            </div>

            {nextUp ? (
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-black)', marginBottom: '0.4rem' }}>
                  {nextUp.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary-gray)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  <User size={15} color="var(--accent-blue)" /> {nextUp.performer_speaker}
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--secondary-gray)', lineHeight: 1.4 }}>
                  {nextUp.notes || 'Stage crew is preparing equipment for this upcoming performance.'}
                </p>
              </div>
            ) : (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--secondary-gray)' }}>
                No further items queued on the agenda.
              </div>
            )}
          </div>

          {nextUp && (
            <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--secondary-gray)' }}>
                Scheduled for: <strong>{nextUp.scheduled_time}</strong>
              </span>
              {isControllerOrAdmin && (
                <button
                  onClick={() => handleSetStatus(nextUp.id, 'now_performing')}
                  className="btn-primary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                >
                  <Play size={13} /> Bring On Stage Now
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full Live Agenda Timeline & Controller Actions (FR-9.3, FR-9.5) */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={18} color="var(--accent-blue)" /> Complete Event Running Order ({items.length} Segments)
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--secondary-gray)' }}>
            Real-time synchronization across attendees
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {items.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--secondary-gray)', fontSize: '0.875rem' }}>
              No stage agenda items scheduled yet for this event.
            </div>
          ) : (
            items.map((item, index) => {
            const isLive = item.status === 'now_performing';
            const isCompleted = item.status === 'completed';
            const isDelayed = item.status === 'delayed';

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: isLive ? 'rgba(239, 68, 68, 0.05)' : isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-white)',
                  border: isLive ? '2px solid #EF4444' : isCompleted ? '1px solid #A7F3D0' : '1px solid var(--border-color)',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                {/* Order & Time */}
                <div style={{ minWidth: '110px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-gray)' }}>
                    Item #{index + 1}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary-black)', marginTop: '0.1rem' }}>
                    {item.scheduled_time}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--secondary-gray)' }}>
                    {item.duration_minutes} min duration
                  </div>
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-black)' }}>
                      {item.title}
                    </h4>
                    {isLive && (
                      <span className="live-pulse" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                        Now Performing
                      </span>
                    )}
                    {isCompleted && (
                      <span className="badge badge-green" style={{ fontSize: '0.65rem' }}>
                        <CheckCircle2 size={11} /> Completed
                      </span>
                    )}
                    {isDelayed && (
                      <span className="badge badge-orange" style={{ fontSize: '0.65rem' }}>
                        Delayed +{item.delay_minutes}m
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.825rem', color: 'var(--secondary-gray)' }}>
                    Performer: <strong style={{ color: 'var(--primary-black)' }}>{item.performer_speaker}</strong>
                    {item.notes && <span style={{ marginLeft: '0.5rem', fontStyle: 'italic' }}>— {item.notes}</span>}
                  </div>
                </div>

                {/* Live Controller Buttons (FR-9.3, FR-9.5) */}
                {isControllerOrAdmin && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {!isLive && !isCompleted && (
                      <button
                        onClick={() => handleSetStatus(item.id, 'now_performing')}
                        disabled={loadingId === item.id}
                        className="btn-primary"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                        title="Set as Now Performing"
                      >
                        <Play size={13} /> Start Live
                      </button>
                    )}

                    {isLive && (
                      <button
                        onClick={() => handleSetStatus(item.id, 'completed')}
                        disabled={loadingId === item.id}
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', background: '#ECFDF5', color: '#065F46', borderColor: '#A7F3D0' }}
                        title="Mark Finished"
                      >
                        <CheckCircle2 size={13} /> Finish Item
                      </button>
                    )}

                    <button
                      onClick={() => handleAddDelay(item.id, 5)}
                      disabled={loadingId === item.id}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.55rem', fontSize: '0.72rem' }}
                      title="Add 5 Minutes Delay"
                    >
                      +5m
                    </button>
                    <button
                      onClick={() => handleAddDelay(item.id, 10)}
                      disabled={loadingId === item.id}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.55rem', fontSize: '0.72rem' }}
                      title="Add 10 Minutes Delay"
                    >
                      +10m
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
}
