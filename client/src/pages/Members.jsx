import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Members() {
  const { eventId } = useParams();
  const { user, hasRole } = useAuth();
  const [members, setMembers] = useState([]);
  const [pending, setPending] = useState([]);
  const [addForm, setAddForm] = useState({ user_id: '', role: '', area: '' });

  const load = () => {
    api.get(`/members/event/${eventId}`).then(r => setMembers(r.data));
    if (hasRole('Admin')) {
      api.get(`/members/pending/${eventId}`).then(r => setPending(r.data)).catch(() => {});
    }
  };
  useEffect(() => { load(); }, [eventId]);

  const handleJoin = async () => {
    try {
      await api.post('/members/join', { event_id: parseInt(eventId) });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleRequest = async (id, status) => {
    await api.patch(`/members/${id}/handle`, { status });
    load();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await api.post('/members', { event_id: parseInt(eventId), ...addForm, user_id: parseInt(addForm.user_id) });
    setAddForm({ user_id: '', role: '', area: '' });
    load();
  };

  const handleRemove = async (id) => {
    await api.delete(`/members/${id}`);
    load();
  };

  const isMember = members.some(m => m.user_id === user?.id && m.status === 'approved');
  const hasPending = members.some(m => m.user_id === user?.id && m.status === 'pending');

  return (
    <div className="page">
      <h2>Members</h2>

      {!isMember && !hasPending && <button onClick={handleJoin}>Request to Join</button>}
      {hasPending && <p>Your join request is pending</p>}

      {hasRole('Admin') && pending.length > 0 && (
        <div>
          <h3>Pending Requests</h3>
          <ul>
            {pending.map(p => (
              <li key={p.id}>
                {p.username} ({p.email})
                <button onClick={() => handleRequest(p.id, 'approved')}>Approve</button>
                <button onClick={() => handleRequest(p.id, 'rejected')}>Reject</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasRole('Admin') && (
        <form onSubmit={handleAdd}>
          <h3>Add Member</h3>
          <input placeholder="User ID" value={addForm.user_id} onChange={e => setAddForm({ ...addForm, user_id: e.target.value })} required />
          <input placeholder="Role" value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })} />
          <input placeholder="Area" value={addForm.area} onChange={e => setAddForm({ ...addForm, area: e.target.value })} />
          <button type="submit">Add</button>
        </form>
      )}

      <h3>Member List</h3>
      <table>
        <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Area</th><th>Status</th>{hasRole('Admin') && <th>Actions</th>}</tr></thead>
        <tbody>
          {members.filter(m => m.status === 'approved').map(m => (
            <tr key={m.id}>
              <td>{m.username}</td><td>{m.email}</td><td>{m.role || m.user_role}</td><td>{m.area || '-'}</td><td>{m.status}</td>
              {hasRole('Admin') && <td><button onClick={() => handleRemove(m.id)}>Remove</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
