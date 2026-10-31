import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const DEFAULT_COLOR = '#3b82f6';
const emptyForm = { title: '', description: '', speaker: '', start: '10:00', end: '11:00', location: '', color: DEFAULT_COLOR };

// Format a Date as YYYY-MM-DD using local time
const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// Format a timestamp as HH:MM using local time
const toTimeStr = (ts) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Minimal stroke icons (no icon library)
const Icon = ({ d, size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);
const CalendarIcon = (p) => <Icon {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>} />;
const ClockIcon = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>} />;
const PinIcon = (p) => <Icon {...p} d={<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></>} />;
const UserIcon = (p) => <Icon {...p} d={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />;
const EditIcon = (p) => <Icon {...p} d={<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>} />;
const TrashIcon = (p) => <Icon {...p} d={<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></>} />;
const ListIcon = (p) => <Icon {...p} d={<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />} />;
const GridIcon = (p) => <Icon {...p} d={<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18M15 3v18" /></>} />;
const PlusIcon = (p) => <Icon {...p} d={<path d="M12 5v14M5 12h14" />} />;

export default function Schedule() {
  const { eventId } = useParams();
  const { hasRole } = useAuth();
  const canEdit = hasRole('Admin', 'Coordinator', 'Event Member');
  const [activities, setActivities] = useState([]);
  const [eventDate, setEventDate] = useState(toDateStr(new Date()));
  const [form, setForm] = useState(emptyForm);
  const [warning, setWarning] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => api.get(`/schedule/event/${eventId}`).then(r => setActivities(r.data));
  useEffect(() => {
    load();
    api.get(`/events/${eventId}`).then(r => setEventDate(toDateStr(new Date(r.data.event_date)))).catch(() => {});
  }, [eventId]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title,
      description: a.description || '',
      speaker: a.speaker || '',
      start: toTimeStr(a.start_time),
      end: toTimeStr(a.end_time),
      location: a.location || '',
      color: a.color || DEFAULT_COLOR,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setWarning(null);
    if (form.end <= form.start) {
      setWarning({ message: 'End time must be after start time' });
      return;
    }
    // Activities keep their own date when edited; new ones use the event date
    const date = editing ? toDateStr(new Date(editing.start_time)) : eventDate;
    const payload = {
      event_id: eventId,
      title: form.title,
      description: form.description,
      speaker: form.speaker,
      location: form.location,
      color: form.color,
      start_time: `${date}T${form.start}`,
      end_time: `${date}T${form.end}`,
    };
    try {
      if (editing) {
        await api.put(`/schedule/${editing.id}`, payload);
      } else {
        const res = await api.post('/schedule', payload);
        if (res.data.warning) setWarning(res.data.warning);
      }
      closeModal();
      load();
    } catch (err) {
      if (err.response?.data?.conflicts) {
        setWarning(err.response.data);
        closeModal();
      } else alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    await api.delete(`/schedule/${id}`);
    load();
  };

  const timeRange = (a) => `${toTimeStr(a.start_time)} - ${toTimeStr(a.end_time)}`;

  const actions = (a) => canEdit && (
    <div style={styles.actions}>
      <button style={styles.iconBtn} onClick={() => openEdit(a)} title="Edit"><EditIcon size={15} color="#1a1a2e" /></button>
      <button style={styles.deleteBtn} onClick={() => handleDelete(a.id)} title="Delete"><TrashIcon size={15} color="#ef4444" /></button>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}><CalendarIcon size={24} color={DEFAULT_COLOR} /> Event Schedule</h2>
          <div style={styles.headerRight}>
            <div style={styles.toggle}>
              <button style={viewMode === 'list' ? styles.toggleActive : styles.toggleBtn} onClick={() => setViewMode('list')}>
                <ListIcon size={15} /> List
              </button>
              <button style={viewMode === 'grid' ? styles.toggleActive : styles.toggleBtn} onClick={() => setViewMode('grid')}>
                <GridIcon size={15} /> Calendar Grid
              </button>
            </div>
            {canEdit && (
              <button style={styles.addBtn} onClick={openAdd}><PlusIcon size={18} color="#ffffff" /> Add Activity</button>
            )}
          </div>
        </div>

        {warning && (
          <div style={styles.warning}>
            <strong>⚠ {warning.message || warning.error}</strong>
            {warning.conflicts && (
              <ul style={styles.warningList}>
                {warning.conflicts.map(c => <li key={c.id}>{c.title}{c.start_time && ` (${timeRange(c)})`}</li>)}
              </ul>
            )}
            <button style={styles.warningClose} onClick={() => setWarning(null)}>×</button>
          </div>
        )}

        {activities.length === 0 && <p style={styles.empty}>No activities scheduled yet.</p>}

        {viewMode === 'list' ? (
          <div style={styles.list}>
            {activities.map((a, i) => (
              <div key={a.id} style={{ ...styles.listCard, borderLeft: `5px solid ${a.color || DEFAULT_COLOR}` }}>
                <div style={styles.timeCol}>
                  <div style={styles.timeText}><ClockIcon size={16} color={DEFAULT_COLOR} /> {timeRange(a)}</div>
                  <div style={styles.slot}>Slot #{i + 1}</div>
                </div>
                <div style={styles.body}>
                  <h3 style={styles.cardTitle}>{a.title}</h3>
                  {a.description && <p style={styles.desc}>{a.description}</p>}
                  <div style={styles.meta}>
                    {a.location && <span style={styles.metaItem}><PinIcon size={14} color="#888888" /> {a.location}</span>}
                    {a.speaker && <span style={styles.speaker}><UserIcon size={14} color={DEFAULT_COLOR} /> {a.speaker}</span>}
                  </div>
                </div>
                {actions(a)}
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.grid}>
            {activities.map(a => (
              <div key={a.id} style={{ ...styles.gridCard, borderTop: `5px solid ${a.color || DEFAULT_COLOR}` }}>
                <div style={styles.gridTop}>
                  <span style={styles.timePill}><ClockIcon size={13} color={DEFAULT_COLOR} /> {timeRange(a)}</span>
                  {a.location && <span style={styles.gridLocation}>{a.location}</span>}
                </div>
                <h3 style={styles.gridTitle}>{a.title}</h3>
                {a.description && <p style={styles.desc}>{a.description}</p>}
                <div style={styles.gridFooter}>
                  <span style={styles.speakerText}>{a.speaker}</span>
                  {actions(a)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <div style={styles.overlay} onClick={closeModal}>
          <form style={styles.modal} onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
            <h3 style={styles.modalTitle}><CalendarIcon size={20} color={DEFAULT_COLOR} /> {editing ? 'Edit Activity' : 'Add New Activity'}</h3>

            <label style={styles.label}>Activity Title</label>
            <input style={styles.input} placeholder="e.g. Robotics Showcase & Live Demo" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />

            <label style={styles.label}>Description</label>
            <textarea style={{ ...styles.input, minHeight: 56, resize: 'vertical' }} placeholder="Details about this session..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />

            <label style={styles.label}>Speaker / Performer / Lead Group</label>
            <input style={styles.input} placeholder="e.g. Prof. Alan Turing / Musical Circle" value={form.speaker}
              onChange={e => setForm({ ...form, speaker: e.target.value })} />

            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>Start Time</label>
                <input type="time" style={styles.input} value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} required />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>End Time</label>
                <input type="time" style={styles.input} value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} required />
              </div>
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.col, flex: 2 }}>
                <label style={styles.label}>Location / Venue</label>
                <input style={styles.input} placeholder="Main University Auditorium & North Lawn" value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Color Tag</label>
                <input type="color" style={styles.colorInput} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button type="button" style={styles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button type="submit" style={styles.saveBtn}>{editing ? 'Update Activity' : 'Save to Schedule'}</button>
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
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  toggle: { display: 'flex', background: '#f4f4f5', border: '1px solid #e8e8e8', borderRadius: 10, padding: 3 },
  toggleBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: 'none', background: 'transparent', borderRadius: 8, fontSize: 14, color: '#888888', cursor: 'pointer' },
  toggleActive: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: 'none', background: '#ffffff', borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  addBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', border: 'none', background: '#3b82f6', color: '#ffffff', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(59,130,246,0.3)' },

  warning: { position: 'relative', background: '#fff8e1', border: '1px solid #ffc107', color: '#7a5a00', borderRadius: 10, padding: '12px 40px 12px 16px', marginBottom: 16, fontSize: 14 },
  warningList: { margin: '6px 0 0', paddingLeft: 20 },
  warningClose: { position: 'absolute', top: 8, right: 12, padding: 0, border: 'none', background: 'transparent', color: '#7a5a00', fontSize: 18, cursor: 'pointer' },
  empty: { color: '#888888', textAlign: 'center', padding: 40 },

  list: { display: 'flex', flexDirection: 'column', gap: 16 },
  listCard: { display: 'flex', alignItems: 'center', gap: 24, background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '22px 24px' },
  timeCol: { minWidth: 130 },
  timeText: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  slot: { fontSize: 13, color: '#888888', marginTop: 6, paddingLeft: 22 },
  body: { flex: 1, minWidth: 0 },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  desc: { margin: '6px 0 0', fontSize: 14, color: '#666666', lineHeight: 1.5 },
  meta: { display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10, fontSize: 13 },
  metaItem: { display: 'flex', alignItems: 'center', gap: 5, color: '#888888' },
  speaker: { display: 'flex', alignItems: 'center', gap: 5, color: '#3b82f6', fontWeight: 500 },
  actions: { display: 'flex', gap: 8, flexShrink: 0 },
  iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 30, padding: 0, border: '1px solid #e8e8e8', background: '#ffffff', borderRadius: 8, cursor: 'pointer' },
  deleteBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 30, padding: 0, border: '1px solid #fee2e2', background: '#fff5f5', borderRadius: 8, cursor: 'pointer' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 },
  gridCard: { display: 'flex', flexDirection: 'column', background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 14, padding: 22 },
  gridTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 14 },
  timePill: { display: 'flex', alignItems: 'center', gap: 5, background: '#eff6ff', color: '#3b82f6', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' },
  gridLocation: { fontSize: 12, color: '#888888', textAlign: 'right' },
  gridTitle: { margin: 0, fontSize: 17, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.4 },
  gridFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 'auto', paddingTop: 14, borderTop: '1px solid #f0f0f0' },
  speakerText: { fontSize: 13, fontWeight: 500, color: '#3b82f6' },

  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,15,30,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 },
  modal: { width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', borderRadius: 20, padding: '28px 32px', boxSizing: 'border-box' },
  modalTitle: { display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px', paddingBottom: 14, borderBottom: '1px solid #f0f0f0', fontSize: 18, fontWeight: 700, color: '#1a1a2e' },
  label: { display: 'block', margin: '14px 0 6px', fontSize: 14, fontWeight: 600, color: '#1a1a2e' },
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 14px', border: '1px solid #e2e2e8', borderRadius: 10, fontSize: 14, fontFamily: 'inherit', color: '#1a1a2e', outline: 'none' },
  colorInput: { width: '100%', height: 42, boxSizing: 'border-box', padding: 4, border: '1px solid #e2e2e8', borderRadius: 10, background: '#ffffff', cursor: 'pointer' },
  row: { display: 'flex', gap: 12 },
  col: { flex: 1, minWidth: 0 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 },
  cancelBtn: { padding: '10px 20px', border: '1px solid #e2e2e8', background: '#ffffff', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer' },
  saveBtn: { padding: '10px 20px', border: 'none', background: '#3b82f6', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#ffffff', cursor: 'pointer' },
};
