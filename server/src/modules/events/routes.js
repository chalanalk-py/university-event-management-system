import { Router } from 'express';
import { createEvent, getEvents, getEvent, updateEvent, deleteEvent } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('Admin'), createEvent);
router.get('/', authenticate, getEvents);
router.get('/:id', authenticate, getEvent);
router.put('/:id', authenticate, authorize('Admin'), updateEvent);
router.delete('/:id', authenticate, authorize('Admin'), deleteEvent);

export default router;
