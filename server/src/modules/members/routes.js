import { Router } from 'express';
import { requestJoin, handleRequest, addMember, removeMember, getMembers, getPendingRequests } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.post('/join', authenticate, requestJoin);
router.patch('/:id/handle', authenticate, authorize('Admin'), handleRequest);
router.post('/', authenticate, authorize('Admin'), addMember);
router.delete('/:id', authenticate, authorize('Admin'), removeMember);
router.get('/event/:eventId', authenticate, getMembers);
router.get('/pending/:eventId', authenticate, authorize('Admin'), getPendingRequests);

export default router;
