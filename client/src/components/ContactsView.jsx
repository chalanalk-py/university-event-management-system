import React, { useState } from 'react';
import { PhoneCall, Mail, Star, Search, Plus, Trash2, Shield, User, ExternalLink, Filter } from 'lucide-react';
import { api } from '../services/api';

export default function ContactsView({ contacts = [], onRefresh, currentUser }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showValuableOnly, setShowValuableOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Transportation');
  const [notes, setNotes] = useState('');
  const [isValuable, setIsValuable] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = [
    'All',
    'Coordinator',
    'Transportation',
    'Music Circle',
    'Refreshments',
    'Costume Rental',
    'Technical/AV',
    'General'
  ];

  const handleToggleValuable = async (id) => {
    try {
      await api.toggleValuable(id);
      onRefresh();
    } catch (err) {
      alert('Error updating valuable status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this contact?')) {
      await api.deleteContact(id);
      onRefresh();
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createContact({
        name,
        phone,
        email,
        category,
        notes,
        isValuable
      });
      setShowAddModal(false);
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setIsValuable(false);
      onRefresh();
    } catch (err) {
      alert('Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts
  const filtered = contacts.filter(c => {
    if (activeCategory !== 'All' && c.category !== activeCategory) return false;
    if (showValuableOnly && !c.is_valuable) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      const matchNotes = c.notes?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      return matchName || matchPhone || matchNotes || matchEmail;
    }
    return true;
  });

  // Coordinator showcase (FR-5.5)
  const coordinators = contacts.filter(c => c.category === 'Coordinator');
  const isOrganizer = currentUser?.role === 'admin' || currentUser?.role === 'coordinator';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-black)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <PhoneCall size={24} color="var(--accent-blue)" /> Directory & Service Contacts
          </h1>
          <p style={{ color: 'var(--secondary-gray)', fontSize: '0.875rem' }}>
            Categorized vendor phone numbers, rental services, and area leads (FR-5.1 – FR-5.5)
          </p>
        </div>

        {isOrganizer && (
          <button onClick={() => setShowAddModal(true)} className="btn-primary">
            <Plus size={16} /> Add Contact
          </button>
        )}
      </div>

      {/* Coordinators Showcase Card (FR-5.5) */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
            <Shield size={18} color="var(--accent-blue)" /> Event Area Coordinators (Who is in Charge)
          </div>
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Direct Student Leads
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: coordinators.length ? 'repeat(auto-fill, minmax(250px, 1fr))' : '1fr', gap: '1rem' }}>
          {coordinators.length === 0 ? (
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', opacity: 0.75, textAlign: 'center' }}>
              No area coordinators registered for this event yet.
            </div>
          ) : (
            coordinators.map(coord => (
              <div key={coord.id} style={{ background: 'rgba(255, 255, 255, 0.08)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#93C5FD' }}>
                  {coord.name}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, margin: '0.15rem 0 0.5rem' }}>
                  {coord.notes || 'Area Lead'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.78rem' }}>
                  <a href={`tel:${coord.phone}`} style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <PhoneCall size={12} color="#60A5FA" /> {coord.phone}
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Search and Category Filters (FR-5.3, FR-5.4) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-gray)' }} />
            <input
              type="text"
              placeholder="Search vendor, transport, music circle, or costume service..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Starred / Valuable Toggle (FR-5.4) */}
          <button
            onClick={() => setShowValuableOnly(!showValuableOnly)}
            className={`btn-secondary ${showValuableOnly ? 'active' : ''}`}
            style={{
              borderColor: showValuableOnly ? '#F59E0B' : 'var(--border-color)',
              background: showValuableOnly ? '#FEF3C7' : 'var(--bg-white)',
              color: showValuableOnly ? '#B45309' : 'var(--primary-black)'
            }}
          >
            <Star size={15} fill={showValuableOnly ? '#F59E0B' : 'none'} color="#F59E0B" />
            <span>VIP / Valuable Contacts</span>
          </button>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="btn-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                background: activeCategory === cat ? 'var(--primary-black)' : 'var(--bg-white)',
                color: activeCategory === cat ? 'white' : 'var(--secondary-gray)',
                border: '1px solid var(--border-color)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--secondary-gray)' }}>
            No contacts match your query. Try clearing filters or search term.
          </div>
        ) : (
          filtered.map(contact => (
            <div
              key={contact.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: contact.is_valuable ? '4px solid #F59E0B' : '1px solid var(--border-color)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-blue">
                    {contact.category}
                  </span>
                  <button
                    onClick={() => handleToggleValuable(contact.id)}
                    style={{ background: 'none', border: 'none', padding: '0.2rem' }}
                    title={contact.is_valuable ? 'Marked as Valuable / VIP' : 'Mark as Valuable'}
                  >
                    <Star
                      size={18}
                      color="#F59E0B"
                      fill={contact.is_valuable ? '#F59E0B' : 'none'}
                    />
                  </button>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-black)', marginBottom: '0.35rem' }}>
                  {contact.name}
                </h3>

                <p style={{ fontSize: '0.825rem', color: 'var(--secondary-gray)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                  {contact.notes || 'No notes provided.'}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-black)', fontWeight: 600 }}>
                      <PhoneCall size={13} color="var(--accent-blue)" /> {contact.phone}
                    </span>
                    <a href={`tel:${contact.phone}`} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>
                      Call
                    </a>
                  </div>

                  {contact.email && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--secondary-gray)' }}>
                        <Mail size={13} /> {contact.email}
                      </span>
                      <a href={`mailto:${contact.email}`} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>
                        Email
                      </a>
                    </div>
                  )}
                </div>

                {isOrganizer && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      style={{ background: 'none', color: 'var(--danger)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Contact Modal (FR-5.1) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">
                <PhoneCall size={20} color="var(--accent-blue)" /> Add Service / Vendor Contact
              </h2>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Service / Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro City Shuttle Fleet"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role / Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="form-select">
                    <option value="Transportation">Transportation</option>
                    <option value="Music Circle">Music Circle</option>
                    <option value="Refreshments">Refreshments</option>
                    <option value="Costume Rental">Costume Rental</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="Technical/AV">Technical/AV</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="vendor@domain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Specifications</label>
                <textarea
                  rows={2}
                  placeholder="Contract terms, fleet size, discounts, rental terms..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  checked={isValuable}
                  onChange={e => setIsValuable(e.target.checked)}
                />
                <span>Mark as Important / Valuable Contact (FR-5.4)</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
