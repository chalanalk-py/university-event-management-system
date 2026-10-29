import { query } from '../../config/database.js';
import { createNotification } from '../../utils/notifications.js';

// Create task (Admin, Coordinator)
export const createTask = async (req, res) => {
  try {
    const { event_id, title, description, assignee_id, due_date } = req.body;
    if (!event_id || !title) return res.status(400).json({ error: 'event_id and title required' });

    const result = await query(
      'INSERT INTO tasks (event_id, title, description, assignee_id, due_date, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [event_id, title, description, assignee_id, due_date, req.user.id]
    );

    // Notify assignee
    if (assignee_id) {
      await createNotification(assignee_id, 'new_task', 'New Task Assigned', `Task "${title}" assigned to you.`);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const { title, description, assignee_id, due_date } = req.body;
    const result = await query(
      `UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description), 
       assignee_id = COALESCE($3, assignee_id), due_date = COALESCE($4, due_date), updated_at = NOW() 
       WHERE id = $5 RETURNING *`,
      [title, description, assignee_id, due_date, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete task (Admin, Coordinator)
export const deleteTask = async (req, res) => {
  try {
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Move task between sections (assignee can move their own tasks)
export const moveTask = async (req, res) => {
  try {
    const { section } = req.body;
    if (!['todo', 'in_progress', 'done'].includes(section)) {
      return res.status(400).json({ error: 'Invalid section' });
    }

    const task = await query('SELECT assignee_id FROM tasks WHERE id = $1', [req.params.id]);
    if (!task.rows.length) return res.status(404).json({ error: 'Task not found' });

    // Only assignee, Admin, or Coordinator can move
    if (task.rows[0].assignee_id !== req.user.id && !['Admin', 'Coordinator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only assignee can move this task' });
    }

    const result = await query(
      'UPDATE tasks SET section = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [section, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all tasks for event (organized by section)
export const getTasks = async (req, res) => {
  try {
    const result = await query(
      `SELECT t.*, u.username as assignee_name FROM tasks t 
       LEFT JOIN users u ON t.assignee_id = u.id 
       WHERE t.event_id = $1 ORDER BY t.section, t.due_date`,
      [req.params.eventId]
    );

    // Group by section
    const grouped = { todo: [], in_progress: [], done: [] };
    result.rows.forEach(t => grouped[t.section].push(t));

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get tasks assigned to current user
export const getMyTasks = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM tasks WHERE assignee_id = $1 ORDER BY due_date',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get task progress stats for event
export const getProgress = async (req, res) => {
  try {
    const result = await query(
      `SELECT section, COUNT(*) as count FROM tasks WHERE event_id = $1 GROUP BY section`,
      [req.params.eventId]
    );
    const total = result.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    const done = result.rows.find(r => r.section === 'done');
    const doneCount = done ? parseInt(done.count) : 0;
    const percentage = total > 0 ? Math.round((doneCount / total) * 100) : 0;

    res.json({ sections: result.rows, total, done: doneCount, percentage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
