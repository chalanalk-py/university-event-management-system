import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function LostFound() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState({ type: '', status: '', search: '' });
  const [lostForm, setLostForm] = useState({ description: '', location: '' });
  const [foundForm, setFoundForm] = useState({ description: '', collection_point: '' });
  const [lostFile, setLostFile] = useState(null);
  const [foundFile, setFoundFile] = useState(null);
  const [showForm, setShowForm] = useState(null);

  const load = () => {
    const params = new URLSearchParams();
    if (filter.type) params.set('type', filter.type);
    if (filter.status) params.set('status', filter.status);
    if (filter.search) params.set('search', filter.search);
    api.get(`/lost-found/event/${eventId}?${params}`).then(r => setPosts(r.data));
  };

  useEffect(() => { load(); }, [eventId, filter.type, filter.status]);

  const handleSearch = () => load();

  const handlePostLost = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('event_id', eventId);
    fd.append('description', lostForm.description);
    fd.append('location', lostForm.location);
    if (lostFile) fd.append('photo', lostFile);
    await api.post('/lost-found/lost', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setLostForm({ description: '', location: '' });
    setLostFile(null);
    setShowForm(null);
    load();
  };

  const handlePostFound = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('event_id', eventId);
    fd.append('description', foundForm.description);
    fd.append('collection_point', foundForm.collection_point);
    if (foundFile) fd.append('photo', foundFile);
    await api.post('/lost-found/found', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setFoundForm({ description: '', collection_point: '' });
    setFoundFile(null);
    setShowForm(null);
    load();
  };

  const handleResolve = async (id) => {
    await api.patch(`/lost-found/${id}/resolve`);
    load();
  };

  return (
    <div className="page">
      <h2>Lost & Found</h2>

      <div>
        <button onClick={() => setShowForm('lost')}>Report Lost Item</button>
        <button onClick={() => setShowForm('found')}>Report Found Item</button>
      </div>

      <div>
        <input placeholder="Search..." value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })} />
        <button onClick={handleSearch}>Search</button>
        <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>
        <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {showForm === 'lost' && (
        <form onSubmit={handlePostLost}>
          <h3>Report Lost Item</h3>
          <textarea placeholder="Description" value={lostForm.description} onChange={e => setLostForm({ ...lostForm, description: e.target.value })} required />
          <input placeholder="Location last seen" value={lostForm.location} onChange={e => setLostForm({ ...lostForm, location: e.target.value })} />
          <input type="file" onChange={e => setLostFile(e.target.files[0])} />
          <button type="submit">Submit</button>
          <button type="button" onClick={() => setShowForm(null)}>Cancel</button>
        </form>
      )}

      {showForm === 'found' && (
        <form onSubmit={handlePostFound}>
          <h3>Report Found Item</h3>
          <textarea placeholder="Description" value={foundForm.description} onChange={e => setFoundForm({ ...foundForm, description: e.target.value })} required />
          <input placeholder="Collection point" value={foundForm.collection_point} onChange={e => setFoundForm({ ...foundForm, collection_point: e.target.value })} />
          <input type="file" onChange={e => setFoundFile(e.target.files[0])} />
          <button type="submit">Submit</button>
          <button type="button" onClick={() => setShowForm(null)}>Cancel</button>
        </form>
      )}

      <ul>
        {posts.map(p => (
          <li key={p.id}>
            <strong>[{p.type.toUpperCase()}]</strong> {p.description}
            {p.location && <span> — Location: {p.location}</span>}
            {p.collection_point && <span> — Collect at: {p.collection_point}</span>}
            <span> — {p.status} — by {p.username}</span>
            {p.photo_url && <img src={`http://localhost:5000${p.photo_url}`} alt="item" style={{ maxWidth: '100px', display: 'block' }} />}
            {p.user_id === user?.id && p.status === 'open' && (
              <button onClick={() => handleResolve(p.id)}>Mark Resolved</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
