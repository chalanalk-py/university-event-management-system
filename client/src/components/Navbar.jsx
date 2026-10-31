import React from 'react';
import {
  Sparkles,
  Calendar,
  Radio,
  CheckSquare,
  PieChart,
  Vote,
  Image as ImageIcon,
  PhoneCall,
  Search,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';

export default function Navbar({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAuth,
  onLogout,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  events = [],
  activeEventId = 1,
  onSelectEvent,
  onBackToEvents
}) {
  const [showNotifDrawer, setShowNotifDrawer] = React.useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const activeEvent = events.find(e => e.id === Number(activeEventId)) || events[0];

  const tabs = [
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'agenda', label: 'Live Agenda', icon: Radio, badge: 'Live' },
    { id: 'tasks', label: 'To-Do & Tasks', icon: CheckSquare },
    { id: 'budget', label: 'Budget & Chart', icon: PieChart },
    { id: 'voting', label: 'Elections & Voting', icon: Vote },
    { id: 'designs', label: 'Designs & Feedback', icon: ImageIcon },
    { id: 'contacts', label: 'Contacts', icon: PhoneCall },
    { id: 'lostfound', label: 'Lost & Found', icon: Search }
  ];



  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand & Event Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onBackToEvents && (
            <button
              onClick={onBackToEvents}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.7rem', fontSize: '0.8rem' }}
              title="Back to Event Selection"
            >
              <ArrowLeft size={15} />
              Events
            </button>
          )}
          <div className="brand-badge" style={{ cursor: 'pointer' }} onClick={() => onSelectTab('schedule')}>
            <div className="brand-logo-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="brand-title">
                Uni<span style={{ color: 'var(--accent-blue)' }}>Sphere</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--secondary-gray)' }}>
                <span>{activeEvent ? activeEvent.title.slice(0, 24) + '...' : 'Event Manager'}</span>
                <span className="brand-pill">v1.1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                style={{ position: 'relative' }}
              >
                <Icon size={15} color={isActive ? 'var(--accent-blue)' : 'currentColor'} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    fontSize: '0.62rem',
                    background: '#EF4444',
                    color: 'white',
                    padding: '0.1rem 0.35rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User, Notifications & Role Tools */}
        <div className="nav-actions">
          {/* Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              className="notif-bell-btn"
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              title="Recent updates and push alerts"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            </button>

            {/* Notification Drawer */}
            {showNotifDrawer && (
              <div style={{
                position: 'absolute',
                top: '48px',
                right: '0',
                width: '360px',
                background: 'var(--bg-white)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                zIndex: 60,
                padding: '1rem',
                maxHeight: '440px',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Bell size={16} color="var(--accent-blue)" />
                    Recent Notifications ({unreadCount} new)
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', background: 'none' }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--secondary-gray)', textAlign: 'center', padding: '1rem' }}>
                      No new notifications
                    </p>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        onClick={() => onMarkNotificationRead(n.id)}
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: 'var(--radius-md)',
                          background: n.is_read ? 'var(--bg-white)' : 'var(--surface-hover)',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: n.type === 'alert' ? '#DC2626' : 'var(--primary-black)' }}>
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span style={{ width: '8px', height: '8px', background: 'var(--accent-blue)', borderRadius: '50%' }} />
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--secondary-gray)', lineHeight: 1.35 }}>
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Role Badge (Read-only) */}
          {currentUser && (
            <div
              className={`role-badge role-${currentUser.role}`}
              title={`Your role: ${currentUser.role.replace(/_/g, ' ')}`}
              style={{ cursor: 'default' }}
            >
              <ShieldCheck size={13} />
              <span>{currentUser.role.replace(/_/g, ' ')}</span>
            </div>
          )}

          {/* User Sign In / Profile */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  background: currentUser.avatar_color || 'var(--primary-black)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}
                title={currentUser.full_name || currentUser.username}
              >
                {(currentUser.full_name || currentUser.username).slice(0, 1).toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                className="btn-secondary"
                style={{ padding: '0.4rem', border: 'none', background: 'transparent' }}
                title="Log out"
              >
                <LogOut size={16} color="var(--secondary-gray)" />
              </button>
            </div>
          ) : (
            <button onClick={() => onOpenAuth('signin')} className="btn-primary" style={{ padding: '0.45rem 0.9rem' }}>
              <User size={15} />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
