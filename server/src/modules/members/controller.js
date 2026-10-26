import { query } from '../../config/database.js';

// Request to join event (Student)
export const requestJoin = async (req, res) => {
  try {
    const { event_id } = req.body;
    const result = await query(
      "INSERT INTO event_members (event_id, user_id, status) VALUES ($1, $2, 'pending') RETURNING *",
      [event_id, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already requested' });
    res.status(500).json({ error: err.message });
  }
};

// Approve/reject member (Admin)
export const handleRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const result = await query(
      'UPDATE event_members SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Request not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add member directly (Admin)
export const addMember = async (req, res) => {
  try {
    const { event_id, user_id, role, area } = req.body;
    const result = await query(
      "INSERT INTO event_members (event_id, user_id, role, area, status) VALUES ($1, $2, $3, $4, 'approved') RETURNING *",
      [event_id, user_id, role, area]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Already a member' });
    res.status(500).json({ error: err.message });
  }
};

// Remove member (Admin)
export const removeMember = async (req, res) => {
  try {
    const result = await query('DELETE FROM event_members WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Member not found' });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get member list for event
export const getMembers = async (req, res) => {
  try {
    const result = await query(
      `SELECT em.*, u.username, u.email, u.role as user_role FROM event_members em 
       JOIN users u ON em.user_id = u.id WHERE em.event_id = $1 ORDER BY em.status, em.created_at`,
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get pending join requests (Admin)
export const getPendingRequests = async (req, res) => {
  try {
    const result = await query(
      `SELECT em.*, u.username, u.email FROM event_members em 
       JOIN users u ON em.user_id = u.id 
       WHERE em.event_id = $1 AND em.status = 'pending'`,
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
