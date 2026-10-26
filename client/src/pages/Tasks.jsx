import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Tasks() {
  const { eventId } = useParams();
  const { hasRole } = useAuth();
  const [tasks, setTasks] = useState({ todo: [], in_progress: [], done: [] });
  const [progress, setProgress] = useState({ percentage: 0, total: 0, done: 0 });
  const [form, setForm] = useState({ title: '', description: '', assignee_id: '', due_date: '' });
  const [expandedId, setExpandedId] = useState(null);

  const load = () => {
    api.get(`/tasks/event/${eventId}`).then(r => setTasks(r.data));
    api.get(`/tasks/progress/${eventId}`).then(r => setProgress(r.data));
  };
  useEffect(() => { load(); }, [eventId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/tasks', { ...form, event_id: parseInt(eventId), assignee_id: form.assignee_id ? parseInt(form.assignee_id) : null });
    setForm({ title: '', description: '', assignee_id: '', due_date: '' });
    load();
  };

  const handleMove = async (id, section) => {
    await api.patch(`/tasks/${id}/move`, { section });
    load();
  };

  const handleDelete = async (id) => {
    await api.delete(`/tasks/${id}`);
    load();
  };

  const renderSection = (title, items, sectionKey) => (
    <div className="task-section">
      <h3>{title} ({items.length})</h3>
      <ul>
        {items.map(t => (
          <li key={t.id}>
            <div onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} style={{ cursor: 'pointer' }}>
              <strong>{t.title}</strong> {t.assignee_name && `→ ${t.assignee_name}`}
              {t.due_date && <span> | Due: {new Date(t.due_date).toLocaleDateString()}</span>}
            </div>
            {expandedId === t.id && <p className="task-desc">{t.description || 'No description'}</p>}
            <div>
              {sectionKey !== 'todo' && <button onClick={() => handleMove(t.id, 'todo')}>→ To Do</button>}
              {sectionKey !== 'in_progress' && <button onClick={() => handleMove(t.id, 'in_progress')}>→ In Progress</button>}
              {sectionKey !== 'done' && <button onClick={() => handleMove(t.id, 'done')}>→ Done</button>}
              {hasRole('Admin', 'Coordinator') && <button onClick={() => handleDelete(t.id)}>Delete</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="page">
      <h2>Tasks</h2>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress.percentage}%` }}></div>
        <span>{progress.percentage}% ({progress.done}/{progress.total})</span>
      </div>

      {hasRole('Admin', 'Coordinator') && (
        <form onSubmit={handleCreate}>
          <h3>Create Task</h3>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <input placeholder="Assignee User ID" value={form.assignee_id} onChange={e => setForm({ ...form, assignee_id: e.target.value })} />
          <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
          <button type="submit">Create</button>
        </form>
      )}

      <div className="task-board">
        {renderSection('To Do', tasks.todo, 'todo')}
        {renderSection('In Progress', tasks.in_progress, 'in_progress')}
        {renderSection('Done', tasks.done, 'done')}
      </div>
    </div>
  );
}
