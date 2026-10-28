import React, { useState } from 'react';
import { Vote, Award, CheckCircle2, UserCheck, Plus, Lock, Users, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

export default function VotingView({ elections = [], onRefresh, currentUser }) {
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [candidateName, setCandidateName] = useState('');
  const [manifesto, setManifesto] = useState('');
  const [loading, setLoading] = useState(false);
  const [voteStatusMsg, setVoteStatusMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const handleOpenNominate = (position) => {
    setSelectedPosition(position);
    setCandidateName(currentUser?.full_name || '');
    setManifesto('');
    setErrorMessage('');
    setShowNominateModal(true);
  };

  const handleNominateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPosition) return;
    setLoading(true);
    setErrorMessage('');
    try {
      await api.nominate({
        positionId: selectedPosition.id,
        candidateName,
        candidateId: currentUser?.id,
        nominatedById: currentUser?.id,
        manifesto
      });
      setShowNominateModal(false);
      onRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Nomination failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (positionId, candidateId) => {
    if (!currentUser) {
      alert('Please log in with student credentials to vote.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    setVoteStatusMsg('');
    try {
      const res = await api.vote({
        positionId,
        candidateId,
        voterId: currentUser.id
      });
      setVoteStatusMsg(res.message || 'Vote cast successfully!');
      setTimeout(() => setVoteStatusMsg(''), 4000);
      onRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Voting failed');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseElection = async (positionId) => {
    if (!window.confirm('Close voting for this committee position and declare the official winner?')) return;
    setLoading(true);
    try {
      const res = await api.closeElection(positionId);
      // Confetti victory explosion!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
      setVoteStatusMsg(`🎉 ${res.winnerName || 'Winner'} officially elected to committee!`);
      setTimeout(() => setVoteStatusMsg(''), 5000);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Error closing voting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-black)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Vote size={24} color="var(--accent-blue)" /> Committee Nomination & Voting
          </h1>
          <p style={{ color: 'var(--secondary-gray)', fontSize: '0.875rem' }}>
            Democratic elections for Organizing Committee leads with confidential ballots (FR-3.1 – FR-3.6)
          </p>
        </div>
      </div>

      {/* Messages */}
      {voteStatusMsg && (
        <div style={{
          background: 'var(--success-subtle)',
          color: 'var(--success)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} /> {voteStatusMsg}
        </div>
      )}

      {errorMessage && (
        <div style={{
          background: 'var(--danger-subtle)',
          color: 'var(--danger)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600
        }}>
          <AlertCircle size={18} /> {errorMessage}
        </div>
      )}

      {/* Position Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {elections.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--secondary-gray)' }}>
            <Vote size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-black)', marginBottom: '0.4rem' }}>
              No Committee Elections Open
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              There are no committee nomination positions opened for this event yet.
            </p>
          </div>
        ) : (
          elections.map(pos => {
          const isClosed = pos.is_closed;
          return (
            <div key={pos.id} className="card" style={{ border: isClosed ? '1px solid #10B981' : '1px solid var(--border-color)' }}>
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-black)' }}>
                      {pos.position_title}
                    </h3>
                    {isClosed ? (
                      <span className="badge badge-green">
                        <Award size={12} /> Election Concluded
                      </span>
                    ) : (
                      <span className="badge badge-blue">
                        <Vote size={12} /> Voting Live
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--secondary-gray)', marginTop: '0.2rem' }}>
                    {pos.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {!isClosed && pos.nomination_open && (
                    <button onClick={() => handleOpenNominate(pos)} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                      <Plus size={15} /> Nominate Candidate
                    </button>
                  )}
                  {isAdmin && !isClosed && (
                    <button onClick={() => handleCloseElection(pos.id)} className="btn-dark" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
                      <Lock size={15} /> Close Voting & Elect
                    </button>
                  )}
                </div>
              </div>

              {/* Elected Winner Banner if closed */}
              {isClosed && pos.winner && (
                <div style={{
                  background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                  border: '1px solid #A7F3D0',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Award size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Officially Elected Coordinator
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#064E3B' }}>
                        {pos.winner.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                        Automatically assigned to Organizing Committee (FR-3.5)
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-green" style={{ fontSize: '0.8rem', padding: '0.3rem 0.7rem' }}>
                    🏆 Winning Candidate
                  </span>
                </div>
              )}

              {/* Nominees Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {pos.nominees.length === 0 ? (
                  <div style={{ padding: '1.5rem', background: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--secondary-gray)', gridColumn: '1 / -1' }}>
                    No candidates nominated yet. Be the first to nominate a student leader!
                  </div>
                ) : (
                  pos.nominees.map(cand => {
                    const isWinner = pos.elected_winner_id === cand.candidate_id;
                    const votePercentage = pos.totalVotes > 0 ? Math.round((cand.voteCount / pos.totalVotes) * 100) : 0;

                    return (
                      <div
                        key={cand.id}
                        style={{
                          border: isWinner ? '2px solid #10B981' : '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          background: isWinner ? '#F0FDF4' : 'var(--bg-white)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: cand.candidateAvatar || 'var(--accent-blue)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem'
                              }}>
                                {cand.candidate_name.slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-black)' }}>
                                  {cand.candidate_name}
                                </h4>
                                <span style={{ fontSize: '0.72rem', color: 'var(--secondary-gray)' }}>
                                  {cand.candidateEmail || 'Candidate'}
                                </span>
                              </div>
                            </div>

                            <span className="badge badge-blue">
                              {cand.voteCount} votes ({votePercentage}%)
                            </span>
                          </div>

                          {/* Manifesto */}
                          <div style={{
                            fontSize: '0.8rem',
                            color: 'var(--secondary-gray)',
                            fontStyle: 'italic',
                            background: 'var(--surface-hover)',
                            padding: '0.5rem 0.7rem',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: '0.8rem',
                            lineHeight: 1.4
                          }}>
                            "{cand.manifesto || 'No manifesto provided.'}"
                          </div>

                          {/* Progress bar */}
                          <div style={{ height: '6px', width: '100%', background: 'var(--border-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '0.8rem' }}>
                            <div style={{ width: `${votePercentage}%`, height: '100%', background: isWinner ? '#10B981' : 'var(--accent-blue)', borderRadius: 'var(--radius-full)' }} />
                          </div>
                        </div>

                        {/* Vote Button (FR-3.3, FR-3.6) */}
                        {!isClosed && (
                          <button
                            onClick={() => handleVote(pos.id, cand.candidate_id)}
                            disabled={loading}
                            className="btn-primary"
                            style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem' }}
                          >
                            <UserCheck size={14} /> Vote for {cand.candidate_name.split(' ')[0]}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })
      )}
    </div>

      {/* Nominate Modal (FR-3.2) */}
      {showNominateModal && (
        <div className="modal-overlay" onClick={() => setShowNominateModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">
                <Users size={20} color="var(--accent-blue)" />
                Nominate for: {selectedPosition?.position_title}
              </h2>
            </div>

            <form onSubmit={handleNominateSubmit}>
              <div className="form-group">
                <label className="form-label">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Lee"
                  value={candidateName}
                  onChange={e => setCandidateName(e.target.value)}
                  className="form-input"
                />
                <span className="form-help">You can nominate yourself or another registered student.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Campaign Manifesto / Platform</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Outline key goals, past experience, and why students should vote for this candidate..."
                  value={manifesto}
                  onChange={e => setManifesto(e.target.value)}
                  className="form-textarea"
                />
              </div>

              {errorMessage && (
                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  {errorMessage}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowNominateModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Submitting...' : 'Submit Nomination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
