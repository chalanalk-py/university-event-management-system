import React, { useState } from 'react';
import { Image as ImageIcon, MessageSquare, Plus, Trash2, Eye, Shield, Send, Check } from 'lucide-react';
import { api } from '../services/api';

export default function DesignsView({ designs = [], onRefresh, currentUser }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Poster');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);

  const categories = ['All', 'Poster', 'T-shirt', 'Stage', 'Logo', 'Banner', 'Merch'];

  const filteredDesigns = activeCategory === 'All'
    ? designs
    : designs.filter(d => d.category.toLowerCase() === activeCategory.toLowerCase());

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.uploadDesign({
        title,
        category,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        description,
        designerId: currentUser?.id || 4,
        designerName: currentUser?.full_name || 'Elena Rostova'
      });
      setShowUploadModal(false);
      setTitle('');
      setImageUrl('');
      setDescription('');
      onRefresh();
    } catch (err) {
      alert('Failed to upload design');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (designId) => {
    if (!commentInput.trim()) return;
    setLoading(true);
    try {
      await api.addComment(designId, {
        authorId: currentUser?.id || 2,
        commentText: commentInput,
        isAnonymous: isAnonymous
      });
      setCommentInput('');
      onRefresh();
      // If modal is open, refresh selected design
      if (selectedDesign && selectedDesign.id === designId) {
        const updated = designs.find(d => d.id === designId);
        if (updated) setSelectedDesign(updated);
      }
    } catch (err) {
      alert('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Moderate and remove this comment? (Admin action)')) {
      await api.deleteComment(commentId);
      onRefresh();
      if (selectedDesign) {
        setSelectedDesign(prev => ({
          ...prev,
          comments: prev.comments.filter(c => c.id !== commentId)
        }));
      }
    }
  };

  const isDesignerOrAdmin = currentUser?.role === 'designer' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-black)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ImageIcon size={24} color="var(--accent-blue)" /> Design Showcase & Anonymous Comments
          </h1>
          <p style={{ color: 'var(--secondary-gray)', fontSize: '0.875rem' }}>
            Proposals categorized by media type with identity-protected feedback for designers (FR-4.1 – FR-4.6)
          </p>
        </div>

        {isDesignerOrAdmin && (
          <button onClick={() => setShowUploadModal(true)} className="btn-primary">
            <Plus size={16} /> Upload Design Concept
          </button>
        )}
      </div>

      {/* Category Filter Pills (FR-4.1, FR-4.2) */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`btn-secondary ${activeCategory === cat ? 'active' : ''}`}
            style={{
              padding: '0.4rem 0.9rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              backgroundColor: activeCategory === cat ? 'var(--primary-black)' : 'var(--bg-white)',
              color: activeCategory === cat ? 'white' : 'var(--secondary-gray)',
              border: '1px solid var(--border-color)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {filteredDesigns.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--secondary-gray)' }}>
            <ImageIcon size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-black)', marginBottom: '0.4rem' }}>
              No Design Concepts Yet
            </h3>
            <p style={{ fontSize: '0.85rem' }}>
              No designs have been submitted for this event yet. Student designers and committee members can upload stage backdrops, posters, and merchandise concepts.
            </p>
          </div>
        ) : (
          filteredDesigns.map(design => (
          <div key={design.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Image Preview */}
            <div style={{ position: 'relative', height: '220px', background: '#F3F4F6', overflow: 'hidden' }}>
              <img
                src={design.image_url}
                alt={design.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
              <span style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(17, 24, 39, 0.85)',
                backdropFilter: 'blur(4px)',
                color: 'white',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                {design.category}
              </span>
            </div>

            {/* Content & Details */}
            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-black)', marginBottom: '0.35rem' }}>
                  {design.title}
                </h3>
                <p style={{ fontSize: '0.825rem', color: 'var(--secondary-gray)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                  {design.description || 'No description provided.'}
                </p>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-gray)' }}>
                  Submitted by: <strong>{design.designer_name}</strong>
                </div>
              </div>

              {/* Comments Summary Bar */}
              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                  <MessageSquare size={14} /> {design.comments?.length || 0} Comments
                </span>
                <button
                  onClick={() => setSelectedDesign(design)}
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                >
                  <Eye size={13} /> View & Give Feedback
                </button>
              </div>
            </div>
          </div>
        )))}
      </div>

      {/* Design Detail & Anonymous Comments Modal (FR-4.3, FR-4.4, FR-4.5) */}
      {selectedDesign && (
        <div className="modal-overlay" onClick={() => setSelectedDesign(null)}>
          <div className="modal-card" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">
                <ImageIcon size={20} color="var(--accent-blue)" /> {selectedDesign.title}
              </h2>
            </div>

            {/* Modal Image */}
            <div style={{ width: '100%', maxHeight: '340px', overflow: 'hidden', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              <img src={selectedDesign.image_url} alt={selectedDesign.title} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#F8FAFC' }} />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span className="badge badge-blue">{selectedDesign.category}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--secondary-gray)' }}>
                  By {selectedDesign.designer_name}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--primary-black)' }}>
                {selectedDesign.description}
              </p>
            </div>

            {/* Comments List (FR-4.4: Anonymous comments hide author identity) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Shield size={16} color="var(--accent-blue)" /> Anonymous Peer Comments ({selectedDesign.comments?.length || 0})
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '220px', overflowY: 'auto', marginBottom: '1rem' }}>
                {selectedDesign.comments?.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--secondary-gray)', fontStyle: 'italic' }}>
                    No comments yet. Leave honest feedback below anonymously!
                  </p>
                ) : (
                  selectedDesign.comments.map(c => (
                    <div key={c.id} style={{ background: 'var(--surface-hover)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                          🎭 {c.display_author}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            style={{ background: 'none', color: 'var(--danger)', fontSize: '0.7rem' }}
                            title="Admin remove comment (FR-4.5)"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                      <p style={{ fontSize: '0.825rem', color: 'var(--primary-black)', lineHeight: 1.4 }}>
                        {c.comment_text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Write constructive design feedback..."
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    className="form-input"
                    onKeyDown={e => { if (e.key === 'Enter') handleAddComment(selectedDesign.id); }}
                  />
                  <button
                    onClick={() => handleAddComment(selectedDesign.id)}
                    disabled={loading || !commentInput.trim()}
                    className="btn-primary"
                    style={{ padding: '0.6rem 1rem' }}
                  >
                    <Send size={15} />
                  </button>
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--secondary-gray)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={e => setIsAnonymous(e.target.checked)}
                  />
                  <span>Comment anonymously (Designer will NOT see your identity - FR-4.4)</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => setSelectedDesign(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Design Modal (FR-4.1) */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">
                <ImageIcon size={20} color="var(--accent-blue)" /> Upload New Design Proposal
              </h2>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label className="form-label">Proposal Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Official Gala Poster - Neon Retro"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="form-select">
                  <option value="Poster">Poster</option>
                  <option value="T-shirt">T-shirt</option>
                  <option value="Stage">Stage</option>
                  <option value="Logo">Logo</option>
                  <option value="Banner">Banner</option>
                  <option value="Merch">Merch</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Image URL / Mockup</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="form-input"
                />
                <span className="form-help">Paste an image link or leave blank for high-res creative mockup.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Concept Notes & Description</label>
                <textarea
                  rows={3}
                  placeholder="Explain your color palette, inspiration, and material recommendations..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Uploading...' : 'Publish Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
