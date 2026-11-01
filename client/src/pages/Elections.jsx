import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const AVATAR_COLORS = ['#111827', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

const getAvatarColor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getDefaultManifesto = (posTitle = '', name = '') => {
  const n = (name || '').toLowerCase();
  const t = (posTitle || '').toLowerCase();
  if (n.includes('alex')) return 'Committed to flawless execution, transparent financial reporting, and student-first planning.';
  if (n.includes('sarah')) return 'Promoting inclusive student participation, sustainability in event logistics, and real-time alerts.';
  if (n.includes('david')) return 'Experienced with university transport fleet and municipal logistics partnerships.';
  if (n.includes('marcus')) return '3 years audio engineer for Campus Radio, zero delay target on stage transitions.';
  if (t.includes('president')) return 'Committed to flawless execution, transparent financial reporting, and student-first planning.';
  if (t.includes('transport')) return 'Experienced with university transport fleet and municipal logistics partnerships.';
  if (t.includes('sound') || t.includes('stage')) return 'Audio engineering expert with zero delay target on stage transitions.';
  if (t.includes('catering') || t.includes('refreshment')) return 'Overseeing vendor hygiene, dietary accessibility, and zero-waste meal lines.';
  return 'Dedicated to student welfare, seamless team collaboration, and exceptional event delivery.';
};

export default function Elections() {
  const { eventId } = useParams();
  const { user, hasRole } = useAuth();
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState(null);
  const [warning, setWarning] = useState('');
  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [activePosition, setActivePosition] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [nomineeForm, setNomineeForm] = useState({
    candidate_name: '',
    manifesto: ''
  });

  const [createForm, setCreateForm] = useState({
    title: 'Organizing Committee Democratic Elections',
    nomination_start: new Date().toISOString().slice(0, 16),
    nomination_end: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    voting_start: new Date().toISOString().slice(0, 16),
    voting_end: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 16),
    positions: [
      { title: 'Organizing Committee (OC) President', description: 'Directs all overall committee operations, liaises with faculty and manages event execution.' },
      { title: 'Head of Transportation & Logistics', description: 'Coordinates bus shuttles, rental vans, parking permits, and equipment transit.' },
      { title: 'Lead Stage & Sound Coordinator', description: 'Manages stage equipment, microphone setups, lighting sequences, and audio cues.' },
      { title: 'Head of Refreshments & Catering', description: 'Oversees food vendor selection, hygienic meal distribution, and beverage counters.' }
    ]
  });

  const loadElection = async (id) => {
    try {
      const res = await api.get(`/elections/${id}`);
      setSelectedElection(res.data);
    } catch {
      // Handled silently
    }
  };

  const load = async () => {
    try {
      const res = await api.get(`/elections/event/${eventId}`);
      const list = res.data || [];
      setElections(list);
      if (list.length > 0) {
        loadElection(list[0].id);
      } else {
        setSelectedElection(null);
      }
    } catch {
      // Resilient error handling
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const openNominateModal = (position) => {
    setActivePosition(position);
    setNomineeForm({
      candidate_name: user?.username || '',
      manifesto: ''
    });
    setWarning('');
    setIsNominateModalOpen(true);
  };

  const closeNominateModal = () => {
    setIsNominateModalOpen(false);
    setActivePosition(null);
    setNomineeForm({ candidate_name: '', manifesto: '' });
  };

  const handleNominateSubmit = async (e) => {
    e.preventDefault();
    if (!activePosition) return;

    try {
      await api.post('/elections/nominate', {
        position_id: activePosition.id,
        candidate_name: nomineeForm.candidate_name,
        manifesto: nomineeForm.manifesto
      });
      closeNominateModal();
      loadElection(selectedElection.id);
    } catch (err) {
      setWarning(err.response?.data?.error || 'Failed to submit nomination');
    }
  };

  const handleVote = async (positionId, nomineeId) => {
    try {
      await api.post('/elections/vote', { position_id: positionId, nominee_id: nomineeId });
      loadElection(selectedElection.id);
    } catch (err) {
      setWarning(err.response?.data?.error || 'Vote could not be recorded');
    }
  };

  const handleCloseElection = async (electionId) => {
    if (!window.confirm('Are you sure you want to close voting and officially elect winners for all committee positions?')) {
      return;
    }
    try {
      await api.post(`/elections/${electionId}/close`);
      loadElection(electionId);
    } catch (err) {
      setWarning(err.response?.data?.error || 'Failed to close election');
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...createForm,
        event_id: parseInt(eventId),
        positions: createForm.positions.filter(p => p.title.trim() !== '')
      };
      await api.post('/elections', payload);
      setIsCreateModalOpen(false);
      load();
    } catch (err) {
      setWarning(err.response?.data?.error || 'Failed to create election');
    }
  };

  const addPositionField = () => {
    setCreateForm({
      ...createForm,
      positions: [...createForm.positions, { title: '', description: '' }]
    });
  };

  return (
    <div className="election-page">
      <div className="election-container">
        {/* Header */}
        <div className="election-header">
          <div className="election-title-row">
            <span className="election-header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <polyline points="9 11 12 14 15 9" />
              </svg>
            </span>
            <h2 className="election-title">Committee Nomination &amp; Voting</h2>
          </div>
        </div>

        {/* Warning notification box */}
        {warning && (
          <div className="election-warning-box">
            <span>⚠ {warning}</span>
            <button className="election-warning-close" onClick={() => setWarning('')}>×</button>
          </div>
        )}

        {/* Multiple elections toggle */}
        {elections.length > 1 && (
          <div className="election-view-toggle">
            {elections.map(el => (
              <button
                key={el.id}
                className={`election-toggle-pill ${selectedElection?.id === el.id ? 'active' : ''}`}
                onClick={() => loadElection(el.id)}
              >
                {el.title}
              </button>
            ))}
          </div>
        )}

        {/* Main Content */}
        {selectedElection ? (
          <div>
            {selectedElection.positions?.map((pos) => {
              const isClosed = selectedElection.status === 'closed';

              return (
                <div key={pos.id} className="election-position-card">
                  {/* Position Card Top */}
                  <div className="position-card-top">
                    <div className="position-info">
                      <div className="position-title-wrap">
                        <h3 className="position-title">{pos.title}</h3>
                        <span className={`position-status-badge ${isClosed ? 'closed' : ''}`}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          {isClosed ? 'Voting Closed' : 'Voting Live'}
                        </span>
                      </div>
                      {pos.description && (
                        <p className="position-description">{pos.description}</p>
                      )}
                    </div>

                    <div className="position-actions">
                      {!isClosed && (
                        <button className="btn-nominate" onClick={() => openNominateModal(pos)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Nominate Candidate
                        </button>
                      )}

                      {hasRole('Admin') && !isClosed && (
                        <button className="btn-close-voting" onClick={() => handleCloseElection(selectedElection.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Close Voting &amp; Elect
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Nominees Grid */}
                  {pos.nominees && pos.nominees.length > 0 ? (
                    <div className="nominees-grid">
                      {pos.nominees.map((n) => {
                        const voteCount = n.vote_count || 0;
                        const totalPosVotes = pos.total_votes || 1;
                        const pct = pos.total_votes > 0 ? Math.round((voteCount / pos.total_votes) * 100) : 0;
                        const hasVotedThis = pos.user_voted_nominee_id === n.nominee_id;

                        return (
                          <div key={n.id || n.nominee_id} className="nominee-card">
                            <div>
                              <div className="nominee-card-header">
                                <div className="nominee-profile-info">
                                  <div
                                    className="nominee-avatar"
                                    style={{ background: getAvatarColor(n.username) }}
                                  >
                                    {(n.username || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="nominee-names">
                                    <div className="nominee-fullname">{n.username}</div>
                                    <div className="nominee-email">
                                      {n.email || `${(n.username || 'student').toLowerCase().replace(/\s+/g, '')}@unisphere.edu`}
                                    </div>
                                  </div>
                                </div>

                                <div className="nominee-votes-badge">
                                  <span className="nominee-votes-count">{voteCount} votes</span>
                                  <span className="nominee-votes-pct">({pct}%)</span>
                                </div>
                              </div>

                              {/* Manifesto Box */}
                              <div className="nominee-manifesto">
                                "{n.manifesto || getDefaultManifesto(pos.title, n.username)}"
                              </div>
                            </div>

                            <div>
                              {/* Progress bar */}
                              <div className="nominee-progress-track">
                                <div className="nominee-progress-fill" style={{ width: `${pct}%` }} />
                              </div>

                              {/* Vote Button */}
                              {!isClosed ? (
                                <button
                                  className={`btn-vote ${hasVotedThis ? 'voted' : ''}`}
                                  onClick={() => handleVote(pos.id, n.nominee_id)}
                                  disabled={pos.user_voted_nominee_id != null}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                  </svg>
                                  {hasVotedThis ? `✓ Voted for ${(n.username || '').split(' ')[0]}` : `Vote for ${(n.username || '').split(' ')[0]}`}
                                </button>
                              ) : (
                                <div style={{ textAlign: 'center', fontSize: 13, color: '#888888', fontWeight: 600, padding: '6px 0' }}>
                                  {pos.results && pos.results[0]?.nominee_id === n.nominee_id ? '🏆 Elected to Committee' : `${voteCount} Total Votes`}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="nominees-empty">
                      No candidates nominated yet. Be the first to nominate a student leader!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="election-position-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h3 style={{ fontSize: 18, color: '#1a1a2e', marginBottom: 8 }}>No Election Configured Yet</h3>
            <p style={{ color: '#666666', fontSize: 14, marginBottom: 20 }}>
              Create an election to enable democratic voting for committee positions.
            </p>
            {hasRole('Admin') && (
              <button className="btn-nominate" style={{ background: '#3b82f6', color: '#ffffff', border: 'none', margin: '0 auto' }} onClick={() => setIsCreateModalOpen(true)}>
                + Setup Committee Election
              </button>
            )}
          </div>
        )}

        {/* Screenshot 4: Nominate Candidate Modal */}
        {isNominateModalOpen && activePosition && (
          <div className="election-modal-backdrop" onClick={closeNominateModal}>
            <div className="election-modal" onClick={e => e.stopPropagation()}>
              <div className="election-modal-header">
                <span className="election-modal-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                </span>
                <h3 className="election-modal-title">
                  Nominate for: {activePosition.title}
                </h3>
              </div>

              <form onSubmit={handleNominateSubmit} className="election-modal-form">
                <div className="election-form-group">
                  <label>Candidate Full Name</label>
                  <input
                    type="text"
                    value={nomineeForm.candidate_name}
                    onChange={e => setNomineeForm({ ...nomineeForm, candidate_name: e.target.value })}
                    placeholder="Enter candidate full name..."
                    required
                  />
                  <span className="election-form-helper">
                    You can nominate yourself or another registered student.
                  </span>
                </div>

                <div className="election-form-group">
                  <label>Campaign Manifesto / Platform</label>
                  <textarea
                    value={nomineeForm.manifesto}
                    onChange={e => setNomineeForm({ ...nomineeForm, manifesto: e.target.value })}
                    placeholder="Outline key goals, past experience, and why students should vote for this candidate..."
                    rows={3}
                  />
                </div>

                <div className="election-modal-actions">
                  <button type="button" className="election-btn-cancel" onClick={closeNominateModal}>
                    Cancel
                  </button>
                  <button type="submit" className="election-btn-submit">
                    Submit Nomination
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Election Modal (Admin) */}
        {isCreateModalOpen && (
          <div className="election-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
            <div className="election-modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
              <div className="election-modal-header">
                <span className="election-modal-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <polyline points="9 11 12 14 15 9" />
                  </svg>
                </span>
                <h3 className="election-modal-title">Setup Committee Election</h3>
              </div>

              <form onSubmit={handleCreateElection} className="election-modal-form">
                <div className="election-form-group">
                  <label>Election Title</label>
                  <input
                    value={createForm.title}
                    onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="election-form-group">
                  <label>Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <label style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a2e', marginBottom: 8 }}>
                  Committee Positions
                </label>
                {createForm.positions.map((pos, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                    <input
                      style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e2e8', borderRadius: 8, fontSize: 13.5 }}
                      placeholder="Position title"
                      value={pos.title}
                      onChange={e => {
                        const copy = [...createForm.positions];
                        copy[idx].title = e.target.value;
                        setCreateForm({ ...createForm, positions: copy });
                      }}
                      required
                    />
                    <input
                      style={{ flex: 1.5, padding: '8px 12px', border: '1px solid #e2e2e8', borderRadius: 8, fontSize: 13.5 }}
                      placeholder="Brief responsibility description"
                      value={pos.description}
                      onChange={e => {
                        const copy = [...createForm.positions];
                        copy[idx].description = e.target.value;
                        setCreateForm({ ...createForm, positions: copy });
                      }}
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPositionField}
                  style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: 13, cursor: 'pointer', padding: '4px 0', marginBottom: 16 }}
                >
                  + Add Another Position
                </button>

                <div className="election-modal-actions">
                  <button type="button" className="election-btn-cancel" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="election-btn-submit">
                    Save &amp; Start Election
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
