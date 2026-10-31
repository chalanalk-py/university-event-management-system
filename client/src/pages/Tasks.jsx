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
const CheckSquareIcon = (p) => <Icon {...p} d={<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>} />;
const UserIcon = (p) => <Icon {...p} d={<><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />;
const TrashIcon = (p) => <Icon {...p} d={<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></>} />;
const PlusIcon = (p) => <Icon {...p} d={<path d="M12 5v14M5 12h14" />} />;
const ChevronDownIcon = (p) => <Icon {...p} d={<path d="M6 9l6 6 6-6" />} />;
const ChevronUpIcon = (p) => <Icon {...p} d={<path d="M18 15l-6-6-6 6" />} />;
const XIcon = (p) => <Icon {...p} d={<><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>} />;

const PRIORITY_COLORS = {
  Urgent: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  High: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  Medium: { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
  Low: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
};

const SECTION_COLORS = {
  todo: { dot: '#1a1a2e', bg: '#ffffff', border: '#e8e8e8' },
  in_progress: { dot: '#f59e0b', bg: '#fffbeb', border: '#fef3c7' },
  done: { dot: '#22c55e', bg: '#f0fdf4', border: '#dcfce7' },
};

const SECTION_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done / Completed',
};

const emptyForm = { title: '', description: '', assignee_name: '', priority: 'Medium', category: '', due_date: '' };

export default function Tasks() {
  const { eventId } = useParams();
  const { hasRole } = useAuth();
  const canEdit = hasRole('Admin', 'Coordinator');
  const [tasks, setTasks] = useState({ todo: [], in_progress: [], done: [] });
  const [progress, setProgress] = useState({ percentage: 0, total: 0, done: 0, inProgress: 0, todo: 0 });
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterMine, setFilterMine] = useState(false);
  const [myTasks, setMyTasks] = useState(null);

  const load = () => {
    api.get(`/tasks/event/${eventId}`).then(r => setTasks(r.data));
    api.get(`/tasks/progress/${eventId}`).then(r => setProgress(r.data));
  };
  useEffect(() => { load(); }, [eventId]);

  const toggleMyTasks = async () => {
    if (!filterMine) {
      const res = await api.get('/tasks/my');
      setMyTasks(res.data);
    }
    setFilterMine(!filterMine);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/tasks', {
      event_id: parseInt(eventId),
      title: form.title,
      description: form.description,
      assignee_id: null,
      due_date: form.due_date || null,
      priority: form.priority,
      category: form.category || null,
    });
    setForm(emptyForm);
    setModalOpen(false);
    load();
  };

  const handleMove = async (id, section) => {
    await api.patch(`/tasks/${id}/move`, { section });
    load();
    if (filterMine) {
      const res = await api.get('/tasks/my');
      setMyTasks(res.data);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/tasks/${id}`);
    load();
  };

  const nextSection = (current) => {
    if (current === 'todo') return 'in_progress';
    if (current === 'in_progress') return 'done';
    return null;
  };

  const prevSection = (current) => {
    if (current === 'done') return 'in_progress';
    if (current === 'in_progress') return 'todo';
    return null;
  };

  const renderPriorityBadge = (priority) => {
    const colors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;
    return (
      <span style={{ ...styles.priorityBadge, background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
        {(priority || 'MEDIUM').toUpperCase()}
      </span>
    );
  };

  const renderTaskCard = (t, sectionKey) => {
    const isExpanded = expandedId === t.id;
    const next = nextSection(sectionKey);
    const prev = prevSection(sectionKey);

    return (
      <div key={t.id} style={styles.taskCard}>
        {/* Header row: priority, category, delete */}
        <div style={styles.taskCardHeader}>
          <div style={styles.taskBadges}>
            {renderPriorityBadge(t.priority)}
            {t.category && <span style={styles.categoryBadge}>{t.category}</span>}
          </div>
          {canEdit && (
            <button style={styles.deleteBtn} onClick={() => handleDelete(t.id)} title="Delete">
              <TrashIcon size={15} color="#888888" />
            </button>
          )}
        </div>

        {/* Title */}
        <h4 style={styles.taskTitle}>{t.title}</h4>

        {/* Expandable description */}
        <div
          style={styles.expandToggle}
          onClick={() => setExpandedId(isExpanded ? null : t.id)}
        >
          {isExpanded ? <ChevronUpIcon size={14} color="#3b82f6" /> : <ChevronDownIcon size={14} color="#3b82f6" />}
          <span style={styles.expandText}>{isExpanded ? 'Hide Details' : 'View Description Dropdown'}</span>
        </div>

        {isExpanded && (
          <div style={styles.descriptionBox}>
            <p style={styles.descriptionText}>{t.description || 'No description provided.'}</p>
          </div>
        )}

        {/* Footer: assignee + actions */}
        <div style={styles.taskCardFooter}>
          <div style={styles.assigneeRow}>
            {t.assignee_name && (
              <>
                <UserIcon size={14} color="#888888" />
                <span style={styles.assigneeName}>{t.assignee_name}</span>
              </>
            )}
          </div>
          <div style={styles.actionRow}>
            {prev && (
              <button style={styles.backBtn} onClick={() => handleMove(t.id, prev)}>
                ← Back
              </button>
            )}
            {next && (
              <button style={styles.advanceBtn} onClick={() => handleMove(t.id, next)}>
                Advance →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (sectionKey) => {
    const items = tasks[sectionKey] || [];
    const sectionColor = SECTION_COLORS[sectionKey];
    const label = SECTION_LABELS[sectionKey];

    return (
      <div style={{ ...styles.sectionColumn, background: sectionColor.bg, borderColor: sectionColor.border }}>
        <div style={styles.sectionHeader}>
          <span style={{ ...styles.sectionDot, background: sectionColor.dot }} />
          <span style={styles.sectionTitle}>
            {label} ({items.length})
          </span>
        </div>
        {items.length === 0 ? (
          <p style={styles.emptySection}>
            {sectionKey === 'todo' && 'No pending tasks in this stage'}
            {sectionKey === 'in_progress' && 'No tasks currently in progress'}
            {sectionKey === 'done' && 'No completed tasks yet'}
          </p>
        ) : (
          <div style={styles.taskList}>
            {items.map(t => renderTaskCard(t, sectionKey))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Page Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>
              <CheckSquareIcon size={24} color="#3b82f6" /> Task Coordination & Progress
            </h2>
            <p style={styles.subtitle}>
              Multi-stage task workflow with expandable descriptions and progress tracking 
            </p>
          </div>
          <div style={styles.headerRight}>
            <button
              style={filterMine ? styles.myTasksBtnActive : styles.myTasksBtn}
              onClick={toggleMyTasks}
            >
              <UserIcon size={16} color={filterMine ? '#ffffff' : '#1a1a2e'} /> My Assigned Tasks
            </button>
            {canEdit && (
              <button style={styles.addBtn} onClick={() => setModalOpen(true)}>
                <PlusIcon size={18} color="#ffffff" /> New Task
              </button>
            )}
          </div>
        </div>

        {/* Progress Card */}
        <div style={styles.progressCard}>
          <div style={styles.progressInfo}>
            <h3 style={styles.progressTitle}>Overall Preparation Progress: {progress.percentage}%</h3>
            <p style={styles.progressSubtitle}>
              {progress.done} of {progress.total} tasks completed ({progress.inProgress || 0} currently in progress)
            </p>
            <div style={styles.progressBarOuter}>
              <div style={{ ...styles.progressBarFill, width: `${progress.percentage}%` }} />
            </div>
          </div>
          <div style={styles.progressStats}>
            <span style={styles.statItem}>To Do: <strong>{progress.todo || 0}</strong></span>
            <span style={{ ...styles.statItem, color: '#f59e0b' }}>In Progress: <strong>{progress.inProgress || 0}</strong></span>
            <span style={{ ...styles.statItem, color: '#22c55e' }}>Completed: <strong>{progress.done || 0}</strong></span>
          </div>
        </div>

        {/* Task Board */}
        <div style={styles.board}>
          {renderSection('todo')}
          {renderSection('in_progress')}
          {renderSection('done')}
        </div>
      </div>

      {/* Create Task Modal */}
      {modalOpen && (
        <div style={styles.overlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                <CheckSquareIcon size={20} color="#3b82f6" /> Create Event Task
              </h3>
              <button style={styles.modalCloseBtn} onClick={() => setModalOpen(false)}>
                <XIcon size={18} color="#888888" />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <label style={styles.label}>Task Title</label>
              <input
                style={styles.input}
                placeholder="e.g. Inspect audio lines and test stage speakers"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />

              <label style={styles.label}>Detailed Description (Expandable in Dropdown)</label>
              <textarea
                style={{ ...styles.input, minHeight: 80, resize: 'vertical' }}
                placeholder="Specific requirements, checklist items, contacts..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />

              <div style={styles.row}>
                <div style={styles.col}>
                  <label style={styles.label}>Assignee Name</label>
                  <input
                    style={styles.input}
                    placeholder="e.g. Marcus Vance or David Miller"
                    value={form.assignee_name}
                    onChange={e => setForm({ ...form, assignee_name: e.target.value })}
                  />
                </div>
                <div style={styles.col}>
                  <label style={styles.label}>Priority</label>
                  <select
                    style={styles.input}
                    value={form.priority}
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.col}>
                  <label style={styles.label}>Category</label>
                  <input
                    style={styles.input}
                    placeholder="Logistics"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  />
                </div>
                <div style={styles.col}>
                  <label style={styles.label}>Due Date</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.cancelBtn} onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>Save Task</button>
              </div>
            </form>
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
  myTasksBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    border: '1px solid #e8e8e8', background: '#ffffff', borderRadius: 10,
    fontSize: 14, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer',
  },
  myTasksBtnActive: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    border: 'none', background: '#1a1a2e', borderRadius: 10,
    fontSize: 14, fontWeight: 600, color: '#ffffff', cursor: 'pointer',
  },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    border: 'none', background: '#3b82f6', color: '#ffffff', borderRadius: 10,
    fontSize: 15, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(59,130,246,0.3)',
  },

  // Progress Card
  progressCard: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20,
    background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 14, padding: '22px 28px', marginBottom: 24,
  },
  progressInfo: { flex: 1, minWidth: 280 },
  progressTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  progressSubtitle: { margin: '4px 0 12px', fontSize: 13, color: '#22c55e' },
  progressBarOuter: { height: 10, background: '#e8e8e8', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', background: '#3b82f6', borderRadius: 5, transition: 'width 0.4s ease' },
  progressStats: { display: 'flex', gap: 24, flexShrink: 0 },
  statItem: { fontSize: 14, color: '#1a1a2e' },

  // Board
  board: { display: 'flex', gap: 20 },

  // Section Column
  sectionColumn: {
    flex: 1, minWidth: 0, border: '1px solid #e8e8e8', borderRadius: 14,
    padding: 20, display: 'flex', flexDirection: 'column',
  },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a2e' },
  emptySection: { color: '#888888', fontSize: 14, textAlign: 'center', padding: '40px 10px' },
  taskList: { display: 'flex', flexDirection: 'column', gap: 16 },

  // Task Card
  taskCard: {
    background: '#ffffff', border: '1px solid #e8e8e8', borderRadius: 12,
    padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  taskCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  taskBadges: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  priorityBadge: {
    fontSize: 11, fontWeight: 700, letterSpacing: 0.5, padding: '3px 10px',
    borderRadius: 6, whiteSpace: 'nowrap',
  },
  categoryBadge: {
    fontSize: 12, color: '#888888', fontWeight: 500,
  },
  deleteBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, padding: 0, border: '1px solid #fee2e2',
    background: '#fff5f5', borderRadius: 8, cursor: 'pointer', flexShrink: 0,
  },

  // Task Title
  taskTitle: { margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.4 },

  // Expand Toggle
  expandToggle: {
    display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
    padding: '4px 0', marginBottom: 8,
  },
  expandText: { fontSize: 13, color: '#3b82f6', fontWeight: 500 },

  // Description Box
  descriptionBox: {
    background: '#f9fafb', borderLeft: '3px solid #e8e8e8', borderRadius: 6,
    padding: '10px 14px', marginBottom: 10,
  },
  descriptionText: { margin: 0, fontSize: 13, color: '#666666', lineHeight: 1.6 },

  // Footer
  taskCardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 4 },
  assigneeRow: { display: 'flex', alignItems: 'center', gap: 6 },
  assigneeName: { fontSize: 13, color: '#888888' },
  actionRow: { display: 'flex', gap: 8, alignItems: 'center' },
  backBtn: {
    padding: '5px 14px', border: 'none', background: 'transparent',
    fontSize: 13, color: '#888888', fontWeight: 500, cursor: 'pointer',
  },
  advanceBtn: {
    padding: '6px 16px', border: 'none', background: '#22c55e', color: '#ffffff',
    borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },

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
  row: { display: 'flex', gap: 12, marginTop: 2 },
  col: { flex: 1, minWidth: 0 },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' },
  cancelBtn: {
    padding: '10px 20px', border: '1px solid #e2e2e8', background: '#ffffff',
    borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#1a1a2e', cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 20px', border: 'none', background: '#3b82f6',
    borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#ffffff', cursor: 'pointer',
  },
};
