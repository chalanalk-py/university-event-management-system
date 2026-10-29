import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  MapPin,
  Clock,
  Users,
  DollarSign,
  ArrowRight,
  PlusCircle,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search as SearchIcon
} from 'lucide-react';
import { api } from '../services/api';

export default function EventSelectPage({ currentUser, onSelectEvent, onLogout, onPlanEvent }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Plan Event modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [planSuccess, setPlanSuccess] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [totalBudget, setTotalBudget] = useState('');

  const openCreateModal = () => {
    setEventTitle('');
    setEventDescription('');
    setVenue('');
    setEventDate('');
    setStartTime('');
    setEndTime('');
    setTotalBudget('');
    setPlanError('');
    setPlanSuccess('');
    setShowPlanModal(true);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const evList = await api.getEvents();
      if (evList && evList.length) setEvents(evList);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(ev =>
    ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.venue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlanEvent = async (e) => {
    e.preventDefault();
    setPlanError('');
    setPlanLoading(true);
    try {
      const res = await api.createEvent({
        userId: currentUser.id,
        eventTitle,
        eventDescription,
        venue,
        eventDate,
        startTime,
        endTime,
        totalBudget
      });
      setPlanSuccess(`Event "${res.event.title}" created successfully!`);
      setTimeout(() => {
        setShowPlanModal(false);
        onPlanEvent(res.event);
      }, 700);
    } catch (err) {
      setPlanError(err.message || 'Failed to create event.');
    } finally {
      setPlanLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return { bg: 'var(--success-subtle)', color: 'var(--success)', border: 'rgba(16, 185, 129, 0.3)' };
      case 'completed': return { bg: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)', border: 'rgba(59, 130, 246, 0.3)' };
      case 'cancelled': return { bg: 'var(--danger-subtle)', color: 'var(--danger)', border: 'rgba(239, 68, 68, 0.3)' };
      default: return { bg: 'var(--surface-hover)', color: 'var(--secondary-gray)', border: 'var(--border-color)' };
    }
  };

  return (
    <div className="event-select-page">
      <div className="event-select-container">
        {/* Header */}
        <div className="event-select-header">
          <div className="event-select-brand">
            <div className="brand-logo-icon" style={{ width: '42px', height: '42px' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div className="brand-title" style={{ fontSize: '1.5rem' }}>
                Uni<span style={{ color: 'var(--accent-blue)' }}>Sphere</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--secondary-gray)' }}>
                Select an event to manage
              </div>
            </div>
          </div>
          <div className="event-select-user-info">
            <div className="event-select-user-badge">
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-full)',
                  background: currentUser.avatar_color || 'var(--primary-black)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}
              >
                {(currentUser.full_name || currentUser.username).slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  {currentUser.full_name || currentUser.username}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-gray)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ShieldCheck size={12} />
                  {currentUser.role.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
            <button onClick={onLogout} className="btn-secondary" style={{ padding: '0.5rem 0.8rem' }} title="Log out">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="event-select-actions">
          <div className="event-search-wrapper">
            <SearchIcon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-gray)' }} />
            <input
              type="text"
              placeholder="Search events by name or venue..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input event-search-input"
            />
          </div>
          {(currentUser.role === 'admin') && (
            <button onClick={openCreateModal} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
              <PlusCircle size={16} />
              Create New Event
            </button>
          )}
        </div>

        {/* Events Grid */}
        <div className="event-select-grid">
          {loading ? (
            <div className="event-select-loading">
              <div className="event-loading-spinner" />
              <p>Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="event-select-empty">
              <Calendar size={48} color="var(--border-color)" />
              <h3>No events found</h3>
              <p>There are no events matching your search. Try a different query or create a new event.</p>
            </div>
          ) : (
            filteredEvents.map(event => {
              const statusStyle = getStatusColor(event.status);
              return (
                <div
                  key={event.id}
                  className="event-card"
                  onClick={() => onSelectEvent(event)}
                >
                  <div className="event-card-top">
                    <div className="event-card-icon">
                      <Calendar size={24} />
                    </div>
                    <span
                      className="event-status-badge"
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`
                      }}
                    >
                      {event.status}
                    </span>
                  </div>

                  <h3 className="event-card-title">{event.title}</h3>
                  <p className="event-card-desc">{event.description}</p>

                  <div className="event-card-details">
                    <div className="event-card-detail">
                      <MapPin size={14} />
                      <span>{event.venue}</span>
                    </div>
                    <div className="event-card-detail">
                      <Calendar size={14} />
                      <span>{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="event-card-detail">
                      <Clock size={14} />
                      <span>{event.start_time} - {event.end_time}</span>
                    </div>
                    <div className="event-card-detail">
                      <DollarSign size={14} />
                      <span>Budget: ${event.total_budget?.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="event-card-action">
                    <span>Open Dashboard</span>
                    <ArrowRight size={16} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Plan New Event Modal */}
      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal-card" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700 }}>
                Create New Event
              </h2>
              <p style={{ color: 'var(--secondary-gray)', fontSize: '0.85rem' }}>
                Create a new event to manage with UniSphere
              </p>
            </div>

            {planError && (
              <div className="login-alert login-alert-error">
                <AlertCircle size={16} />
                <span>{planError}</span>
              </div>
            )}

            {planSuccess && (
              <div className="login-alert login-alert-success">
                <CheckCircle2 size={16} />
                <span>{planSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePlanEvent}>
              <div className="form-group">
                <label className="form-label">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual University Cultural Carnival 2026"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  placeholder="Brief description of the event..."
                  value={eventDescription}
                  onChange={e => setEventDescription(e.target.value)}
                  className="form-input"
                  rows={2}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Venue / Hall</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grand Campus Arena"
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Total Budget ($)</label>
                  <input type="number" value={totalBudget} onChange={e => setTotalBudget(e.target.value)} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowPlanModal(false)} className="btn-secondary" style={{ flex: 1, padding: '0.75rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={planLoading} className="btn-primary" style={{ flex: 2, padding: '0.75rem' }}>
                  {planLoading ? 'Creating...' : 'Create Event'} <Sparkles size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

