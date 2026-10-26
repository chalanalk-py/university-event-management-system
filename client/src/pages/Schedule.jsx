import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Schedule() {
  const { eventId } = useParams();
  const { hasRole } = useAuth();
  const [activities, setActivities] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', start_time: '', end_time: '' });
  const [warning, setWarning] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [editId, setEditId] = useState(null);

  const load = () => api.get(`/schedule/event/${eventId}`).then(r => setActivities(r.data));
  useEffect(() => { load(); }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setWarning(null);
    try {
      if (editId) {
        await api.put(`/schedule/${editId}`, { ...form, event_id: eventId });
        setEditId(null);
      } else {
        const res = await api.post('/schedule', { ...form, event_id: eventId });
        if (res.data.warning) setWarning(res.data.warning);
      }
      setForm({ title: '', description: '', start_time: '', end_time: '' });
      load();
    } catch (err) {
      if (err.response?.data?.conflicts) setWarning(err.response.data);
      else alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/schedule/${id}`);
    load();
  };

  const startEdit = (a) => {
    setEditId(a.id);
    setForm({ title: a.title, description: a.description || '', start_time: a.start_time.slice(0, 16), end_time: a.end_time.slice(0, 16) });
  };

  // Group activities by date for calendar view
  const grouped = activities.reduce((acc, a) => {
    const date = new Date(a.start_time).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(a);
    return acc;
  }, {});

  return (
    <div className="page">
      <h2>Schedule</h2>

      <div>
        <button onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'active' : ''}>List</button>
        <button onClick={() => setViewMode('calendar')} className={viewMode === 'calendar' ? 'active' : ''}>Calendar</button>
      </div>

      {warning && (
        <div className="warning">
          <strong>⚠ {warning.message || warning.error}</strong>
          {warning.conflicts && <ul>{warning.conflicts.map(c => <li key={c.id}>{c.title} ({new Date(c.start_time).toLocaleTimeString()} - {new Date(c.end_time).toLocaleTimeString()})</li>)}</ul>}
        </div>
      )}

      {hasRole('Admin', 'Coordinator', 'Event Member') && (
        <form onSubmit={handleSubmit}>
          <h3>{editId ? 'Edit Activity' : 'Add Activity'}</h3>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <label>Start: <input type="datetime-local" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required /></label>
          <label>End: <input type="datetime-local" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required /></label>
          <button type="submit">{editId ? 'Update' : 'Add'}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm({ title: '', description: '', start_time: '', end_time: '' }); }}>Cancel</button>}
        </form>
      )}

      {viewMode === 'list' ? (
        <ul>
          {activities.map(a => (
            <li key={a.id}>
              <strong>{a.title}</strong> — {new Date(a.start_time).toLocaleString()} to {new Date(a.end_time).toLocaleString()}
              {a.description && <p>{a.description}</p>}
              {hasRole('Admin', 'Coordinator', 'Event Member') && (
                <span>
                  <button onClick={() => startEdit(a)}>Edit</button>
                  <button onClick={() => handleDelete(a.id)}>Delete</button>
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div>
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h4>{date}</h4>
              <ul>
                {items.map(a => (
                  <li key={a.id}><strong>{a.title}</strong> {new Date(a.start_time).toLocaleTimeString()} - {new Date(a.end_time).toLocaleTimeString()}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
