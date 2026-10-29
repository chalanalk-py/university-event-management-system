import { Router } from 'express';
import { addContact, updateContact, deleteContact, getContacts, getCoordinators } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('Admin', 'Coordinator'), addContact);
router.put('/:id', authenticate, authorize('Admin', 'Coordinator'), updateContact);
router.delete('/:id', authenticate, authorize('Admin', 'Coordinator'), deleteContact);
router.get('/event/:eventId', authenticate, getContacts);
router.get('/coordinators/:eventId', authenticate, getCoordinators);

export default router;
