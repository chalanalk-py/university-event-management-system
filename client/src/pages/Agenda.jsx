import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api';

export default function Agenda() {
  const { eventId } = useParams();
  const { hasRole } = useAuth();
  const { socket, joinEvent } = useSocket();
  const [agenda, setAgenda] = useState(null);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', performer: '', scheduled_time: '' });
  const [createForm, setCreateForm] = useState({ controller_id: '' });

  const load = () => {
    api.get(`/agenda/event/${eventId}`).then(r => {
      if (r.data.agenda || r.data.id) {
        setAgenda(r.data);
        setItems(r.data.items || []);
      }
    });
  };

  useEffect(() => {
    load();
    joinEvent(eventId);
  }, [eventId]);

  // Listen for realtime agenda updates
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (data.items) setItems(data.items);
    };
    socket.on('agenda_update', handler);
    return () => socket.off('agenda_update', handler);
  }, [socket]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/agenda', {
      event_id: parseInt(eventId),
      controller_id: createForm.controller_id ? parseInt(createForm.controller_id) : null
    });
    load();
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    await api.post('/agenda/item', { agenda_id: agenda.id, ...form });
    setForm({ title: '', performer: '', scheduled_time: '' });
    load();
  };

  const handleStatus = async (itemId, status) => {
    await api.patch(`/agenda/item/${itemId}/status`, { status });
  };

  const handleReorder = async (itemId, direction) => {
    const idx = items.findIndex(i => i.id === itemId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const newItems = [...items];
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    const reordered = newItems.map((item, i) => ({ id: item.id, sort_order: i }));
    await api.put('/agenda/reorder', { items: reordered });
    load();
  };

  const currentItem = items.find(i => i.status === 'now_performing');
  const nextItem = items.find(i => i.status === 'upcoming');

  if (!agenda) {
    return (
      <div className="page">
        <h2>Live Agenda</h2>
        {hasRole('Admin') ? (
          <form onSubmit={handleCreate}>
            <h3>Create Agenda</h3>
            <input placeholder="Controller User ID (optional)" value={createForm.controller_id}
              onChange={e => setCreateForm({ controller_id: e.target.value })} />
            <button type="submit">Create</button>
          </form>
        ) : <p>No agenda created yet</p>}
      </div>
    );
  }

  return (
    <div className="page">
      <h2>Live Agenda</h2>

      <div className="live-status">
        {currentItem && <p><strong>🔴 Now:</strong> {currentItem.title} — {currentItem.performer}</p>}
        {nextItem && <p><strong>⏭ Next:</strong> {nextItem.title} — {nextItem.performer}</p>}
      </div>

      {hasRole('Admin', 'Live Agenda Controller') && (
        <form onSubmit={handleAddItem}>
          <h3>Add Item</h3>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <input placeholder="Performer" value={form.performer} onChange={e => setForm({ ...form, performer: e.target.value })} />
          <input type="time" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })} />
          <button type="submit">Add</button>
        </form>
      )}

      <h3>Agenda Items</h3>
      <table>
        <thead><tr><th>#</th><th>Time</th><th>Title</th><th>Performer</th><th>Status</th>{hasRole('Admin', 'Live Agenda Controller') && <th>Actions</th>}</tr></thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id} className={item.status === 'now_performing' ? 'highlight' : ''}>
              <td>{idx + 1}</td>
              <td>{item.scheduled_time || '-'}</td>
              <td>{item.title}</td>
              <td>{item.performer || '-'}</td>
              <td>{item.status.replace('_', ' ')}</td>
              {hasRole('Admin', 'Live Agenda Controller') && (
                <td>
                  <button onClick={() => handleStatus(item.id, 'now_performing')}>▶ Now</button>
                  <button onClick={() => handleStatus(item.id, 'completed')}>✓ Done</button>
                  <button onClick={() => handleStatus(item.id, 'delayed')}>⏸ Delay</button>
                  <button onClick={() => handleReorder(item.id, 'up')}>↑</button>
                  <button onClick={() => handleReorder(item.id, 'down')}>↓</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
