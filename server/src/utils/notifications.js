import { query } from '../config/database.js';
import { getIO } from '../realtime/socket.js';

// Create notification and push via Socket.IO
export const createNotification = async (userId, type, title, message) => {
  const result = await query(
    'INSERT INTO notifications (user_id, type, title, message) VALUES ($1, $2, $3, $4) RETURNING *',
    [userId, type, title, message]
  );

  // Check user preference before pushing
  const pref = await query(
    'SELECT enabled FROM notification_preferences WHERE user_id = $1 AND type = $2',
    [userId, type]
  );

  // Push if no preference set (default enabled) or explicitly enabled
  if (!pref.rows.length || pref.rows[0].enabled) {
    try {
      const io = getIO();
      io.to(`user_${userId}`).emit('notification', result.rows[0]);
    } catch {
      // Socket not initialized, skip push
    }
  }

  return result.rows[0];
};

// Bulk notify multiple users
export const notifyMany = async (userIds, type, title, message) => {
  const promises = userIds.map(id => createNotification(id, type, title, message));
  return Promise.all(promises);
};
