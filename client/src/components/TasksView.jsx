import React, { useState } from 'react';
import { CheckSquare, ChevronDown, ChevronRight, Clock, Plus, Trash2, User, ArrowRight, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import { api } from '../services/api';

export default function TasksView({ tasksData = { tasks: [], stats: {} }, onRefresh, currentUser }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterMyTasks, setFilterMyTasks] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState(new Set([1, 2]));

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToName, setAssignedToName] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Logistics');
  const [loading, setLoading] = useState(false);

  const { tasks = [], stats = { total: 0, done: 0, inProgress: 0, todo: 0, progressPercent: 0 } } = tasksData;

  const toggleExpand = (id) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      onRefresh();
    } catch (err) {
      alert('Error updating task status');
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Delete this task?')) {
      await api.deleteTask(taskId);
      onRefresh();
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createTask({
        title,
        description,
        assignedToName: assignedToName || currentUser?.full_name || 'Unassigned',
        assignedToUserId: currentUser?.id,
        priority,
        dueDate,
        category
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      setAssignedToName('');
      setDueDate('');
      onRefresh();
    } catch (err) {
      alert('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks
  const displayTasks = filterMyTasks && currentUser
    ? tasks.filter(t => t.assigned_to_user_id === currentUser.id || t.assigned_to_name?.toLowerCase().includes(currentUser.username.toLowerCase()))
    : tasks;

  const todoTasks = displayTasks.filter(t => t.status === 'todo');
  const inProgressTasks = displayTasks.filter(t => t.status === 'in_progress');
  const doneTasks = displayTasks.filter(t => t.status === 'done');

  const isOrganizer = currentUser?.role === 'admin' || currentUser?.role === 'coordinator';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-black)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckSquare size={24} color="var(--accent-blue)" /> Task Coordination & Progress
          </h1>
          <p style={{ color: 'var(--secondary-gray)', fontSize: '0.875rem' }}>
            Multi-stage task workflow with expandable descriptions and progress tracking (FR-6.1 – FR-6.6)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* FR-6.6: Assigned to me filter */}
          <button
            onClick={() => setFilterMyTasks(!filterMyTasks)}
            className={`btn-secondary ${filterMyTasks ? 'active' : ''}`}
            style={{
              background: filterMyTasks ? 'var(--primary-black)' : 'var(--bg-white)',
              color: filterMyTasks ? 'white' : 'var(--primary-black)'
            }}
          >
            <User size={15} /> My Assigned Tasks
          </button>

          {isOrganizer && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar & KPI Summary (FR-6.5) */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-black)' }}>
              Overall Preparation Progress: {stats.progressPercent || 0}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-gray)', marginTop: '0.15rem' }}>
              {stats.done || 0} of {stats.total || 0} tasks completed ({stats.inProgress || 0} currently in progress)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <span className="badge badge-gray">To Do: {stats.todo || 0}</span>
            <span className="badge badge-orange">In Progress: {stats.inProgress || 0}</span>
            <span className="badge badge-green">Completed: {stats.done || 0}</span>
          </div>
        </div>

        {/* Visual Progress Bar (FR-6.5) */}
        <div style={{ height: '10px', width: '100%', background: 'var(--border-color)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${stats.progressPercent || 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3B82F6 0%, #10B981 100%)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.5s ease-out'
            }}
          />
        </div>
      </div>

      {/* Kanban Sections (FR-6.2) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {/* 1. TO DO COLUMN */}
        <div style={{ background: 'var(--surface-hover)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-black)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--secondary-gray)' }} />
              To Do ({todoTasks.length})
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {todoTasks.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--secondary-gray)', fontSize: '0.8rem' }}>
                No pending tasks in this stage
              </div>
            ) : (
              todoTasks.map(task => renderTaskCard(task, 'todo'))
            )}
          </div>
        </div>

        {/* 2. IN PROGRESS COLUMN */}
        <div style={{ background: '#FFFBEB', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid #FDE68A' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: '#92400E' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }} />
              In Progress ({inProgressTasks.length})
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {inProgressTasks.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#B45309', fontSize: '0.8rem' }}>
                No tasks currently in progress
              </div>
            ) : (
              inProgressTasks.map(task => renderTaskCard(task, 'in_progress'))
            )}
          </div>
        </div>

        {/* 3. DONE COLUMN */}
        <div style={{ background: '#ECFDF5', borderRadius: 'var(--radius-lg)', padding: '1.25rem', border: '1px solid #A7F3D0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: '#065F46' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }} />
              Done / Completed ({doneTasks.length})
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {doneTasks.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#047857', fontSize: '0.8rem' }}>
                No completed tasks yet
              </div>
            ) : (
              doneTasks.map(task => renderTaskCard(task, 'done'))
            )}
          </div>
        </div>
      </div>

      {/* Add Task Modal (FR-6.1) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">
                <CheckSquare size={20} color="var(--accent-blue)" /> Create Event Task
              </h2>
            </div>

            <form onSubmit={handleAddTask}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect audio lines and test stage speakers"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description (Expandable in Dropdown)</label>
                <textarea
                  rows={3}
                  placeholder="Specific requirements, checklist items, contacts..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Assignee Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Vance or David Miller"
                    value={assignedToName}
                    onChange={e => setAssignedToName(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} className="form-select">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    placeholder="Transportation, Stage, Food..."
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Creating...' : 'Save Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Helper render card with expandable dropdown (FR-6.4) and move buttons (FR-6.3)
  function renderTaskCard(task, currentSection) {
    const isExpanded = expandedTaskIds.has(task.id);

    return (
      <div
        key={task.id}
        style={{
          background: 'var(--bg-white)',
          borderRadius: 'var(--radius-md)',
          padding: '0.9rem 1rem',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-full)',
                background: task.priority === 'urgent' ? 'var(--danger-subtle)' : task.priority === 'high' ? 'var(--warning-subtle)' : 'var(--surface-hover)',
                color: task.priority === 'urgent' ? 'var(--danger)' : task.priority === 'high' ? '#B45309' : 'var(--secondary-gray)'
              }}>
                {task.priority}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--secondary-gray)' }}>
                {task.category}
              </span>
            </div>

            <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--primary-black)', lineHeight: 1.35 }}>
              {task.title}
            </h4>
          </div>

          {isOrganizer && (
            <button
              onClick={() => handleDelete(task.id)}
              style={{ background: 'none', color: 'var(--secondary-gray)', padding: '0.2rem' }}
              title="Delete task"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Expandable Description Dropdown (FR-6.4) */}
        <div style={{ marginTop: '0.5rem' }}>
          <button
            onClick={() => toggleExpand(task.id)}
            style={{
              background: 'transparent',
              color: 'var(--accent-blue)',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span>{isExpanded ? 'Hide Details' : 'View Description Dropdown'}</span>
          </button>

          {isExpanded && (
            <div style={{
              marginTop: '0.4rem',
              padding: '0.6rem 0.75rem',
              background: 'var(--surface-hover)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--primary-black)',
              lineHeight: 1.4,
              borderLeft: '3px solid var(--accent-blue)',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {task.description || 'No detailed instructions provided.'}
            </div>
          )}
        </div>

        {/* Footer: Assignee & Move Action (FR-6.3) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--secondary-gray)' }}>
            <User size={13} color="var(--accent-blue)" /> {task.assigned_to_name || 'Unassigned'}
          </span>

          {/* Quick Move Button */}
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            {currentSection !== 'todo' && (
              <button
                onClick={() => handleStatusChange(task.id, currentSection === 'done' ? 'in_progress' : 'todo')}
                className="btn-secondary"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.45rem' }}
                title="Move Back"
              >
                ← Back
              </button>
            )}
            {currentSection !== 'done' && (
              <button
                onClick={() => handleStatusChange(task.id, currentSection === 'todo' ? 'in_progress' : 'done')}
                className="btn-primary"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                title="Advance Stage"
              >
                Advance →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
