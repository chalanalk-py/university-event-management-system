import { Router } from 'express';
import { register, login, getProfile, getAllUsers, updateRole } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.get('/users', authenticate, authorize('Admin'), getAllUsers);
router.patch('/users/:id/role', authenticate, authorize('Admin'), updateRole);

export default router;
