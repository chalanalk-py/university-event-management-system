import { Router } from 'express';
import { createTask, updateTask, deleteTask, moveTask, getTasks, getMyTasks, getProgress } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('Admin', 'Coordinator'), createTask);
router.put('/:id', authenticate, authorize('Admin', 'Coordinator'), updateTask);
router.delete('/:id', authenticate, authorize('Admin', 'Coordinator'), deleteTask);
router.patch('/:id/move', authenticate, moveTask);
router.get('/event/:eventId', authenticate, getTasks);
router.get('/my', authenticate, getMyTasks);
router.get('/progress/:eventId', authenticate, getProgress);

export default router;
