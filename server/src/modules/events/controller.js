import { query } from '../../config/database.js';

// Create event (Admin only)
export const createEvent = async (req, res) => {
  try {
    const { title, description, venue, event_date, event_time } = req.body;
    if (!title || !event_date || !event_time) {
      return res.status(400).json({ error: 'Title, date, and time are required' });
    }
    const result = await query(
      'INSERT INTO events (title, description, venue, event_date, event_time, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, venue, event_date, event_time, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all events
export const getEvents = async (req, res) => {
  try {
    const result = await query('SELECT * FROM events ORDER BY event_date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single event
export const getEvent = async (req, res) => {
  try {
    const result = await query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update event (Admin only)
export const updateEvent = async (req, res) => {
  try {
    const { title, description, venue, event_date, event_time } = req.body;
    const result = await query(
      'UPDATE events SET title = COALESCE($1, title), description = COALESCE($2, description), venue = COALESCE($3, venue), event_date = COALESCE($4, event_date), event_time = COALESCE($5, event_time), updated_at = NOW() WHERE id = $6 RETURNING *',
      [title, description, venue, event_date, event_time, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete event (Admin only)
export const deleteEvent = async (req, res) => {
  try {
    const result = await query('DELETE FROM events WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
