import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    event_date: '',
    event_time: ''
  });

  const loadEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data || []);
    } catch {
      // Keep state resilient
    }
  };

  useEffect(() => {
    loadEvents();
    api.get('/notifications').then(r => setNotifications(r.data || [])).catch(() => {});
  }, []);

  const unread = notifications.filter(n => !n.is_read);

  const filteredEvents = events.filter(ev => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const title = (ev.title || '').toLowerCase();
    const venue = (ev.venue || '').toLowerCase();
    return title.includes(q) || venue.includes(q);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBA';
    try {
      let cleanDate = dateStr;
      if (typeof dateStr === 'string' && dateStr.includes('T')) {
        cleanDate = dateStr.split('T')[0];
      }
      const parts = cleanDate.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        const [year, month, day] = parts;
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (ev) => {
    if (!ev.event_time) return 'Time TBA';
    const start = String(ev.event_time).slice(0, 5);
    if (ev.end_time) {
      const end = String(ev.end_time).slice(0, 5);
      return `${start} - ${end}`;
    }
    return start;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
    try {
      const payload = {
        title: form.title,
        description: form.description,
        venue: form.venue,
        event_date: form.event_date,
        event_time: form.event_time
      };

      await api.post('/events', payload);
      await loadEvents();
      setIsCreateModalOpen(false);
      setForm({
        title: '',
        description: '',
        venue: '',
        event_date: '',
        event_time: ''
      });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <header className="dashboard-header">
        <div className="user-section">
          <div className="user-profile">
            <div className="user-avatar">{userInitial}</div>
            <div className="user-info">
              <span className="user-name">{user?.username || 'User'}</span>
              <span className="user-role">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                {user?.role ? user.role.toLowerCase() : 'admin'}
              </span>
            </div>
          </div>
          <button className="btn-logout" onClick={logout} title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Notifications bar if any */}
      {unread.length > 0 && (
        <div className="notification-bar-modern">
          <div className="notification-bar-content">
            <div className="notification-bell-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div>
              <strong>Notifications ({unread.length} unread):</strong>{' '}
              <span>{unread[0]?.title} - {unread[0]?.message}</span>
            </div>
          </div>
          <Link to="/notifications" className="notification-view-all">View all →</Link>
        </div>
      )}

      {/* Controls Bar: Search + Quick Links + Create New Event */}
      <div className="controls-bar">
        <div className="search-container">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search events by name or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="quick-links-group">
          <Link to="/tasks/my" className="quick-link-btn" title="My Tasks">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>My Tasks</span>
          </Link>
          <Link to="/notifications" className="quick-link-btn" title="Notifications">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span>Notifications</span>
            {unread.length > 0 && <span className="unread-dot-badge">{unread.length}</span>}
          </Link>
        </div>

        <button
          className="btn-create-event"
          onClick={() => {
            setFormError('');
            setIsCreateModalOpen(true);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <span>Create New Event</span>
        </button>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="empty-events-state">
          <div className="empty-icon-wrap">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
          <h3>No events found</h3>
          <p>{searchQuery ? 'Try clearing your search query.' : 'Click "Create New Event" to get started!'}</p>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map((ev) => (
            <div key={ev.id} className="event-card">
              <div className="event-card-top">
                <div className="event-card-header">
                  <div className="event-calendar-badge">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  <span className="event-status-pill">Active</span>
                </div>

                <h3 className="event-card-title">{ev.title}</h3>
                <p className="event-card-desc">{ev.description || 'No description provided.'}</p>
              </div>

              <div className="event-card-bottom">
                <div className="event-card-meta">
                  <div className="meta-item">
                    <svg className="meta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span className="meta-text">{ev.venue || 'Venue TBA'}</span>
                  </div>
                  <div className="meta-item">
                    <svg className="meta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span className="meta-text">{formatDate(ev.event_date)}</span>
                  </div>
                  <div className="meta-item">
                    <svg className="meta-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span className="meta-text">{formatTime(ev)}</span>
                  </div>
                </div>

                <Link to={`/events/${ev.id}`} className="btn-open-dashboard">
                  <span>Open Dashboard</span>
                  <span className="arrow-icon">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create New Event Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="create-event-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Event</h2>
            <p className="modal-subtitle">Create a new event to manage with UniSphere</p>

            {formError && <div className="form-error-msg">{formError}</div>}

            <form onSubmit={handleCreateSubmit} className="create-event-form">
              <div className="form-group">
                <label>Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Annual University Cultural Carnival 2026"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Brief description of the event..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Venue / Hall</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Campus Arena"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Event Date</label>
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={form.event_time}
                    onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    'Creating...'
                  ) : (
                    <>
                      <span>Create Event</span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
                        <circle cx="19" cy="5" r="1" fill="currentColor"/>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
