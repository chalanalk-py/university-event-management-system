import { Router } from 'express';
import { addActivity, updateActivity, deleteActivity, getSchedule } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// Team members (Admin, Coordinator, Event Member) can manage activities
router.post('/', authenticate, authorize('Admin', 'Coordinator', 'Event Member'), addActivity);
router.put('/:id', authenticate, authorize('Admin', 'Coordinator', 'Event Member'), updateActivity);
router.delete('/:id', authenticate, authorize('Admin', 'Coordinator', 'Event Member'), deleteActivity);

// All authenticated users can view schedule
router.get('/event/:eventId', authenticate, getSchedule);

export default router;
