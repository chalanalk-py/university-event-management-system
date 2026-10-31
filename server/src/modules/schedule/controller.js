import { query } from '../../config/database.js';
import { notifyMany } from '../../utils/notifications.js';

// Add schedule activity with overlap detection
export const addActivity = async (req, res) => {
  try {
    const { event_id, title, description, start_time, end_time } = req.body;
    if (!event_id || !title || !start_time || !end_time) {
      return res.status(400).json({ error: 'event_id, title, start_time, end_time required' });
    }

    // Check for overlapping activities
    const overlaps = await query(
      `SELECT id, title, start_time, end_time FROM schedule_activities 
       WHERE event_id = $1 AND (
         (start_time < $3 AND end_time > $2)
       )`,
      [event_id, start_time, end_time]
    );

    let warning = null;
    if (overlaps.rows.length) {
      warning = { message: 'Time slot conflicts detected', conflicts: overlaps.rows };
    }

    const result = await query(
      'INSERT INTO schedule_activities (event_id, title, description, start_time, end_time, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [event_id, title, description, start_time, end_time, req.user.id]
    );

    // Notify event members about schedule change
    const members = await query('SELECT user_id FROM event_members WHERE event_id = $1 AND status = $2', [event_id, 'approved']);
    const memberIds = members.rows.map(m => m.user_id);
    if (memberIds.length) {
      await notifyMany(memberIds, 'schedule_change', 'Schedule Updated', `New activity "${title}" added.`);
    }

    res.status(201).json({ activity: result.rows[0], warning });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Edit activity
export const updateActivity = async (req, res) => {
  try {
    const { title, description, start_time, end_time } = req.body;

    // Check overlaps if times changed
    if (start_time && end_time) {
      const current = await query('SELECT event_id FROM schedule_activities WHERE id = $1', [req.params.id]);
      if (current.rows.length) {
        const overlaps = await query(
          `SELECT id, title FROM schedule_activities 
           WHERE event_id = $1 AND id != $2 AND (start_time < $4 AND end_time > $3)`,
          [current.rows[0].event_id, req.params.id, start_time, end_time]
        );
        if (overlaps.rows.length) {
          return res.status(409).json({ error: 'Time slot conflicts', conflicts: overlaps.rows });
        }
      }
    }

    const result = await query(
      `UPDATE schedule_activities SET title = COALESCE($1, title), description = COALESCE($2, description), 
       start_time = COALESCE($3, start_time), end_time = COALESCE($4, end_time), updated_at = NOW() 
       WHERE id = $5 RETURNING *`,
      [title, description, start_time, end_time, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Activity not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete activity
export const deleteActivity = async (req, res) => {
  try {
    const result = await query('DELETE FROM schedule_activities WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Activity not found' });
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get schedule for event (calendar/list view)
export const getSchedule = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM schedule_activities WHERE event_id = $1 ORDER BY start_time',
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
