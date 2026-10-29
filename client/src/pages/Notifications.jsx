import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api';

export default function Notifications() {
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [showPrefs, setShowPrefs] = useState(false);

  const load = () => {
    api.get('/notifications').then(r => setNotifications(r.data));
    api.get('/notifications/preferences').then(r => setPreferences(r.data));
  };

  useEffect(() => { load(); }, []);

  // Listen for realtime notifications
  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      setNotifications(prev => [notif, ...prev]);
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  const togglePref = async (type, enabled) => {
    await api.put('/notifications/preferences', { type, enabled: !enabled });
    load();
  };

  return (
    <div className="page">
      <h2>Notifications</h2>

      <div>
        <button onClick={markAllRead}>Mark All Read</button>
        <button onClick={() => setShowPrefs(!showPrefs)}>
          {showPrefs ? 'Hide' : 'Show'} Preferences
        </button>
      </div>

      {showPrefs && (
        <div>
          <h3>Notification Preferences</h3>
          <ul>
            {preferences.map(p => (
              <li key={p.type}>
                <label>
                  <input type="checkbox" checked={p.enabled} onChange={() => togglePref(p.type, p.enabled)} />
                  {p.type.replace(/_/g, ' ')}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul>
        {notifications.map(n => (
          <li key={n.id} className={n.is_read ? 'read' : 'unread'}>
            <strong>{n.title}</strong>: {n.message}
            <small> ({new Date(n.created_at).toLocaleString()})</small>
            {!n.is_read && <button onClick={() => markRead(n.id)}>Mark Read</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
