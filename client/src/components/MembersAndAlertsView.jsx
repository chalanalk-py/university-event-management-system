import React, { useState } from 'react';
import { Users, AlertTriangle, Send, Shirt, Plus, CheckCircle2, Phone, Calendar, UserCheck, Shield } from 'lucide-react';
import { api } from '../services/api';

export default function MembersAndAlertsView({
  members = [],
  lendingItems = [],
  onRefresh,
  currentUser
}) {
  const [activeSubTab, setActiveSubTab] = useState('members'); // 'members', 'lending', 'broadcast'

  // Broadcast Alert Form states (FR-11.5)
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [targetGroup, setTargetGroup] = useState('All Members & Attendees');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSent, setBroadcastSent] = useState(false);

  // Lending Tracker Form states (P11, P12)
  const [showLendModal, setShowLendModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Costume');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isLendingSubmitting, setIsLendingSubmitting] = useState(false);

  const isOrganizer = currentUser?.role === 'admin' || currentUser?.role === 'coordinator';

  // Handle Broadcast (FR-11.5)
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    setIsBroadcasting(true);
    try {
      await api.broadcastAlert({
        title: alertTitle,
        message: alertMessage,
        targetGroup,
        senderName: currentUser?.full_name || 'Admin'
      });
      setBroadcastSent(true);
      setAlertTitle('');
      setAlertMessage('');
      setTimeout(() => setBroadcastSent(false), 5000);
      onRefresh();
    } catch (err) {
      alert('Failed to send broadcast alert');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Handle Add Lent Item (P11, P12)
  const handleAddLentItem = async (e) => {
    e.preventDefault();
    setIsLendingSubmitting(true);
    try {
      await api.addLentItem({
        itemName,
        category: itemCategory,
        borrowerName,
        borrowerPhone,
        expectedReturnDate,
        notes
      });
      setShowLendModal(false);
      setItemName('');
      setBorrowerName('');
      setBorrowerPhone('');
      setNotes('');
      onRefresh();
    } catch (err) {
      alert('Failed to register lent item');
    } finally {
      setIsLendingSubmitting(false);
    }
  };

  const handleReturnItem = async (id) => {
    try {
      await api.returnLentItem(id);
      onRefresh();
    } catch (err) {
      alert('Error updating returned status');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-black)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={24} color="var(--accent-blue)" /> Event Team, Alerts & Equipment Lending
          </h1>
          <p style={{ color: 'var(--secondary-gray)', fontSize: '0.875rem' }}>
            Committee directory (FR-11), urgent alert broadcasting, and costume lending tracker (P11, P12)
          </p>
        </div>

        {/* Sub Tabs */}
        <div style={{ display: 'flex', background: 'var(--surface-hover)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setActiveSubTab('members')}
            className={`nav-tab-btn ${activeSubTab === 'members' ? 'active' : ''}`}
            style={{ padding: '0.35rem 0.8rem' }}
          >
            <Users size={14} /> Team Roster ({members.length})
          </button>
          <button
            onClick={() => setActiveSubTab('lending')}
            className={`nav-tab-btn ${activeSubTab === 'lending' ? 'active' : ''}`}
            style={{ padding: '0.35rem 0.8rem' }}
          >
            <Shirt size={14} /> Costume & Gear Tracker ({lendingItems.length})
          </button>
          {isOrganizer && (
            <button
              onClick={() => setActiveSubTab('broadcast')}
              className={`nav-tab-btn ${activeSubTab === 'broadcast' ? 'active' : ''}`}
              style={{ padding: '0.35rem 0.8rem', color: '#DC2626' }}
            >
              <AlertTriangle size={14} /> Broadcast Alert
            </button>
          )}
        </div>
      </div>

      {/* 1. MEMBERS LIST (FR-11.1, FR-11.4) */}
      {activeSubTab === 'members' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Users size={18} color="var(--accent-blue)" /> Active Event Organizing Committee & Members
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--secondary-gray)' }}>
              Replaces loose notepad lists with synchronized roles (S13, P15)
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {members.map(member => (
              <div
                key={member.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  background: 'var(--bg-white)'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: member.avatarColor || 'var(--primary-black)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}>
                  {member.name.slice(0, 1).toUpperCase()}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-black)' }}>
                      {member.name}
                    </h4>
                    <span className={`role-badge role-${member.role}`} style={{ fontSize: '0.65rem' }}>
                      {member.role.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600, marginTop: '0.1rem' }}>
                    {member.departmentArea || 'General Member'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--secondary-gray)', marginTop: '0.15rem' }}>
                    {member.email} {member.phone ? `• ${member.phone}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. COSTUME & ITEM LENDING TRACKER (Answers Open Questions P11 & P12) */}
      {activeSubTab === 'lending' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Shirt size={18} color="var(--accent-blue)" /> Costume & Equipment Lending Tracker
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--secondary-gray)', marginTop: '0.2rem' }}>
                Addresses SRS Problem P11 & P12: Tracking who borrowed costumes, AV gear, props and return deadlines.
              </p>
            </div>

            {isOrganizer && (
              <button onClick={() => setShowLendModal(true)} className="btn-primary" style={{ fontSize: '0.8rem' }}>
                <Plus size={15} /> Log Borrowed Item
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--secondary-gray)' }}>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Item Description</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Category</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Borrower & Contact</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Borrowed Date</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Return Due</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                  <th style={{ padding: '0.6rem 0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lendingItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary-gray)' }}>
                      No items currently recorded as borrowed.
                    </td>
                  </tr>
                ) : (
                  lendingItems.map(item => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--primary-black)' }}>{item.item_name}</div>
                        {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--secondary-gray)' }}>{item.notes}</div>}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="badge badge-blue">{item.category}</span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ fontWeight: 600 }}>{item.borrower_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>{item.borrower_phone}</div>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--secondary-gray)' }}>
                        {item.borrowed_date}
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--secondary-gray)' }}>
                        {item.expected_return_date}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {item.is_returned ? (
                          <span className="badge badge-green">
                            <CheckCircle2 size={12} /> Returned
                          </span>
                        ) : (
                          <span className="badge badge-orange">
                            On Loan
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        {!item.is_returned && isOrganizer ? (
                          <button
                            onClick={() => handleReturnItem(item.id)}
                            className="btn-secondary"
                            style={{ fontSize: '0.72rem', padding: '0.25rem 0.55rem' }}
                          >
                            Mark Returned
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--secondary-gray)' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. BROADCAST ALERT (FR-11.5) */}
      {activeSubTab === 'broadcast' && isOrganizer && (
        <div className="card" style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div className="card-header">
            <h3 className="card-title" style={{ color: '#DC2626' }}>
              <AlertTriangle size={20} color="#DC2626" /> Broadcast Emergency / Urgent Alert (FR-11.5)
            </h3>
          </div>

          <form onSubmit={handleSendBroadcast}>
            <p style={{ fontSize: '0.85rem', color: 'var(--secondary-gray)', marginBottom: '1.25rem' }}>
              This notification will immediately be published to all attendees and committee members, appearing in the top banner and live notification feed.
            </p>

            {broadcastSent && (
              <div style={{
                background: 'var(--success-subtle)',
                color: 'var(--success)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                fontSize: '0.825rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 600
              }}>
                <CheckCircle2 size={16} /> Broadcast alert delivered successfully!
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Alert Headline</label>
              <input
                type="text"
                required
                placeholder="e.g. Stage Team: Report to Audio Console Immediately"
                value={alertTitle}
                onChange={e => setAlertTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Recipient Group</label>
              <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)} className="form-select">
                <option value="All Members & Attendees">All Members & Attendees (Campus Wide)</option>
                <option value="Organizing Committee Leads">Organizing Committee Leads Only</option>
                <option value="Transportation Team">Transportation Team</option>
                <option value="Stage & Sound Crew">Stage & Sound Crew</option>
                <option value="Refreshments & Hospitality">Refreshments & Hospitality</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Alert Message</label>
              <textarea
                rows={3}
                required
                placeholder="Provide urgent instructions, emergency contacts, or location details..."
                value={alertMessage}
                onChange={e => setAlertMessage(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="submit"
                disabled={isBroadcasting}
                className="btn-danger"
                style={{ padding: '0.7rem 1.4rem', fontWeight: 700 }}
              >
                <Send size={15} /> {isBroadcasting ? 'Broadcasting...' : 'Broadcast Urgent Alert'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Lent Item Modal (P11, P12) */}
      {showLendModal && (
        <div className="modal-overlay" onClick={() => setShowLendModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">
                <Shirt size={20} color="var(--accent-blue)" /> Register Borrowed Costume / Equipment
              </h2>
            </div>

            <form onSubmit={handleAddLentItem}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victorian Embroidered Drama Coat (Size M)"
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select value={itemCategory} onChange={e => setItemCategory(e.target.value)} className="form-select">
                    <option value="Costume">Costume</option>
                    <option value="Musical Instrument">Musical Instrument</option>
                    <option value="AV Equipment">AV Equipment</option>
                    <option value="Props & Decor">Props & Decor</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Expected Return Date</label>
                  <input
                    type="date"
                    required
                    value={expectedReturnDate}
                    onChange={e => setExpectedReturnDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Borrower Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Student Name"
                    value={borrowerName}
                    onChange={e => setBorrowerName(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Borrower Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={borrowerPhone}
                    onChange={e => setBorrowerPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Condition Notes / Deposit</label>
                <textarea
                  rows={2}
                  placeholder="Items checked, pristine condition, rental agreement details..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowLendModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isLendingSubmitting} className="btn-primary">
                  {isLendingSubmitting ? 'Saving...' : 'Record Borrowed Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
