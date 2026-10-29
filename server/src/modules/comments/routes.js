import { Router } from 'express';
import { addComment, getComments, deleteComment } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.post('/', authenticate, addComment);
router.get('/design/:designId', authenticate, getComments);
router.delete('/:id', authenticate, authorize('Admin'), deleteComment);

export default router;
