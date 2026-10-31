import { query } from '../../config/database.js';

// Add contact (Admin, Coordinator)
export const addContact = async (req, res) => {
  try {
    const { event_id, name, phone, email, notes, category } = req.body;
    if (!event_id || !name) return res.status(400).json({ error: 'event_id and name required' });
    const result = await query(
      'INSERT INTO contacts (event_id, name, phone, email, notes, category, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [event_id, name, phone, email, notes, category, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update contact
export const updateContact = async (req, res) => {
  try {
    const { name, phone, email, notes, category } = req.body;
    const result = await query(
      `UPDATE contacts SET name = COALESCE($1, name), phone = COALESCE($2, phone), email = COALESCE($3, email), 
       notes = COALESCE($4, notes), category = COALESCE($5, category), updated_at = NOW() WHERE id = $6 RETURNING *`,
      [name, phone, email, notes, category, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Contact not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete contact
export const deleteContact = async (req, res) => {
  try {
    const result = await query('DELETE FROM contacts WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Contact not found' });
    res.json({ message: 'Contact deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get contacts with search and filter by category
export const getContacts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM contacts WHERE event_id = $1';
    const params = [req.params.eventId];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length})`;
    }

    sql += ' ORDER BY category, name';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get event coordinators list
export const getCoordinators = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, em.area, em.role FROM event_members em 
       JOIN users u ON em.user_id = u.id 
       WHERE em.event_id = $1 AND (u.role = 'Coordinator' OR em.role = 'Coordinator') AND em.status = 'approved'`,
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
