import { query } from '../../config/database.js';
import { getIO } from '../../realtime/socket.js';
import { notifyMany } from '../../utils/notifications.js';

// Create agenda (Admin)
export const createAgenda = async (req, res) => {
  try {
    const { event_id, controller_id, items } = req.body;
    if (!event_id) return res.status(400).json({ error: 'event_id required' });

    const result = await query(
      'INSERT INTO agendas (event_id, created_by, controller_id) VALUES ($1, $2, $3) RETURNING *',
      [event_id, req.user.id, controller_id]
    );

    // Assign controller role if specified
    if (controller_id) {
      await query("UPDATE users SET role = 'Live Agenda Controller' WHERE id = $1", [controller_id]);
    }

    // Add items if provided
    if (items && items.length) {
      for (let i = 0; i < items.length; i++) {
        await query(
          'INSERT INTO agenda_items (agenda_id, title, performer, scheduled_time, sort_order) VALUES ($1, $2, $3, $4, $5)',
          [result.rows[0].id, items[i].title, items[i].performer, items[i].scheduled_time, i]
        );
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get agenda with items
export const getAgenda = async (req, res) => {
  try {
    const agenda = await query('SELECT * FROM agendas WHERE event_id = $1', [req.params.eventId]);
    if (!agenda.rows.length) return res.json({ agenda: null });

    const items = await query(
      'SELECT * FROM agenda_items WHERE agenda_id = $1 ORDER BY sort_order',
      [agenda.rows[0].id]
    );

    res.json({ ...agenda.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update item status (Controller: now_performing, completed, delayed)
export const updateItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await query(
      'UPDATE agenda_items SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Item not found' });

    // Get event_id for realtime broadcast
    const agenda = await query('SELECT event_id FROM agendas WHERE id = $1', [result.rows[0].agenda_id]);
    const eventId = agenda.rows[0].event_id;

    // Broadcast realtime update to all attendees
    try {
      const io = getIO();
      const items = await query('SELECT * FROM agenda_items WHERE agenda_id = $1 ORDER BY sort_order', [result.rows[0].agenda_id]);
      const currentItem = items.rows.find(i => i.status === 'now_performing');
      const nextItem = items.rows.find(i => i.status === 'upcoming');
      io.to(`event_${eventId}`).emit('agenda_update', { current: currentItem, next: nextItem, items: items.rows });
    } catch { /* Socket not ready */ }

    // Notify about agenda change
    const members = await query('SELECT user_id FROM event_members WHERE event_id = $1 AND status = $2', [eventId, 'approved']);
    if (members.rows.length) {
      await notifyMany(members.rows.map(m => m.user_id), 'agenda_change', 'Agenda Update', `"${result.rows[0].title}" is now ${status.replace('_', ' ')}.`);
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Reorder items (Controller)
export const reorderItems = async (req, res) => {
  try {
    const { items } = req.body;
    // items = [{ id, sort_order, scheduled_time }]
    for (const item of items) {
      await query(
        'UPDATE agenda_items SET sort_order = $1, scheduled_time = COALESCE($2, scheduled_time), updated_at = NOW() WHERE id = $3',
        [item.sort_order, item.scheduled_time, item.id]
      );
    }

    // Broadcast update
    if (items.length) {
      const firstItem = await query('SELECT agenda_id FROM agenda_items WHERE id = $1', [items[0].id]);
      const agenda = await query('SELECT event_id FROM agendas WHERE id = $1', [firstItem.rows[0].agenda_id]);
      try {
        const io = getIO();
        const updatedItems = await query('SELECT * FROM agenda_items WHERE agenda_id = $1 ORDER BY sort_order', [firstItem.rows[0].agenda_id]);
        io.to(`event_${agenda.rows[0].event_id}`).emit('agenda_update', { items: updatedItems.rows });
      } catch { /* Socket not ready */ }
    }

    res.json({ message: 'Items reordered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add agenda item
export const addItem = async (req, res) => {
  try {
    const { agenda_id, title, performer, scheduled_time } = req.body;
    const maxOrder = await query('SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM agenda_items WHERE agenda_id = $1', [agenda_id]);
    const result = await query(
      'INSERT INTO agenda_items (agenda_id, title, performer, scheduled_time, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [agenda_id, title, performer, scheduled_time, maxOrder.rows[0].next]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
