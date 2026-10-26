import { query } from '../../config/database.js';
import { createNotification } from '../../utils/notifications.js';

// Send alert to all members or selected group (Admin, Coordinator)
export const sendAlert = async (req, res) => {
  try {
    const { event_id, message, target_group } = req.body;
    if (!event_id || !message) return res.status(400).json({ error: 'event_id and message required' });

    // Save alert
    const result = await query(
      'INSERT INTO alerts (event_id, sender_id, message, target_group) VALUES ($1, $2, $3, $4) RETURNING *',
      [event_id, req.user.id, message, target_group || 'all']
    );

    // Get target members
    let memberQuery = "SELECT user_id FROM event_members WHERE event_id = $1 AND status = 'approved'";
    const params = [event_id];

    if (target_group && target_group !== 'all') {
      params.push(target_group);
      memberQuery += ` AND (role = $${params.length} OR area = $${params.length})`;
    }

    const members = await query(memberQuery, params);

    // Send notification to each target member
    for (const m of members.rows) {
      await createNotification(m.user_id, 'alert', 'Event Alert', message);
    }

    res.status(201).json({ alert: result.rows[0], notified: members.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get alerts for event
export const getAlerts = async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, u.username as sender_name FROM alerts a 
       JOIN users u ON a.sender_id = u.id 
       WHERE a.event_id = $1 ORDER BY a.created_at DESC`,
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
