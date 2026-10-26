import { Router } from 'express';
import { getNotifications, markRead, markAllRead, getPreferences, updatePreference } from './controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markRead);
router.patch('/read-all', authenticate, markAllRead);
router.get('/preferences', authenticate, getPreferences);
router.put('/preferences', authenticate, updatePreference);

export default router;
