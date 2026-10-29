import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Contacts() {
  const { eventId } = useParams();
  const { hasRole } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '', category: 'Other' });
  const [editId, setEditId] = useState(null);

  const categories = ['Transportation', 'Music Circle', 'Refreshments', 'Costume Rental', 'Coordinator', 'Other'];

  const load = () => {
    const params = new URLSearchParams();
    if (filter) params.set('category', filter);
    if (search) params.set('search', search);
    api.get(`/contacts/event/${eventId}?${params}`).then(r => setContacts(r.data));
    api.get(`/contacts/coordinators/${eventId}`).then(r => setCoordinators(r.data));
  };

  useEffect(() => { load(); }, [eventId, filter, search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editId) {
      await api.put(`/contacts/${editId}`, form);
      setEditId(null);
    } else {
      await api.post('/contacts', { ...form, event_id: parseInt(eventId) });
    }
    setForm({ name: '', phone: '', email: '', notes: '', category: 'Other' });
    load();
  };

  const startEdit = (c) => {
    setEditId(c.id);
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', notes: c.notes || '', category: c.category });
  };

  const handleDelete = async (id) => {
    await api.delete(`/contacts/${id}`);
    load();
  };

  return (
    <div className="page">
      <h2>Contacts</h2>

      <div>
        <input placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {hasRole('Admin', 'Coordinator') && (
        <form onSubmit={handleSubmit}>
          <h3>{editId ? 'Edit Contact' : 'Add Contact'}</h3>
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit">{editId ? 'Update' : 'Add'}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: '', phone: '', email: '', notes: '', category: 'Other' }); }}>Cancel</button>}
        </form>
      )}

      <h3>Contact List</h3>
      <table>
        <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Category</th><th>Notes</th>{hasRole('Admin', 'Coordinator') && <th>Actions</th>}</tr></thead>
        <tbody>
          {contacts.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td><td>{c.phone}</td><td>{c.email}</td><td>{c.category}</td><td>{c.notes}</td>
              {hasRole('Admin', 'Coordinator') && (
                <td>
                  <button onClick={() => startEdit(c)}>Edit</button>
                  <button onClick={() => handleDelete(c.id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {coordinators.length > 0 && (
        <>
          <h3>Event Coordinators</h3>
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Area</th><th>Role</th></tr></thead>
            <tbody>
              {coordinators.map(c => (
                <tr key={c.id}><td>{c.username}</td><td>{c.email}</td><td>{c.area || '-'}</td><td>{c.role}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
