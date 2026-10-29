import { Router } from 'express';
import { createAgenda, getAgenda, updateItemStatus, reorderItems, addItem } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('Admin'), createAgenda);
router.get('/event/:eventId', authenticate, getAgenda);
router.patch('/item/:id/status', authenticate, authorize('Admin', 'Live Agenda Controller'), updateItemStatus);
router.put('/reorder', authenticate, authorize('Admin', 'Live Agenda Controller'), reorderItems);
router.post('/item', authenticate, authorize('Admin', 'Live Agenda Controller'), addItem);

export default router;
