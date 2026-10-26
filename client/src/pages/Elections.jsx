import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Elections() {
  const { eventId } = useParams();
  const { user, hasRole } = useAuth();
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', nomination_start: '', nomination_end: '', voting_start: '', voting_end: '',
    positions: [{ title: '', description: '' }]
  });

  const load = () => api.get(`/elections/event/${eventId}`).then(r => setElections(r.data));
  useEffect(() => { load(); }, [eventId]);

  const loadElection = (id) => api.get(`/elections/${id}`).then(r => setSelectedElection(r.data));

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/elections', { ...form, event_id: parseInt(eventId), positions: form.positions.filter(p => p.title) });
    setForm({ title: '', description: '', nomination_start: '', nomination_end: '', voting_start: '', voting_end: '', positions: [{ title: '', description: '' }] });
    load();
  };

  const handleNominate = async (positionId, nomineeId) => {
    try {
      await api.post('/elections/nominate', { position_id: positionId, nominee_id: nomineeId || undefined });
      loadElection(selectedElection.id);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleVote = async (positionId, nomineeId) => {
    try {
      await api.post('/elections/vote', { position_id: positionId, nominee_id: nomineeId });
      alert('Vote recorded');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const addPosition = () => setForm({ ...form, positions: [...form.positions, { title: '', description: '' }] });

  return (
    <div className="page">
      <h2>Elections & Nominations</h2>

      {hasRole('Admin') && (
        <form onSubmit={handleCreate}>
          <h3>Create Election</h3>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <label>Nomination Start: <input type="datetime-local" value={form.nomination_start} onChange={e => setForm({ ...form, nomination_start: e.target.value })} required /></label>
          <label>Nomination End: <input type="datetime-local" value={form.nomination_end} onChange={e => setForm({ ...form, nomination_end: e.target.value })} required /></label>
          <label>Voting Start: <input type="datetime-local" value={form.voting_start} onChange={e => setForm({ ...form, voting_start: e.target.value })} required /></label>
          <label>Voting End: <input type="datetime-local" value={form.voting_end} onChange={e => setForm({ ...form, voting_end: e.target.value })} required /></label>
          <h4>Positions</h4>
          {form.positions.map((p, i) => (
            <div key={i}>
              <input placeholder="Position title" value={p.title} onChange={e => { const pos = [...form.positions]; pos[i].title = e.target.value; setForm({ ...form, positions: pos }); }} />
              <input placeholder="Description" value={p.description} onChange={e => { const pos = [...form.positions]; pos[i].description = e.target.value; setForm({ ...form, positions: pos }); }} />
            </div>
          ))}
          <button type="button" onClick={addPosition}>+ Position</button>
          <button type="submit">Create Election</button>
        </form>
      )}

      <h3>Elections</h3>
      <ul>
        {elections.map(el => (
          <li key={el.id}>
            <strong>{el.title}</strong> — Status: {el.status}
            <button onClick={() => loadElection(el.id)}>View</button>
          </li>
        ))}
      </ul>

      {selectedElection && (
        <div>
          <h3>{selectedElection.title}</h3>
          <p>Status: <strong>{selectedElection.status}</strong></p>
          <p>{selectedElection.description}</p>

          {selectedElection.positions?.map(pos => (
            <div key={pos.id} className="position-card">
              <h4>{pos.title}</h4>
              <p>{pos.description}</p>

              {selectedElection.status === 'nominating' && (
                <div>
                  <button onClick={() => handleNominate(pos.id)}>Nominate Myself</button>
                  <input id={`nom-${pos.id}`} placeholder="Or enter user ID to nominate" />
                  <button onClick={() => handleNominate(pos.id, parseInt(document.getElementById(`nom-${pos.id}`).value))}>Nominate Other</button>
                </div>
              )}

              <h5>Nominees</h5>
              <ul>
                {pos.nominees?.map(n => (
                  <li key={n.id}>
                    {n.username}
                    {selectedElection.status === 'voting' && (
                      <button onClick={() => handleVote(pos.id, n.nominee_id)}>Vote</button>
                    )}
                  </li>
                ))}
              </ul>

              {selectedElection.status === 'closed' && pos.results?.length > 0 && (
                <div>
                  <h5>Results</h5>
                  <ol>
                    {pos.results.map((r, i) => (
                      <li key={i}>{r.nominee_id} — {r.vote_count} votes {i === 0 && '🏆'}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
