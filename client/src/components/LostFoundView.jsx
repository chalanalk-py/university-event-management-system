import React, { useState } from 'react';
import { Search, Plus, CheckCircle2, MapPin, Phone, HelpCircle, Check, Eye } from 'lucide-react';
import { api } from '../services/api';

export default function LostFoundView({ items = [], onRefresh, currentUser }) {
  const [filterType, setFilterType] = useState('all'); // 'all', 'lost', 'found'
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [collectionPoint, setCollectionPoint] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResolve = async (id) => {
    try {
      await api.resolveLostFound(id);
      onRefresh();
    } catch (err) {
      alert('Error marking item as resolved');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createLostFound({
        type,
        title,
        description,
        location,
        collectionPoint,
        contactInfo,
        imageUrl,
        postedByName: currentUser?.full_name || 'Student'
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setLocation('');
      setCollectionPoint('');
      setContactInfo('');
      setImageUrl('');
      onRefresh();
    } catch (err) {
      alert('Failed to post item');
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchLoc = item.location?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchLoc;
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-black)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <HelpCircle size={24} color="var(--accent-blue)" /> Lost & Found Desk
          </h1>
          <p style={{ color: 'var(--secondary-gray)', fontSize: '0.875rem' }}>
            Report lost items or claim misplaced belongings with collection points (FR-10.1 – FR-10.4)
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} /> Post Lost / Found Item
        </button>
      </div>

      {/* Filter and Search Bar (FR-10.3) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-gray)' }} />
          <input
            type="text"
            placeholder="Search lost student cards, earphones, keys, bags, lenses..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.4rem' }}
          />
        </div>

        {/* Type Filter Buttons */}
        <div style={{ display: 'flex', background: 'var(--surface-hover)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setFilterType('all')}
            className={`nav-tab-btn ${filterType === 'all' ? 'active' : ''}`}
            style={{ padding: '0.35rem 0.8rem' }}
          >
            All Items
          </button>
          <button
            onClick={() => setFilterType('lost')}
            className={`nav-tab-btn ${filterType === 'lost' ? 'active' : ''}`}
            style={{ padding: '0.35rem 0.8rem', color: filterType === 'lost' ? '#DC2626' : undefined }}
          >
            🚨 Lost Items
          </button>
          <button
            onClick={() => setFilterType('found')}
            className={`nav-tab-btn ${filterType === 'found' ? 'active' : ''}`}
            style={{ padding: '0.35rem 0.8rem', color: filterType === 'found' ? '#059669' : undefined }}
          >
            📦 Found Items
          </button>
        </div>
      </div>

      {/* Items Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--secondary-gray)' }}>
            No items reported in this category.
          </div>
        ) : (
          filtered.map(item => {
            const isResolved = item.status === 'resolved';
            const isLost = item.type === 'lost';

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: '0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: isLost ? '4px solid #EF4444' : '4px solid #10B981',
                  opacity: isResolved ? 0.75 : 1
                }}
              >
                {/* Photo Preview if available */}
                {item.image_url && (
                  <div style={{ height: '170px', background: '#F3F4F6', overflow: 'hidden' }}>
                    <img src={item.image_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}

                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className={`badge ${isLost ? 'badge-orange' : 'badge-green'}`}>
                        {isLost ? '🚨 LOST' : '📦 FOUND'}
                      </span>
                      {isResolved ? (
                        <span className="badge badge-green">
                          <Check size={12} /> Resolved / Claimed
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--secondary-gray)' }}>
                          {item.item_date}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-black)', marginBottom: '0.4rem' }}>
                      {item.title}
                    </h3>

                    <p style={{ fontSize: '0.825rem', color: 'var(--secondary-gray)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                      {item.description}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--primary-black)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <MapPin size={13} color="var(--secondary-gray)" /> Location: <strong>{item.location}</strong>
                      </div>
                      {item.collection_point && (
                        <div>
                          Collection Desk: <strong>{item.collection_point}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                        <Phone size={13} /> {item.contact_info}
                      </div>
                    </div>
                  </div>

                  {/* Resolve Action (FR-10.4) */}
                  {!isResolved && (
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleResolve(item.id)}
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                      >
                        <CheckCircle2 size={13} color="var(--success)" /> Mark as Resolved / Returned
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Post Modal (FR-10.1, FR-10.2) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">
                <HelpCircle size={20} color="var(--accent-blue)" /> Report Lost or Found Item
              </h2>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label className="form-label">Post Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setType('lost')}
                    className={`btn-secondary ${type === 'lost' ? 'active' : ''}`}
                    style={{
                      background: type === 'lost' ? '#FEF2F2' : 'var(--bg-white)',
                      borderColor: type === 'lost' ? '#EF4444' : 'var(--border-color)',
                      color: type === 'lost' ? '#DC2626' : 'var(--primary-black)',
                      fontWeight: 700
                    }}
                  >
                    🚨 I Lost an Item (FR-10.1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('found')}
                    className={`btn-secondary ${type === 'found' ? 'active' : ''}`}
                    style={{
                      background: type === 'found' ? '#ECFDF5' : 'var(--bg-white)',
                      borderColor: type === 'found' ? '#10B981' : 'var(--border-color)',
                      color: type === 'found' ? '#059669' : 'var(--primary-black)',
                      fontWeight: 700
                    }}
                  >
                    📦 I Found an Item (FR-10.2)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Item Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silver Sony Wireless Headphones in Black Case"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Distinctive marks, model, color, contents..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Location (Where Lost / Found)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Main Auditorium Row G"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Collection Point / Handover Desk</label>
                  <input
                    type="text"
                    placeholder="e.g. Security Desk / Helpdesk 2"
                    value={collectionPoint}
                    onChange={e => setCollectionPoint(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Contact Info (Phone / Email)</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 000-0000 or email"
                    value={contactInfo}
                    onChange={e => setContactInfo(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Photo Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Posting...' : 'Post Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
