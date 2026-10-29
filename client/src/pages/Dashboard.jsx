import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get('/events').then(r => setEvents(r.data)).catch(() => {});
    api.get('/notifications').then(r => setNotifications(r.data)).catch(() => {});
  }, []);

  const unread = notifications.filter(n => !n.is_read);

  return (
    <div className="page">
      <h2>Dashboard</h2>
      <p>Welcome, {user?.username} ({user?.role})</p>

      {unread.length > 0 && (
        <div className="notification-bar">
          <h3>Notifications ({unread.length} unread)</h3>
          <ul>
            {unread.slice(0, 5).map(n => (
              <li key={n.id}><strong>{n.title}</strong>: {n.message}</li>
            ))}
          </ul>
          <Link to="/notifications">View all</Link>
        </div>
      )}

      <h3>Events</h3>
      {user?.role === 'Admin' && <Link to="/events/create"><button>Create Event</button></Link>}
      <ul>
        {events.map(ev => (
          <li key={ev.id}>
            <Link to={`/events/${ev.id}`}><strong>{ev.title}</strong></Link>
            {' '} - {ev.venue} - {new Date(ev.event_date).toLocaleDateString()}
          </li>
        ))}
      </ul>

      <h3>Quick Links</h3>
      <nav className="quick-links">
        <Link to="/tasks/my">My Tasks</Link>
        <Link to="/notifications">Notifications</Link>
      </nav>
    </div>
  );
}
