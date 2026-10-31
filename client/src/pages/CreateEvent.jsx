import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CreateEvent() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', venue: '', event_date: '', event_time: '' });
  const [error, setError] = useState('');

  if (!hasRole('Admin')) return <p>Admin only</p>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="page">
      <h2>Create Event</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input placeholder="Title" value={form.title} onChange={update('title')} required />
        <textarea placeholder="Description" value={form.description} onChange={update('description')} />
        <input placeholder="Venue" value={form.venue} onChange={update('venue')} />
        <input type="date" value={form.event_date} onChange={update('event_date')} required />
        <input type="time" value={form.event_time} onChange={update('event_time')} required />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
