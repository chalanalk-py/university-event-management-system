import { Router } from 'express';
import { sendAlert, getAlerts } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('Admin', 'Coordinator'), sendAlert);
router.get('/event/:eventId', authenticate, getAlerts);

export default router;
