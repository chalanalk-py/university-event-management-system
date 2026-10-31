import { Router } from 'express';
import { setBudget, addExpense, getBudget, getExpenses } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('Admin'), setBudget);
router.post('/expense', authenticate, addExpense);
router.get('/event/:eventId', authenticate, getBudget);
router.get('/expenses/:eventId', authenticate, getExpenses);

export default router;
