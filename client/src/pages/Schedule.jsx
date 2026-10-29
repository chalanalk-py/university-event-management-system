import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

// ─── Design System Tokens ────────────────────────────────────────────────────

const THEME = {
  // Primary
  primary:        '#3b82f6',   // buttons, time text, speaker, accent borders
  primaryHover:   '#2563eb',   // hover state for primary buttons
  navy:           '#1a1a2e',   // page title, card headings, modal title

  // Text
  textBody:       '#666666',   // descriptions, body text
  textMuted:      '#888888',   // slot label, location, metadata
  textHeading:    '#1a1a2e',   // activity title, modal title

  // Backgrounds
  pageBg:         '#f5f5f5',   // outer page
  cardBg:         '#ffffff',   // activity cards, modal
  toggleBg:       '#f4f4f5',   // view toggle bar background
  toggleActiveBg: '#ffffff',   // selected toggle pill

  // Borders
  borderCard:     '#e8e8e8',   // card outline
  borderInput:    '#e2e2e8',   // form fields
  borderDivider:  '#f0f0f0',   // modal header/footer separator
  borderAccent:   '#3b82f6',   // card left/top accent (default)

  // Status / Warning
  warnBg:         '#fff8e1',
  warnBorder:     '#ffc107',
  warnText:       '#7a5a00',

  // Delete
  deleteBg:       '#fff5f5',
  deleteBorder:   '#fee2e2',

  // Default activity color tag
  defaultTag:     '#3b82f6',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

function toTimeInput(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function combineDateTime(baseTs, timeStr) {
  if (!timeStr) return '';
  const base = baseTs ? new Date(baseTs) : new Date();
  const [h, m] = timeStr.split(':').map(Number);
  base.setHours(h, m, 0, 0);
  return base.toISOString();
}

// ─── Default Form State ───────────────────────────────────────────────────────

const DEFAULT_FORM = {
  title: '',
  description: '',
  speaker: '',
  start_time: '10:00',
  end_time: '11:00',
  location: '',
  color_tag: THEME.defaultTag,
};

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────

function ActivityModal({ initial, onClose, onSave, eventId, existingActivity }) {
  const isEdit = !!existingActivity;
  const [form, setForm] = useState(initial);
  const [warning, setWarning] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setWarning(null);
    setSaving(true);
    try {
      const baseTs = existingActivity?.start_time || null;
      const payload = {
        event_id: eventId,
        title: form.title,
        description: form.description,
        speaker: form.speaker,
        location: form.location,
        color_tag: form.color_tag,
        start_time: combineDateTime(baseTs, form.start_time),
        end_time: combineDateTime(baseTs, form.end_time),
      };
      if (isEdit) {
        await api.put(`/schedule/${existingActivity.id}`, payload);
      } else {
        const res = await api.post('/schedule', payload);
        if (res.data.warning) setWarning(res.data.warning.message);
      }
      onSave();
    } catch (err) {
      if (err.response?.data?.conflicts) {
        setWarning(`Time conflict with: ${err.response.data.conflicts.map(c => c.title).join(', ')}`);
      } else {
        setWarning(err.response?.data?.error || 'Failed to save activity');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${THEME.borderDivider}` }}>
          <span style={{ fontSize: 20 }}>📅</span>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: THEME.textHeading, margin: 0 }}>
            {isEdit ? 'Edit Activity' : 'Add New Activity'}
          </h2>
        </div>

        {warning && <div style={S.warnBox}>⚠ {warning}</div>}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <label style={S.label}>Activity Title</label>
            <input
              style={S.input}
              placeholder="e.g. Robotics Showcase & Live Demo"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label style={S.label}>Description</label>
            <textarea
              style={{ ...S.input, minHeight: 80, resize: 'vertical' }}
              placeholder="Details about this session..."
              value={form.description}
              onChange={e => set('description', e.target.value)}
            />
          </div>

          {/* Speaker */}
          <div>
            <label style={S.label}>Speaker / Performer / Lead Group</label>
            <input
              style={S.input}
              placeholder="e.g. Prof. Alan Turing / Musical Circle"
              value={form.speaker}
              onChange={e => set('speaker', e.target.value)}
            />
          </div>

          {/* Start & End Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={S.label}>Start Time</label>
              <input
                type="time"
                style={S.timeInput}
                value={form.start_time}
                onChange={e => set('start_time', e.target.value)}
                required
              />
            </div>
            <div>
              <label style={S.label}>End Time</label>
              <input
                type="time"
                style={S.timeInput}
                value={form.end_time}
                onChange={e => set('end_time', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Location & Color */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
            <div>
              <label style={S.label}>Location / Venue</label>
              <input
                style={S.input}
                placeholder="Main University Auditorium & North Lawn"
                value={form.location}
                onChange={e => set('location', e.target.value)}
              />
            </div>
            <div>
              <label style={S.label}>Color Tag</label>
              <input
                type="color"
                style={S.colorInput}
                value={form.color_tag}
                onChange={e => set('color_tag', e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4, paddingTop: 16, borderTop: `1px solid ${THEME.borderDivider}` }}>
            <button type="button" onClick={onClose} style={S.cancelBtn}>Cancel</button>
            <button type="submit" disabled={saving} style={S.saveBtn}>
              {saving ? 'Saving…' : 'Save to Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── List Card ────────────────────────────────────────────────────────────────

function ListCard({ activity, slotNum, onEdit, onDelete, canEdit }) {
  const start = fmtTime(activity.start_time);
  const end   = fmtTime(activity.end_time);
  const color = activity.color_tag || THEME.defaultTag;

  return (
    <div style={{ ...S.listCard, borderLeftColor: color }}>
      {/* Left: time + slot */}
      <div style={S.listLeft}>
        <div style={S.timeText}>
          <span>🕐</span>
          <span>{start} – {end}</span>
        </div>
        <div style={S.slotLabel}>Slot #{slotNum}</div>
      </div>

      {/* Middle: content */}
      <div style={{ flex: 1 }}>
        <h3 style={S.cardTitle}>{activity.title}</h3>
        {activity.description && (
          <p style={S.cardDesc}>{activity.description}</p>
        )}
        <div style={S.metaRow}>
          {activity.location && (
            <span style={S.locationText}>📍 {activity.location}</span>
          )}
          {activity.speaker && (
            <span style={S.speakerText}>👤 {activity.speaker}</span>
          )}
        </div>
      </div>

      {/* Right: actions */}
      {canEdit && (
        <div style={S.actionRow}>
          <button onClick={() => onEdit(activity)} style={S.iconBtn} title="Edit">✏️</button>
          <button onClick={() => onDelete(activity.id)} style={{ ...S.iconBtn, ...S.deleteIconBtn }} title="Delete">🗑️</button>
        </div>
      )}
    </div>
  );
}

// ─── Grid Card ────────────────────────────────────────────────────────────────

function GridCard({ activity, onEdit, onDelete, canEdit }) {
  const start = fmtTime(activity.start_time);
  const end   = fmtTime(activity.end_time);
  const color = activity.color_tag || THEME.defaultTag;

  return (
    <div style={{ ...S.gridCard, borderTopColor: color }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={S.timeText}>
          <span>🕐</span>
          <span>{start} – {end}</span>
        </div>
        {activity.location && (
          <span style={S.gridLocation}>{activity.location}</span>
        )}
      </div>

      <h3 style={{ ...S.cardTitle, fontSize: 14, lineHeight: 1.4 }}>{activity.title}</h3>

      {activity.description && (
        <p style={{ ...S.cardDesc, fontSize: 12, marginBottom: 10 }}>{activity.description}</p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        {activity.speaker && (
          <span style={{ ...S.speakerText, fontSize: 12 }}>{activity.speaker}</span>
        )}
        {canEdit && (
          <div style={{ ...S.actionRow, marginLeft: 'auto' }}>
            <button onClick={() => onEdit(activity)} style={S.iconBtn} title="Edit">✏️</button>
            <button onClick={() => onDelete(activity.id)} style={{ ...S.iconBtn, ...S.deleteIconBtn }} title="Delete">🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Schedule() {
  const { eventId } = useParams();
  const { hasRole } = useAuth();
  const [activities, setActivities] = useState([]);
  const [viewMode, setViewMode] = useState('list');
  const [showModal, setShowModal] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [globalWarning, setGlobalWarning] = useState(null);
  const [loading, setLoading] = useState(true);

  const canEdit = hasRole('Admin', 'Coordinator', 'Event Member');

  const load = async () => {
    try {
      setLoading(true);
      const r = await api.get(`/schedule/event/${eventId}`);
      setActivities(r.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [eventId]);

  const openAdd = () => { setEditActivity(null); setShowModal(true); setGlobalWarning(null); };
  const openEdit = (a) => { setEditActivity(a); setShowModal(true); setGlobalWarning(null); };
  const handleSave = () => { setShowModal(false); setEditActivity(null); load(); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this activity?')) return;
    try { await api.delete(`/schedule/${id}`); load(); }
    catch { alert('Failed to delete activity'); }
  };

  const getInitialForm = () => editActivity ? {
    title:       editActivity.title || '',
    description: editActivity.description || '',
    speaker:     editActivity.speaker || '',
    start_time:  toTimeInput(editActivity.start_time),
    end_time:    toTimeInput(editActivity.end_time),
    location:    editActivity.location || '',
    color_tag:   editActivity.color_tag || THEME.defaultTag,
  } : DEFAULT_FORM;

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22 }}>📅</span>
            <h1 style={S.pageTitle}>Event Schedule</h1>
          </div>
          <p style={S.pageSubtitle}>Customizable activity timeline with automated conflict detection (FR-2.1 – FR-2.4)</p>
        </div>

        <div style={S.headerRight}>
          {/* View toggle */}
          <div style={S.viewToggle}>
            <button onClick={() => setViewMode('list')} style={viewMode === 'list' ? S.toggleActive : S.toggleInactive}>
              ≡ List
            </button>
            <button onClick={() => setViewMode('grid')} style={viewMode === 'grid' ? S.toggleActive : S.toggleInactive}>
              ⊞ Calendar Grid
            </button>
          </div>

          {/* Add Activity */}
          {canEdit && (
            <button onClick={openAdd} style={S.addBtn}>+ Add Activity</button>
          )}
        </div>
      </div>

      {/* ── Global warning ── */}
      {globalWarning && <div style={S.warnBox}>⚠ {globalWarning}</div>}

      {/* ── Content ── */}
      {loading ? (
        <div style={S.centeredMsg}>Loading schedule…</div>
      ) : activities.length === 0 ? (
        <div style={S.emptyState}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <p style={{ color: THEME.textMuted, fontSize: 15 }}>
            No activities yet.{canEdit ? ' Click "+ Add Activity" to get started.' : ''}
          </p>
        </div>
      ) : viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activities.map((a, i) => (
            <ListCard key={a.id} activity={a} slotNum={i + 1} onEdit={openEdit} onDelete={handleDelete} canEdit={canEdit} />
          ))}
        </div>
      ) : (
        <div style={S.gridContainer}>
          {activities.map(a => (
            <GridCard key={a.id} activity={a} onEdit={openEdit} onDelete={handleDelete} canEdit={canEdit} />
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {showModal && (
        <ActivityModal
          initial={getInitialForm()}
          existingActivity={editActivity}
          eventId={eventId}
          onClose={() => { setShowModal(false); setEditActivity(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ─── Styles (CSS-in-JS) ───────────────────────────────────────────────────────
// All values reference THEME tokens above for a single source of truth.

const S = {
  // ── Page layout
  page: {
    maxWidth: 1100,
    margin: '32px auto',
    padding: '0 24px',
    background: THEME.pageBg,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: THEME.navy,
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 13,
    color: THEME.textMuted,
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },

  // ── View toggle
  viewToggle: {
    display: 'flex',
    background: THEME.toggleBg,
    borderRadius: 8,
    padding: 3,
    gap: 2,
  },
  toggleActive: {
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    background: THEME.toggleActiveBg,
    color: THEME.navy,
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  toggleInactive: {
    padding: '6px 14px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: THEME.textBody,
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
  },

  // ── Add button
  addBtn: {
    padding: '9px 18px',
    background: THEME.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },

  // ── List card
  listCard: {
    background: THEME.cardBg,
    borderRadius: 12,
    border: `1px solid ${THEME.borderCard}`,
    borderLeft: `4px solid ${THEME.borderAccent}`,
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 24,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  listLeft: {
    minWidth: 110,
    textAlign: 'center',
  },

  // ── Grid
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 18,
  },
  gridCard: {
    background: THEME.cardBg,
    borderRadius: 12,
    border: `1px solid ${THEME.borderCard}`,
    borderTop: `4px solid ${THEME.borderAccent}`,
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    minHeight: 180,
  },

  // ── Shared card content
  timeText: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: THEME.primary,
    fontWeight: 600,
    fontSize: 14,
  },
  slotLabel: {
    fontSize: 12,
    color: THEME.textMuted,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: THEME.textHeading,
    margin: '0 0 4px',
  },
  cardDesc: {
    fontSize: 13,
    color: THEME.textBody,
    margin: '0 0 6px',
    lineHeight: 1.5,
  },
  metaRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
  },
  locationText: {
    fontSize: 12,
    color: THEME.textMuted,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  speakerText: {
    fontSize: 12,
    color: THEME.primary,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 500,
  },
  gridLocation: {
    fontSize: 11,
    color: THEME.textMuted,
  },
  actionRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  iconBtn: {
    background: 'transparent',
    border: `1px solid ${THEME.borderCard}`,
    borderRadius: 6,
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: 14,
    padding: 0,
  },
  deleteIconBtn: {
    background: THEME.deleteBg,
    borderColor: THEME.deleteBorder,
  },

  // ── Modal
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: THEME.cardBg,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 520,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: THEME.textHeading,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: `1.5px solid ${THEME.borderInput}`,
    borderRadius: 8,
    fontSize: 14,
    color: THEME.textHeading,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: THEME.cardBg,
  },
  timeInput: {
    width: '100%',
    padding: '10px 14px',
    border: `1.5px solid ${THEME.borderInput}`,
    borderRadius: 8,
    fontSize: 14,
    color: THEME.textHeading,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    background: THEME.cardBg,
  },
  colorInput: {
    height: 42,
    width: 100,
    padding: 4,
    border: `1.5px solid ${THEME.borderInput}`,
    borderRadius: 8,
    cursor: 'pointer',
    background: THEME.cardBg,
  },
  cancelBtn: {
    padding: '10px 22px',
    background: THEME.cardBg,
    color: THEME.textBody,
    border: `1.5px solid ${THEME.borderCard}`,
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 22px',
    background: THEME.primary,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  },

  // ── Warning box
  warnBox: {
    background: THEME.warnBg,
    border: `1px solid ${THEME.warnBorder}`,
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    color: THEME.warnText,
    marginBottom: 16,
  },

  // ── Empty / loading states
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: THEME.cardBg,
    borderRadius: 12,
    border: `1px dashed ${THEME.borderCard}`,
  },
  centeredMsg: {
    textAlign: 'center',
    padding: 60,
    color: THEME.textMuted,
  },
};
