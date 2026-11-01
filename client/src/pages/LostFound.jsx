import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { SERVER_URL } from '../api';

export default function LostFound() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'lost', 'found'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [modalForm, setModalForm] = useState({
    type: 'lost',
    title: '',
    description: '',
    location: '',
    collection_point: '',
    contact_info: '',
    photo_url: ''
  });

  const load = () => {
    api.get(`/lost-found/event/${eventId}`)
      .then(r => setPosts(r.data || []))
      .catch(() => setPosts([]));
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    try {
      // Compose title and contact info into description to ensure backwards and schema compatibility
      let fullDescription = modalForm.description.trim();
      if (modalForm.title.trim()) {
        fullDescription = `${modalForm.title.trim()}\n\n${fullDescription}`;
      }
      if (modalForm.contact_info.trim()) {
        fullDescription = `${fullDescription}\n\nContact: ${modalForm.contact_info.trim()}`;
      }

      const payload = {
        event_id: eventId,
        description: fullDescription || 'No description provided',
        location: modalForm.location || '',
        collection_point: modalForm.collection_point || '',
        photo_url: modalForm.photo_url || null
      };

      const endpoint = modalForm.type === 'found' ? '/lost-found/found' : '/lost-found/lost';
      await api.post(endpoint, payload);

      setModalForm({
        type: 'lost',
        title: '',
        description: '',
        location: '',
        collection_point: '',
        contact_info: '',
        photo_url: ''
      });
      setIsModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to submit post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await api.patch(`/lost-found/${id}/resolve`);
      load();
    } catch (err) {
      console.error('Failed to resolve post:', err);
    }
  };

  const parsePost = (p) => {
    let title = '';
    let desc = p.description || '';
    let contact = '';

    if (desc.includes('\n\nContact: ')) {
      const parts = desc.split('\n\nContact: ');
      desc = parts[0];
      contact = parts[1] || '';
    } else if (desc.includes('Contact: ')) {
      const parts = desc.split('Contact: ');
      desc = parts[0];
      contact = parts[1] || '';
    }

    if (desc.includes('\n\n')) {
      const parts = desc.split('\n\n');
      title = parts[0];
      desc = parts.slice(1).join('\n\n');
    } else {
      title = desc;
      desc = '';
    }

    return { title, desc, contact };
  };

  const getImageSrc = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    if (url.startsWith('/uploads/')) return `${SERVER_URL}${url}`;
    return url;
  };

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'lost' && p.type !== 'lost') return false;
    if (activeTab === 'found' && p.type !== 'found') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchLoc = (p.location || '').toLowerCase().includes(q);
      const matchCp = (p.collection_point || '').toLowerCase().includes(q);
      if (!matchDesc && !matchLoc && !matchCp) return false;
    }

    return true;
  });

  return (
    <div className="lostfound-container">
      {/* Header */}
      <header className="lostfound-header">
        <div className="lostfound-title-wrap">
          <div className="lostfound-title-row">
            <svg className="lostfound-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <h1 className="lostfound-title">Lost &amp; Found Desk</h1>
          </div>
          <p className="lostfound-subtitle">
            Report lost items or claim misplaced belongings with collection points
          </p>
        </div>

        <button
          className="btn-post-item"
          onClick={() => {
            setFormError('');
            setIsModalOpen(true);
          }}
        >
          <span>+ Post Lost / Found Item</span>
        </button>
      </header>

      {/* Controls: Search + Filter Tabs */}
      <div className="lostfound-controls">
        <div className="lostfound-search-wrap">
          <svg className="lostfound-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="lostfound-search-input"
            placeholder="Search lost student cards, earphones, keys, bags, lenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="lostfound-filter-tabs">
          <button
            type="button"
            className={`lostfound-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Items
          </button>
          <button
            type="button"
            className={`lostfound-tab-btn ${activeTab === 'lost' ? 'active' : ''}`}
            onClick={() => setActiveTab('lost')}
          >
            <span>🚨 Lost Items</span>
          </button>
          <button
            type="button"
            className={`lostfound-tab-btn ${activeTab === 'found' ? 'active' : ''}`}
            onClick={() => setActiveTab('found')}
          >
            <span>📦 Found Items</span>
          </button>
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="empty-events-state">
          <div className="empty-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <h3>No items found</h3>
          <p>{searchQuery ? 'Try clearing your search query.' : 'Click "+ Post Lost / Found Item" to report something!'}</p>
        </div>
      ) : (
        <div className="lostfound-grid">
          {filteredPosts.map((p) => {
            const { title, desc, contact } = parsePost(p);
            const imgSrc = getImageSrc(p.photo_url);
            const isResolved = p.status === 'resolved';
            const dateStr = p.post_date ? String(p.post_date).slice(0, 10) : (p.created_at ? String(p.created_at).slice(0, 10) : '');

            return (
              <div key={p.id} className={`lostfound-card ${p.type === 'lost' ? 'card-lost' : 'card-found'}`}>
                {/* Image Section */}
                <div className="lostfound-card-img-wrap">
                  {imgSrc ? (
                    <img src={imgSrc} alt={title} className="lostfound-card-img" />
                  ) : (
                    <div className="lostfound-no-img">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span>No Photo Attached</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="lostfound-card-body">
                  <div className="lostfound-card-content">
                    {/* Status Row */}
                    <div className="card-badges-row">
                      {p.type === 'lost' ? (
                        <span className="badge-lost">🚨 LOST</span>
                      ) : (
                        <span className="badge-found">📦 FOUND</span>
                      )}

                      {isResolved ? (
                        <span className="badge-resolved">✓ Resolved / Claimed</span>
                      ) : (
                        dateStr && <span className="card-date">{dateStr}</span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <h3 className="lostfound-card-title">{title}</h3>
                    {desc && <p className="lostfound-card-desc">{desc}</p>}

                    {/* Meta Details */}
                    <div className="card-meta-list">
                      {p.location && (
                        <div className="card-meta-item">
                          <svg className="card-meta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                          </svg>
                          <span><strong>Location:</strong> {p.location}</span>
                        </div>
                      )}

                      {p.collection_point && (
                        <div className="card-meta-item">
                          <svg className="card-meta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                          </svg>
                          <span><strong>Collection Desk:</strong> {p.collection_point}</span>
                        </div>
                      )}

                      {contact && (
                        <div className="card-meta-item">
                          {contact.includes('@') ? (
                            <svg className="card-meta-contact-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                              <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                          ) : (
                            <svg className="card-meta-contact-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                          )}
                          <span className="contact-text">{contact}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resolve Button */}
                  {!isResolved && (
                    <button
                      className="btn-mark-resolved"
                      onClick={() => handleResolve(p.id)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      <span>Mark as Resolved / Returned</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Lost or Found Item Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="create-event-modal lostfound-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lostfound-modal-header">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="1" x2="12.01" y2="1"></line>
              </svg>
              <h2 className="lostfound-modal-title">Report Lost or Found Item</h2>
            </div>

            {formError && <div className="form-error-msg">{formError}</div>}

            <form onSubmit={handlePostSubmit} className="create-event-form">
              {/* Post Type Selector (Without FR-10.1 and FR-10.2) */}
              <div className="form-group">
                <label>Post Type</label>
                <div className="post-type-toggle">
                  <button
                    type="button"
                    className={`btn-type-option ${modalForm.type === 'lost' ? 'active-lost' : ''}`}
                    onClick={() => setModalForm({ ...modalForm, type: 'lost' })}
                  >
                    <span>🚨 I Lost an Item</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-type-option ${modalForm.type === 'found' ? 'active-found' : ''}`}
                    onClick={() => setModalForm({ ...modalForm, type: 'found' })}
                  >
                    <span>📦 I Found an Item</span>
                  </button>
                </div>
              </div>

              {/* Item Title */}
              <div className="form-group">
                <label>Item Title</label>
                <input
                  type="text"
                  placeholder="e.g. Silver Sony Wireless Headphones in Black Case"
                  value={modalForm.title}
                  onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                  required
                />
              </div>

              {/* Detailed Description */}
              <div className="form-group">
                <label>Detailed Description</label>
                <textarea
                  placeholder="Distinctive marks, model, color, contents..."
                  value={modalForm.description}
                  onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                />
              </div>

              {/* Location & Collection Point */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Location (Where Lost / Found)</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Auditorium Row G"
                    value={modalForm.location}
                    onChange={(e) => setModalForm({ ...modalForm, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Collection Point / Handover Desk</label>
                  <input
                    type="text"
                    placeholder="e.g. Security Desk / Helpdesk 2"
                    value={modalForm.collection_point}
                    onChange={(e) => setModalForm({ ...modalForm, collection_point: e.target.value })}
                  />
                </div>
              </div>

              {/* Contact Info & Photo Image URL */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Contact Info (Phone / Email)</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000 or email"
                    value={modalForm.contact_info}
                    onChange={(e) => setModalForm({ ...modalForm, contact_info: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Photo Image URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={modalForm.photo_url}
                    onChange={(e) => setModalForm({ ...modalForm, photo_url: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="lostfound-modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit lostfound-btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Posting...' : 'Post Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
