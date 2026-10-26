import { query } from '../../config/database.js';

// Get notifications for current user
export const getNotifications = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark notification as read
export const markRead = async (req, res) => {
  try {
    const result = await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Notification not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark all as read
export const markAllRead = async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get notification preferences
export const getPreferences = async (req, res) => {
  try {
    const types = ['schedule_change', 'new_task', 'deadline', 'election_result', 'agenda_change', 'alert', 'general'];
    const result = await query('SELECT * FROM notification_preferences WHERE user_id = $1', [req.user.id]);

    // Build full preference map with defaults
    const prefs = types.map(type => {
      const existing = result.rows.find(r => r.type === type);
      return { type, enabled: existing ? existing.enabled : true };
    });

    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update notification preference
export const updatePreference = async (req, res) => {
  try {
    const { type, enabled } = req.body;
    const result = await query(
      `INSERT INTO notification_preferences (user_id, type, enabled) VALUES ($1, $2, $3) 
       ON CONFLICT (user_id, type) DO UPDATE SET enabled = $3 RETURNING *`,
      [req.user.id, type, enabled]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
