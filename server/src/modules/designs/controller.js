import { query } from '../../config/database.js';

// Upload design (Designer only)
export const uploadDesign = async (req, res) => {
  try {
    const { event_id, title, category } = req.body;
    if (!req.file) return res.status(400).json({ error: 'File is required' });
    if (!event_id || !title || !category) return res.status(400).json({ error: 'event_id, title, category required' });

    const file_url = `/uploads/${req.file.filename}`;
    const result = await query(
      'INSERT INTO designs (event_id, designer_id, title, file_url, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [event_id, req.user.id, title, file_url, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get designs grouped by category for event
export const getDesigns = async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, u.username as designer_name FROM designs d 
       JOIN users u ON d.designer_id = u.id 
       WHERE d.event_id = $1 ORDER BY d.category, d.created_at DESC`,
      [req.params.eventId]
    );

    // Group by category
    const grouped = {};
    result.rows.forEach(d => {
      if (!grouped[d.category]) grouped[d.category] = [];
      grouped[d.category].push(d);
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single design
export const getDesign = async (req, res) => {
  try {
    const result = await query(
      'SELECT d.*, u.username as designer_name FROM designs d JOIN users u ON d.designer_id = u.id WHERE d.id = $1',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Design not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete design (Designer who uploaded or Admin)
export const deleteDesign = async (req, res) => {
  try {
    const design = await query('SELECT designer_id FROM designs WHERE id = $1', [req.params.id]);
    if (!design.rows.length) return res.status(404).json({ error: 'Design not found' });
    if (design.rows[0].designer_id !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await query('DELETE FROM designs WHERE id = $1', [req.params.id]);
    res.json({ message: 'Design deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
