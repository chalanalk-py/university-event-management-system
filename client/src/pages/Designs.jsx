import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

// Minimal stroke icons (no icon library)
const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const DesignIcon = (p) => <Icon {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>} />;
const PlusIcon = (p) => <Icon {...p} d={<path d="M12 5v14M5 12h14" />} />;
const XIcon = (p) => <Icon {...p} d={<><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>} />;
const TrashIcon = (p) => <Icon {...p} d={<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></>} />;
const MessageIcon = (p) => <Icon {...p} d={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>} />;
const EyeIcon = (p) => <Icon {...p} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>} />;
const UserIcon = (p) => <Icon {...p} d={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />;

const CATEGORIES = ['All', 'Poster', 'T-shirt', 'Stage', 'Logo', 'Banner', 'Merch'];
const UPLOAD_CATEGORIES = ['Poster', 'T-shirt', 'Stage', 'Logo', 'Banner', 'Merch'];

export default function Designs() {
  const { eventId } = useParams();
  const { user, hasRole } = useAuth();
  const canUpload = hasRole('Designer', 'Admin');
  const [designs, setDesigns] = useState([]);
  const [comments, setComments] = useState({});
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [uploadForm, setUploadForm] = useState({ title: '', category: 'Poster', image_url: '', description: '' });

  const load = () => {
    api.get(`/designs/event/${eventId}`).then(r => {
      // Flatten grouped designs into a flat array
      const data = r.data;
      if (Array.isArray(data)) {
        setDesigns(data);
      } else {
        // data is grouped by category: { poster: [...], stage: [...] }
        const flat = [];
        Object.entries(data).forEach(([category, items]) => {
          items.forEach(item => flat.push({ ...item, category: item.category || category }));
        });
        setDesigns(flat);
      }
    });
  };
  useEffect(() => { load(); }, [eventId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('event_id', eventId);
    fd.append('title', uploadForm.title);
    fd.append('category', uploadForm.category.toLowerCase());
    fd.append('description', uploadForm.description);
    if (uploadForm.image_url) {
      fd.append('image_url', uploadForm.image_url);
    }
    await api.post('/designs', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setUploadForm({ title: '', category: 'Poster', image_url: '', description: '' });
    setModalOpen(false);
    load();
  };

  const loadComments = async (designId) => {
    const r = await api.get(`/comments/design/${designId}`);
    setComments(prev => ({ ...prev, [designId]: r.data }));
  };

  const handleComment = async (designId) => {
    await api.post('/comments', { design_id: designId, comment_text: commentText, is_anonymous: isAnonymous });
    setCommentText('');
    setIsAnonymous(false);
    loadComments(designId);
  };

  const handleDeleteComment = async (commentId, designId) => {
    await api.delete(`/comments/${commentId}`);
    loadComments(designId);
  };

  const handleDeleteDesign = async (designId) => {
    await api.delete(`/designs/${designId}`);
    if (selectedDesign?.id === designId) setSelectedDesign(null);
    load();
  };

  const viewDesign = (d) => {
    setSelectedDesign(d);
    loadComments(d.id);
  };

  // Filter designs by active category
  const filteredDesigns = activeCategory === 'All'
    ? designs
    : designs.filter(d => (d.category || '').toLowerCase() === activeCategory.toLowerCase());

  const getCommentCount = (designId) => {
    return (comments[designId] || []).length;
  };

  const getCategoryLabel = (category) => {
    if (!category) return '';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Page Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>
              <DesignIcon size={24} color="#3b82f6" /> Design Showcase & Anonymous Comments
            </h2>
            <p style={styles.subtitle}>
              Proposals categorized by media type with identity-protected feedback for designers 
            </p>
          </div>
          <div style={styles.headerRight}>
            {canUpload && (
              <button style={styles.addBtn} onClick={() => setModalOpen(true)}>
                <PlusIcon size={18} color="#ffffff" /> Upload Design Concept
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={styles.filterBar}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              style={activeCategory === cat ? styles.filterPillActive : styles.filterPill}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Design Cards Grid */}
        {filteredDesigns.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No designs found in this category.</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredDesigns.map(d => (
              <div key={d.id} style={styles.card}>
                {/* Image Area */}
                <div style={styles.cardImageWrapper}>
                  {d.category && (
                    <span style={styles.categoryBadge}>{getCategoryLabel(d.category)}</span>
                  )}
                  {d.file_url ? (
                    <img
                      src={`http://localhost:5000${d.file_url}`}
                      alt={d.title}
                      style={styles.cardImage}
                    />
                  ) : d.image_url ? (
                    <img
                      src={d.image_url}
                      alt={d.title}
                      style={styles.cardImage}
                    />
                  ) : (
                    <div style={styles.cardImagePlaceholder}>
                      <DesignIcon size={48} color="#ccc" />
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div style={styles.cardBody}>
                  <h4 style={styles.cardTitle}>{d.title}</h4>
                  {d.description && (
                    <p style={styles.cardDescription}>{d.description}</p>
                  )}
                  <p style={styles.cardSubmitter}>
                    <UserIcon size={13} color="#888888" />
                    <span>Submitted by: <strong>{d.designer_name || 'Unknown'}</strong></span>
                  </p>
                </div>

                {/* Card Footer */}
                <div style={styles.cardFooter}>
                  <div style={styles.cardFooterLeft}>
                    <span style={styles.commentCount}>
                      <MessageIcon size={14} color="#3b82f6" />
                      {getCommentCount(d.id)} Comments
                    </span>
                  </div>
                  <div style={styles.cardFooterRight}>
                    {(d.designer_id === user?.id || hasRole('Admin')) && (
                      <button
                        style={styles.deleteBtn}
                        onClick={(e) => { e.stopPropagation(); handleDeleteDesign(d.id); }}
                        title="Delete"
                      >
                        <TrashIcon size={14} color="#888888" />
                      </button>
                    )}
                    <button style={styles.viewBtn} onClick={() => viewDesign(d)}>
                      <EyeIcon size={14} color="#3b82f6" /> View & Give Feedback
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Design Modal */}
      {modalOpen && (
        <div style={styles.overlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <DesignIcon size={20} color="#3b82f6" /> Upload New Design Proposal
              </h3>
              <button style={styles.modalCloseBtn} onClick={() => setModalOpen(false)}>
                <XIcon size={18} color="#888888" />
              </button>
            </div>

            <form onSubmit={handleUpload}>
              <label style={styles.label}>Proposal Title</label>
              <input
                style={styles.input}
                placeholder="e.g. Official Gala Poster - Neon Retro"
                value={uploadForm.title}
                onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                required
              />

              <label style={styles.label}>Category</label>
              <select
                style={styles.input}
                value={uploadForm.category}
                onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
              >
                {UPLOAD_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <label style={styles.label}>Image URL / Mockup</label>
              <input
                style={styles.input}
                placeholder="https://images.unsplash.com/photo-..."
                value={uploadForm.image_url}
                onChange={e => setUploadForm({ ...uploadForm, image_url: e.target.value })}
              />
              <p style={styles.inputHint}>Paste an image link or leave blank for high-res creative mockup.</p>

              <label style={styles.label}>Concept Notes & Description</label>
              <textarea
                style={{ ...styles.input, minHeight: 100, resize: 'vertical' }}
                placeholder="Explain your color palette, inspiration, and material recommendations..."
                value={uploadForm.description}
                onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
              />

              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelBtn} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>Publish Proposal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Design + Comments Modal */}
      {selectedDesign && (
        <div style={styles.overlay} onClick={() => setSelectedDesign(null)}>
          <div style={{ ...styles.modal, maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <DesignIcon size={20} color="#3b82f6" /> {selectedDesign.title}
              </h3>
              <button style={styles.modalCloseBtn} onClick={() => setSelectedDesign(null)}>
                <XIcon size={18} color="#888888" />
              </button>
            </div>

            {/* Design Image */}
            <div style={styles.viewImageWrapper}>
              {selectedDesign.file_url ? (
                <img
                  src={`http://localhost:5000${selectedDesign.file_url}`}
                  alt={selectedDesign.title}
                  style={styles.viewImage}
                />
              ) : selectedDesign.image_url ? (
                <img
                  src={selectedDesign.image_url}
                  alt={selectedDesign.title}
                  style={styles.viewImage}
                />
              ) : (
                <div style={{ ...styles.cardImagePlaceholder, height: 250 }}>
                  <DesignIcon size={64} color="#ccc" />
                </div>
              )}
            </div>

            {selectedDesign.description && (
              <p style={styles.viewDescription}>{selectedDesign.description}</p>
            )}

            {/* Comments Section */}
            <div style={styles.commentsSection}>
              <h4 style={styles.commentsTitle}>
                <MessageIcon size={16} color="#3b82f6" /> Comments ({(comments[selectedDesign.id] || []).length})
              </h4>

              {(comments[selectedDesign.id] || []).length === 0 ? (
                <p style={styles.noComments}>No comments yet. Be the first to share feedback!</p>
              ) : (
                <div style={styles.commentsList}>
                  {(comments[selectedDesign.id] || []).map(c => (
                    <div key={c.id} style={styles.commentItem}>
                      <div style={styles.commentHeader}>
                        <span style={styles.commentAuthor}>
                          <UserIcon size={13} color="#3b82f6" /> {c.username}
                        </span>
                        <span style={styles.commentDate}>
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p style={styles.commentText}>{c.comment_text}</p>
                      {hasRole('Admin') && (
                        <button style={styles.deleteCommentBtn} onClick={() => handleDeleteComment(c.id, selectedDesign.id)}>
                          <TrashIcon size={13} color="#888888" /> Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div style={styles.addCommentBox}>
                <textarea
                  style={{ ...styles.input, minHeight: 70, resize: 'vertical' }}
                  placeholder="Write your feedback..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                />
                <div style={styles.commentActions}>
                  <label style={styles.anonymousLabel}>
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={e => setIsAnonymous(e.target.checked)}
                      style={styles.checkbox}
                    />
                    Post Anonymously
                  </label>
                  <button
                    style={styles.submitCommentBtn}
                    onClick={() => handleComment(selectedDesign.id)}
                    disabled={!commentText.trim()}
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  // Page
  page: { background: '#f5f5f5', minHeight: '100vh', padding: '32px 16px' },
  container: { maxWidth: 1320, margin: '0 auto' },

  // Header
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  pageTitle: { display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a2e' },
  subtitle: { margin: '6px 0 0', fontSize: 14, color: '#888888' },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    border: 'none', background: '#3b82f6', color: '#ffffff', borderRadius: 10,
    fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(59,130,246,0.3)',
  },

  // Filter Bar
  filterBar: {
    display: 'flex', gap: 0, background: '#f4f4f5', borderRadius: 12,
    padding: 4, marginBottom: 28, flexWrap: 'wrap', width: 'fit-content',
  },
  filterPill: {
    padding: '8px 20px', border: 'none', background: 'transparent',
    borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#888888',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  filterPillActive: {
    padding: '8px 20px', border: 'none', background: '#ffffff',
    borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#1a1a2e',
    cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },

  // Design Grid
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 24,
  },

  // Design Card
  card: {
    background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 14,
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.2s',
  },
  cardImageWrapper: {
    position: 'relative', width: '100%', height: 220, overflow: 'hidden',
    background: '#1a1a2e',
  },
  categoryBadge: {
    position: 'absolute', top: 12, left: 12, zIndex: 2,
    background: 'rgba(26,26,46,0.75)', color: '#ffffff',
    fontSize: 12, fontWeight: 600, padding: '4px 12px',
    borderRadius: 8, backdropFilter: 'blur(4px)',
  },
  cardImage: {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
  },
  cardImagePlaceholder: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f4f4f5',
  },
  cardBody: { padding: '16px 20px 12px' },
  cardTitle: { margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.3 },
  cardDescription: { margin: '0 0 10px', fontSize: 13, color: '#666666', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  cardSubmitter: { display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontSize: 13, color: '#888888' },

  // Card Footer
  cardFooter: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px', borderTop: '1px solid #f0f0f0', marginTop: 'auto',
  },
  cardFooterLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  cardFooterRight: { display: 'flex', alignItems: 'center', gap: 8 },
  commentCount: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 13, color: '#3b82f6', fontWeight: 500,
  },
  viewBtn: {
    display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
    border: 'none', background: 'transparent', borderRadius: 8,
    fontSize: 13, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer',
  },
  deleteBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, padding: 0, border: '1px solid #fee2e2',
    background: '#fff5f5', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
  },

  // Empty State
  emptyState: {
    background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 14,
    padding: '60px 20px', textAlign: 'center',
  },
  emptyText: { fontSize: 15, color: '#888888' },

  // Modal
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(15,15,30,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000,
  },
  modal: {
    width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto',
    background: '#ffffff', borderRadius: 20, padding: '28px 32px', boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 16, marginBottom: 8, borderBottom: '1px solid #f0f0f0',
  },
  modalTitle: { display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  modalCloseBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer',
  },
  label: { display: 'block', margin: '14px 0 6px', fontSize: 14, fontWeight: 600, color: '#1a1a2e' },
  input: {
    width: '100%', boxSizing: 'border-box', padding: '10px 14px',
    border: '1px solid #e2e2e8', borderRadius: 10, fontSize: 14,
    fontFamily: 'inherit', color: '#1a1a2e', outline: 'none',
  },
  inputHint: { margin: '4px 0 0', fontSize: 12, color: '#888888' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' },
  cancelBtn: {
    padding: '10px 20px', border: '1px solid #e2e2e8', background: '#ffffff',
    borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 20px', border: 'none', background: '#3b82f6',
    borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#ffffff', cursor: 'pointer',
  },

  // View Design Modal extras
  viewImageWrapper: {
    width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 16,
    background: '#1a1a2e',
  },
  viewImage: {
    width: '100%', maxHeight: 400, objectFit: 'contain', display: 'block',
  },
  viewDescription: { margin: '0 0 16px', fontSize: 14, color: '#666666', lineHeight: 1.6 },

  // Comments Section
  commentsSection: {
    borderTop: '1px solid #f0f0f0', paddingTop: 16,
  },
  commentsTitle: {
    display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px',
    fontSize: 16, fontWeight: 700, color: '#1a1a2e',
  },
  noComments: { fontSize: 14, color: '#888888', textAlign: 'center', padding: '20px 0' },
  commentsList: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
  commentItem: {
    background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 16px',
  },
  commentHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  commentAuthor: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 13, fontWeight: 600, color: '#1a1a2e',
  },
  commentDate: { fontSize: 12, color: '#888888' },
  commentText: { margin: 0, fontSize: 13, color: '#666666', lineHeight: 1.5 },
  deleteCommentBtn: {
    display: 'flex', alignItems: 'center', gap: 4, marginTop: 8,
    padding: '4px 10px', border: '1px solid #fee2e2', background: '#fff5f5',
    borderRadius: 6, fontSize: 12, color: '#888888', cursor: 'pointer',
  },

  // Add Comment Box
  addCommentBox: { marginTop: 12 },
  commentActions: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10,
  },
  anonymousLabel: {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888888', cursor: 'pointer',
  },
  checkbox: { accentColor: '#3b82f6' },
  submitCommentBtn: {
    padding: '8px 18px', border: 'none', background: '#3b82f6',
    borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#ffffff', cursor: 'pointer',
  },
};
