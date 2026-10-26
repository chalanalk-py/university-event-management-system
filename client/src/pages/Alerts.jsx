import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Alerts() {
  const { eventId } = useParams();
  const { hasRole } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ message: '', target_group: 'all' });

  const load = () => api.get(`/alerts/event/${eventId}`).then(r => setAlerts(r.data));
  useEffect(() => { load(); }, [eventId]);

  const handleSend = async (e) => {
    e.preventDefault();
    await api.post('/alerts', { event_id: parseInt(eventId), ...form });
    setForm({ message: '', target_group: 'all' });
    load();
  };

  return (
    <div className="page">
      <h2>Alerts</h2>

      {hasRole('Admin', 'Coordinator') && (
        <form onSubmit={handleSend}>
          <h3>Send Alert</h3>
          <textarea placeholder="Message" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
          <input placeholder="Target group (all, or role/area)" value={form.target_group} onChange={e => setForm({ ...form, target_group: e.target.value })} />
          <button type="submit">Send</button>
        </form>
      )}

      <h3>Alert History</h3>
      <ul>
        {alerts.map(a => (
          <li key={a.id}>
            <strong>{a.sender_name}</strong> → {a.target_group}: {a.message}
            <small> ({new Date(a.created_at).toLocaleString()})</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
