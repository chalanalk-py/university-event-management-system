import { query } from '../../config/database.js';

// Post lost item
export const postLostItem = async (req, res) => {
  try {
    const { event_id, description, location, collection_point, post_date } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : (req.body.photo_url || null);
    if (!description) return res.status(400).json({ error: 'Description required' });

    const result = await query(
      `INSERT INTO lost_found_posts (event_id, user_id, type, description, photo_url, location, collection_point, post_date) 
       VALUES ($1, $2, 'lost', $3, $4, $5, $6, $7) RETURNING *`,
      [event_id, req.user.id, description, photo_url, location || null, collection_point || null, post_date || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Post found item
export const postFoundItem = async (req, res) => {
  try {
    const { event_id, description, location, collection_point, post_date } = req.body;
    const photo_url = req.file ? `/uploads/${req.file.filename}` : (req.body.photo_url || null);
    if (!description) return res.status(400).json({ error: 'Description required' });

    const result = await query(
      `INSERT INTO lost_found_posts (event_id, user_id, type, description, photo_url, location, collection_point, post_date) 
       VALUES ($1, $2, 'found', $3, $4, $5, $6, $7) RETURNING *`,
      [event_id, req.user.id, description, photo_url, location || null, collection_point || null, post_date || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get posts with search/filter
export const getPosts = async (req, res) => {
  try {
    const { type, search, status } = req.query;
    let sql = 'SELECT lf.*, u.username FROM lost_found_posts lf JOIN users u ON lf.user_id = u.id WHERE lf.event_id = $1';
    const params = [req.params.eventId];

    if (type) { params.push(type); sql += ` AND lf.type = $${params.length}`; }
    if (status) { params.push(status); sql += ` AND lf.status = $${params.length}`; }
    if (search) { params.push(`%${search}%`); sql += ` AND (lf.description ILIKE $${params.length} OR lf.location ILIKE $${params.length})`; }

    sql += ' ORDER BY lf.created_at DESC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark post as resolved (poster only)
export const resolvePost = async (req, res) => {
  try {
    const result = await query(
      "UPDATE lost_found_posts SET status = 'resolved', updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Post not found or not authorized' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
