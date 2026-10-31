import { query } from '../../config/database.js';

// Add comment (supports anonymous)
export const addComment = async (req, res) => {
  try {
    const { design_id, comment_text, is_anonymous } = req.body;
    if (!design_id || !comment_text) return res.status(400).json({ error: 'design_id and comment_text required' });

    const result = await query(
      'INSERT INTO design_comments (design_id, user_id, comment_text, is_anonymous) VALUES ($1, $2, $3, $4) RETURNING *',
      [design_id, req.user.id, comment_text, is_anonymous || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get comments for design (hide user identity for anonymous comments from designer)
export const getComments = async (req, res) => {
  try {
    const design = await query('SELECT designer_id FROM designs WHERE id = $1', [req.params.designId]);
    const isDesigner = design.rows.length && design.rows[0].designer_id === req.user.id;

    const result = await query(
      `SELECT dc.id, dc.design_id, dc.comment_text, dc.is_anonymous, dc.created_at, dc.user_id, u.username
       FROM design_comments dc JOIN users u ON dc.user_id = u.id 
       WHERE dc.design_id = $1 ORDER BY dc.created_at DESC`,
      [req.params.designId]
    );

    // Hide commenter identity from designer for anonymous comments
    const comments = result.rows.map(c => {
      if (c.is_anonymous && isDesigner) {
        return { ...c, user_id: null, username: 'Anonymous' };
      }
      // Non-designer can see who commented (for admin moderation)
      if (c.is_anonymous && req.user.role !== 'Admin') {
        return { ...c, user_id: null, username: 'Anonymous' };
      }
      return c;
    });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete comment (Admin only - remove abusive comments)
export const deleteComment = async (req, res) => {
  try {
    const result = await query('DELETE FROM design_comments WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Comment not found' });
    res.json({ message: 'Comment removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
