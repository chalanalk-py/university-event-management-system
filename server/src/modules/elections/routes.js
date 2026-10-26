import { Router } from 'express';
import { createElection, getElections, getElection, nominate, vote, getCommittee } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

router.post('/', authenticate, authorize('Admin'), createElection);
router.get('/event/:eventId', authenticate, getElections);
router.get('/:id', authenticate, getElection);
router.post('/nominate', authenticate, nominate);
router.post('/vote', authenticate, vote);
router.get('/:electionId/committee', authenticate, getCommittee);

export default router;
