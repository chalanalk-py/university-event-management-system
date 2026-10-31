import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CATEGORIES = ['Coordinator', 'Transportation', 'Music Circle', 'Refreshments', 'Costume Rental', 'Technical/AV', 'General'];
const emptyForm = { name: '', phone: '', email: '', notes: '', category: 'Transportation', is_vip: false };

// Minimal stroke icons (no icon library)
const Icon = ({ d, size = 16, color = 'currentColor', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const PhoneIcon = (p) => <Icon {...p} d={<><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" /><path d="M14.05 2a9 9 0 0 1 8 7.94M14.05 6A5 5 0 0 1 18 10" /></>} />;
const MailIcon = (p) => <Icon {...p} d={<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></>} />;
const StarIcon = (p) => <Icon {...p} d={<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />} />;
const ShieldIcon = (p) => <Icon {...p} d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />} />;
const SearchIcon = (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>} />;
const PlusIcon = (p) => <Icon {...p} d={<path d="M12 5v14M5 12h14" />} />;
const TrashIcon = (p) => <Icon {...p} d={<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />} />;
const EditIcon = (p) => <Icon {...p} d={<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>} />;

export default function Contacts() {
  const { eventId } = useParams();
  const { hasRole } = useAuth();
  const canEdit = hasRole('Admin', 'Coordinator');
  const [contacts, setContacts] = useState([]);
  const [memberCoordinators, setMemberCoordinators] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [vipOnly, setVipOnly] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    api.get(`/contacts/event/${eventId}`).then(r => setContacts(r.data));
    api.get(`/contacts/coordinators/${eventId}`).then(r => setMemberCoordinators(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [eventId]);

  // Search, category and VIP filtering happen in the browser
  const term = search.trim().toLowerCase();
  const visible = contacts.filter(c =>
    (filter === 'All' || c.category === filter) &&
    (!vipOnly || c.is_vip) &&
    (!term || [c.name, c.notes, c.phone, c.email, c.category].some(v => v && v.toLowerCase().includes(term)))
  );
  const coordinatorContacts = contacts.filter(c => c.category === 'Coordinator');

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '', notes: c.notes || '', category: c.category || 'General', is_vip: !!c.is_vip });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/contacts/${editing.id}`, form);
      else await api.post('/contacts', { ...form, event_id: parseInt(eventId) });
      closeModal();
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const toggleVip = async (c) => {
    await api.put(`/contacts/${c.id}`, { is_vip: !c.is_vip });
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this contact?')) return;
    await api.delete(`/contacts/${id}`);
    load();
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}><PhoneIcon size={24} color="#3b82f6" /> Directory & Service Contacts</h2>
          {canEdit && <button style={styles.addBtn} onClick={openAdd}><PlusIcon size={18} color="#ffffff" /> Add Contact</button>}
        </div>

        {(coordinatorContacts.length > 0 || memberCoordinators.length > 0) && (
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTitle}><ShieldIcon size={17} color="#60a5fa" /> Event Area Coordinators (Who is in Charge)</span>
              <span style={styles.panelTag}>Direct Student Leads</span>
            </div>
            <div style={styles.panelGrid}>
              {coordinatorContacts.map(c => (
                <div key={`c${c.id}`} style={styles.coordCard}>
                  <div style={styles.coordName}>{c.name}</div>
                  {c.notes && <p style={styles.coordNotes}>{c.notes}</p>}
                  {c.phone && <div style={styles.coordPhone}><PhoneIcon size={13} color="#93c5fd" /> {c.phone}</div>}
                </div>
              ))}
              {/* Coordinators assigned through event membership, when not already listed as contacts */}
              {memberCoordinators
                .filter(m => !coordinatorContacts.some(c => c.email && c.email === m.email))
                .map(m => (
                  <div key={`m${m.id}`} style={styles.coordCard}>
                    <div style={styles.coordName}>{m.username}{m.area && ` (${m.area})`}</div>
                    {m.email && <div style={styles.coordPhone}><MailIcon size={13} color="#93c5fd" /> {m.email}</div>}
                  </div>
                ))}
            </div>
          </div>
        )}

        <div style={styles.searchRow}>
          <div style={styles.searchBox}>
            <SearchIcon size={17} color="#888888" />
            <input style={styles.searchInput} placeholder="Search vendor, transport, music circle, or costume service..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button style={vipOnly ? styles.vipBtnActive : styles.vipBtn} onClick={() => setVipOnly(!vipOnly)}>
            <StarIcon size={16} color="#f59e0b" fill={vipOnly ? '#f59e0b' : 'none'} /> VIP / Valuable Contacts
          </button>
        </div>

        <div style={styles.chips}>
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat} style={filter === cat ? styles.chipActive : styles.chip} onClick={() => setFilter(cat)}>{cat}</button>
          ))}
        </div>

        {visible.length === 0 && <p style={styles.empty}>No contacts found.</p>}

        <div style={styles.grid}>
          {visible.map(c => (
            <div key={c.id} style={{ ...styles.card, ...(c.is_vip ? styles.cardVip : {}) }}>
              <div style={styles.cardTop}>
                <span style={styles.pill}>{c.category}</span>
                <button style={styles.starBtn} onClick={() => canEdit && toggleVip(c)} disabled={!canEdit}
                  title={c.is_vip ? 'Unmark as VIP' : 'Mark as VIP'}>
                  <StarIcon size={18} color="#f59e0b" fill={c.is_vip ? '#f59e0b' : 'none'} />
                </button>
              </div>
              <h3 style={styles.cardTitle}>{c.name}</h3>
              {c.notes && <p style={styles.notes}>{c.notes}</p>}

              <div style={styles.cardFooter}>
                {c.phone && (
                  <div style={styles.contactRow}>
                    <span style={styles.phone}><PhoneIcon size={14} color="#3b82f6" /> {c.phone}</span>
                    <a style={styles.linkBtn} href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>Call</a>
                  </div>
                )}
                {c.email && (
                  <div style={styles.contactRow}>
                    <span style={styles.email}><MailIcon size={14} color="#888888" /> {c.email}</span>
                    <a style={styles.linkBtn} href={`mailto:${c.email}`}>Email</a>
                  </div>
                )}
                {canEdit && (
                  <div style={styles.manageRow}>
                    <button style={styles.editLink} onClick={() => openEdit(c)}><EditIcon size={13} color="#3b82f6" /> Edit</button>
                    <button style={styles.removeLink} onClick={() => handleDelete(c.id)}><TrashIcon size={13} color="#ef4444" /> Remove</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div style={styles.overlay} onClick={closeModal}>
          <form style={styles.modal} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3 style={styles.modalTitle}><PhoneIcon size={20} color="#3b82f6" /> {editing ? 'Edit Service / Vendor Contact' : 'Add Service / Vendor Contact'}</h3>

            <label style={styles.label}>Service / Contact Name</label>
            <input style={styles.input} placeholder="e.g. Metro City Shuttle Fleet" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />

            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Phone Number</label>
                <input style={styles.input} placeholder="+1 (555) 000-0000" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Role / Category</label>
                <select style={styles.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <label style={styles.label}>Email Address (Optional)</label>
            <input type="email" style={styles.input} placeholder="vendor@domain.com" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />

            <label style={styles.label}>Notes & Specifications</label>
            <textarea style={{ ...styles.input, minHeight: 56, resize: 'vertical' }} placeholder="Contract terms, fleet size, discounts, rental terms..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

            <label style={styles.checkRow}>
              <input type="checkbox" checked={form.is_vip} onChange={e => setForm({ ...form, is_vip: e.target.checked })} />
              Mark as Important / Valuable Contact
            </label>

            <div style={styles.modalFooter}>
              <button type="button" style={styles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button type="submit" style={styles.saveBtn}>{editing ? 'Update Contact' : 'Save Contact'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { background: '#f5f5f5', minHeight: '100vh', padding: '32px 16px' },
  container: { maxWidth: 1320, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  title: { display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: 24, fontWeight: 700, color: '#1a1a2e' },
  addBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', background: '#3b82f6', color: '#ffffff', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' },

  panel: { background: 'linear-gradient(135deg, #1a1a2e 0%, #0f172a 100%)', borderRadius: 16, padding: '22px 24px', marginBottom: 24 },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  panelTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#ffffff' },
  panelTag: { fontSize: 13, color: '#cbd5e1' },
  panelGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  coordCard: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: 16 },
  coordName: { fontSize: 15, fontWeight: 700, color: '#93c5fd', lineHeight: 1.4 },
  coordNotes: { margin: '6px 0 0', fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 },
  coordPhone: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 14, color: '#ffffff' },

  searchRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 },
  searchBox: { flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 10, background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 10, padding: '0 14px' },
  searchInput: { flex: 1, border: 'none', outline: 'none', padding: '11px 0', fontSize: 14, fontFamily: 'inherit', background: 'transparent', color: '#1a1a2e' },
  vipBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '1px solid #e8e8e8', background: '#ffffff', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer' },
  vipBtnActive: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', border: '2px solid #3b82f6', background: '#ffffff', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer' },

  chips: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: { padding: '5px 14px', border: '1px solid #e8e8e8', background: '#ffffff', borderRadius: 999, fontSize: 13, color: '#1a1a2e', cursor: 'pointer' },
  chipActive: { padding: '5px 14px', border: '1px solid #1a1a2e', background: '#1a1a2e', borderRadius: 999, fontSize: 13, fontWeight: 600, color: '#ffffff', cursor: 'pointer' },
  empty: { color: '#888888', textAlign: 'center', padding: 40 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  card: { display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '20px 24px' },
  cardVip: { borderLeft: '4px solid #f59e0b' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  pill: { background: '#eff6ff', color: '#3b82f6', borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 500 },
  starBtn: { display: 'flex', padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' },
  cardTitle: { margin: 0, fontSize: 17, fontWeight: 700, color: '#1a1a2e' },
  notes: { margin: '6px 0 0', fontSize: 14, color: '#666666', lineHeight: 1.5 },
  cardFooter: { marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 },
  contactRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  phone: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: '#1a1a2e' },
  email: { display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, fontSize: 13, color: '#666666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  linkBtn: { padding: '2px 8px', border: '1px solid #e8e8e8', borderRadius: 6, fontSize: 12, color: '#1a1a2e', textDecoration: 'underline', background: '#ffffff' },
  manageRow: { display: 'flex', justifyContent: 'flex-end', gap: 14 },
  editLink: { display: 'flex', alignItems: 'center', gap: 4, padding: 0, border: 'none', background: 'transparent', fontSize: 12, color: '#3b82f6', cursor: 'pointer' },
  removeLink: { display: 'flex', alignItems: 'center', gap: 4, padding: 0, border: 'none', background: 'transparent', fontSize: 12, color: '#ef4444', cursor: 'pointer' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,15,30,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 },
  modal: { display: 'block', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', margin: 0, background: '#ffffff', borderRadius: 20, padding: '28px 32px' },
  modalTitle: { display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px', paddingBottom: 14, borderBottom: '1px solid #f0f0f0', fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  label: { display: 'block', margin: '14px 0 6px', fontSize: 14, fontWeight: 600, color: '#1a1a2e' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #e2e2e8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#1a1a2e', background: '#ffffff', outline: 'none' },
  checkRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 13, color: '#1a1a2e', cursor: 'pointer' },
  row: { display: 'flex', gap: 12 },
  col: { flex: 1, minWidth: 0 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  cancelBtn: { padding: '10px 20px', border: '1px solid #e2e2e8', background: '#ffffff', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer' },
  saveBtn: { padding: '10px 20px', border: 'none', background: '#3b82f6', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#ffffff', cursor: 'pointer' },
};
