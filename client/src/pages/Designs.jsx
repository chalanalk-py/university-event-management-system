import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Designs() {
  const { eventId } = useParams();
  const { user, hasRole } = useAuth();
  const [designs, setDesigns] = useState({});
  const [comments, setComments] = useState({});
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', category: 'poster' });
  const [file, setFile] = useState(null);

  const load = () => api.get(`/designs/event/${eventId}`).then(r => setDesigns(r.data));
  useEffect(() => { load(); }, [eventId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('file', file);
    fd.append('event_id', eventId);
    fd.append('title', uploadForm.title);
    fd.append('category', uploadForm.category);
    await api.post('/designs', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setUploadForm({ title: '', category: 'poster' });
    setFile(null);
    load();
  };

  const loadComments = async (designId) => {
    const r = await api.get(`/comments/design/${designId}`);
    setComments({ ...comments, [designId]: r.data });
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
    load();
  };

  const viewDesign = (d) => {
    setSelectedDesign(d);
    loadComments(d.id);
  };

  const categories = ['poster', 't-shirt', 'stage', 'logo', 'social media flyer', 'other'];

  return (
    <div className="page">
      <h2>Designs Gallery</h2>

      {hasRole('Designer', 'Admin') && (
        <form onSubmit={handleUpload}>
          <h3>Upload Design</h3>
          <input placeholder="Title" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} required />
          <select value={uploadForm.category} onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="file" onChange={e => setFile(e.target.files[0])} required />
          <button type="submit">Upload</button>
        </form>
      )}

      {Object.entries(designs).map(([category, items]) => (
        <div key={category}>
          <h3>{category.toUpperCase()}</h3>
          <div className="design-grid">
            {items.map(d => (
              <div key={d.id} className="design-card" onClick={() => viewDesign(d)}>
                <img src={`http://localhost:5000${d.file_url}`} alt={d.title} style={{ maxWidth: '150px' }} />
                <p><strong>{d.title}</strong></p>
                <p>By {d.designer_name}</p>
                {(d.designer_id === user?.id || hasRole('Admin')) && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteDesign(d.id); }}>Delete</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {selectedDesign && (
        <div className="modal">
          <div className="modal-content">
            <button onClick={() => setSelectedDesign(null)}>Close</button>
            <h3>{selectedDesign.title}</h3>
            <img src={`http://localhost:5000${selectedDesign.file_url}`} alt={selectedDesign.title} style={{ maxWidth: '400px' }} />

            <h4>Comments</h4>
            <ul>
              {(comments[selectedDesign.id] || []).map(c => (
                <li key={c.id}>
                  <strong>{c.username}</strong>: {c.comment_text}
                  <small> ({new Date(c.created_at).toLocaleString()})</small>
                  {hasRole('Admin') && <button onClick={() => handleDeleteComment(c.id, selectedDesign.id)}>Remove</button>}
                </li>
              ))}
            </ul>

            <div>
              <textarea placeholder="Add comment..." value={commentText} onChange={e => setCommentText(e.target.value)} />
              <label><input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} /> Anonymous</label>
              <button onClick={() => handleComment(selectedDesign.id)}>Comment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
