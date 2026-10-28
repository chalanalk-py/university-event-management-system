import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, User, AlertTriangle, Plus, Trash2, Edit3, Grid, List, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function ScheduleView({ schedules = [], onRefresh, currentUser, activeEvent }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [venue, setVenue] = useState('Main Auditorium');
  const [colorTag, setColorTag] = useState('#3B82F6');
  const [overlapWarning, setOverlapWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check overlap dynamically as user types (FR-2.3)
  const checkOverlapLocally = (st, et, vn, ignoreId = null) => {
    if (!st || !et || !vn) return '';
    const conflict = schedules.find(s => {
      if (ignoreId && s.id === ignoreId) return false;
      const venueSame = s.location_venue.toLowerCase().trim() === vn.toLowerCase().trim();
      const timeOverlaps = st < s.end_time && et > s.start_time;
      return venueSame && timeOverlaps;
    });

    if (conflict) {
      return `⚠️ Overlap Warning: Conflicts with "${conflict.activity_title}" (${conflict.start_time} - ${conflict.end_time}) at "${conflict.location_venue}".`;
    }
    return '';
  };

  const handleVenueOrTimeChange = (newSt, newEt, newVn) => {
    setStartTime(newSt);
    setEndTime(newEt);
    setVenue(newVn);
    const warn = checkOverlapLocally(newSt, newEt, newVn, editingItem?.id);
    setOverlapWarning(warn);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setSpeaker('');
    setStartTime('10:00');
    setEndTime('11:00');
    setVenue(activeEvent?.venue || 'Main Auditorium');
    setColorTag('#3B82F6');
    setOverlapWarning('');
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setTitle(item.activity_title);
    setDescription(item.description || '');
    setSpeaker(item.speaker_performer || '');
    setStartTime(item.start_time);
    setEndTime(item.end_time);
    setVenue(item.location_venue);
    setColorTag(item.color_tag || '#3B82F6');
    setOverlapWarning('');
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        eventId: activeEvent?.id || 1,
        title,
        description,
        speaker,
        startTime,
        endTime,
        venue,
        colorTag
      };

      if (editingItem) {
        await api.updateSchedule(editingItem.id, payload);
      } else {
        await api.createSchedule(payload);
      }
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      alert(err.message || 'Error saving schedule item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this scheduled activity?')) {
      await api.deleteSchedule(id);
      onRefresh();
    }
  };

  const isOrganizer = currentUser?.role === 'admin' || currentUser?.role === 'coordinator';

  return (
    <div>
      {/* View Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-black)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarIcon size={24} color="var(--accent-blue)" /> Event Schedule
          </h1>
          <p style={{ color: 'var(--secondary-gray)', fontSize: '0.875rem' }}>
            Customizable activity timeline with automated conflict detection (FR-2.1 – FR-2.4)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Calendar / List View Toggle (FR-2.4) */}
          <div style={{ display: 'flex', background: 'var(--surface-hover)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('list')}
              className={`nav-tab-btn ${viewMode === 'list' ? 'active' : ''}`}
              style={{ padding: '0.35rem 0.75rem' }}
              title="List view"
            >
              <List size={15} /> List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`nav-tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
              style={{ padding: '0.35rem 0.75rem' }}
              title="Calendar grid view"
            >
              <Grid size={15} /> Calendar Grid
            </button>
          </div>

          {/* Add Activity Button (FR-2.2) */}
          {isOrganizer && (
            <button onClick={openAddModal} className="btn-primary">
              <Plus size={16} /> Add Activity
            </button>
          )}
        </div>
      </div>

      {/* Schedule Items List */}
      {viewMode === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {schedules.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary-gray)' }}>
              No scheduled activities yet. Click "Add Activity" to plan the timeline.
            </div>
          ) : (
            schedules.map((item, idx) => (
              <div
                key={item.id}
                className="card"
                style={{
                  borderLeft: `5px solid ${item.color_tag || 'var(--accent-blue)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.5rem',
                  gap: '1rem'
                }}
              >
                {/* Time Column */}
                <div style={{ minWidth: '130px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary-black)' }}>
                    <Clock size={15} color="var(--accent-blue)" />
                    {item.start_time} - {item.end_time}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--secondary-gray)', marginTop: '0.2rem' }}>
                    Slot #{idx + 1}
                  </div>
                </div>

                {/* Details Column */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary-black)', marginBottom: '0.3rem' }}>
                    {item.activity_title}
                  </h3>
                  {item.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--secondary-gray)', marginBottom: '0.5rem' }}>
                      {item.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', fontSize: '0.8rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--secondary-gray)' }}>
                      <MapPin size={14} color="var(--secondary-gray)" /> {item.location_venue}
                    </span>
                    {item.speaker_performer && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                        <User size={14} /> {item.speaker_performer}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isOrganizer && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={() => openEditModal(item)} className="btn-secondary" style={{ padding: '0.4rem 0.6rem' }} title="Edit">
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ padding: '0.4rem 0.6rem' }} title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Grid / Calendar View (FR-2.4) */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {schedules.map(item => (
            <div
              key={item.id}
              className="card"
              style={{
                borderTop: `4px solid ${item.color_tag || 'var(--accent-blue)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span className="badge badge-blue">
                    <Clock size={12} /> {item.start_time} - {item.end_time}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--secondary-gray)' }}>
                    {item.location_venue}
                  </span>
                </div>
                <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-black)', margin: '0.4rem 0' }}>
                  {item.activity_title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--secondary-gray)', lineHeight: 1.4 }}>
                  {item.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', fontWeight: 600 }}>
                  {item.speaker_performer || 'All Attendees'}
                </span>
                {isOrganizer && (
                  <div style={{ display: 'flex', gap: '0.3rem' }}>
                    <button onClick={() => openEditModal(item)} className="btn-secondary" style={{ padding: '0.25rem 0.45rem' }}>
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ padding: '0.25rem 0.45rem' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Activity Modal (FR-2.2, FR-2.3) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header">
              <h2 className="card-title">
                <CalendarIcon size={20} color="var(--accent-blue)" />
                {editingItem ? 'Edit Scheduled Activity' : 'Add New Activity'}
              </h2>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Activity Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robotics Showcase & Live Demo"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details about this session..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Speaker / Performer / Lead Group</label>
                <input
                  type="text"
                  placeholder="e.g. Prof. Alan Turing / Musical Circle"
                  value={speaker}
                  onChange={e => setSpeaker(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => handleVenueOrTimeChange(e.target.value, endTime, venue)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => handleVenueOrTimeChange(startTime, e.target.value, venue)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Location / Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Auditorium - Main Stage"
                    value={venue}
                    onChange={e => handleVenueOrTimeChange(startTime, endTime, e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Color Tag</label>
                  <input
                    type="color"
                    value={colorTag}
                    onChange={e => setColorTag(e.target.value)}
                    className="form-input"
                    style={{ height: '42px', padding: '4px' }}
                  />
                </div>
              </div>

              {/* Conflict Warning Callout (FR-2.3) */}
              {overlapWarning && (
                <div className="alert-warning" style={{ marginBottom: '1.25rem' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Schedule Conflict Detected:</strong>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>{overlapWarning}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Activity' : 'Save to Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
