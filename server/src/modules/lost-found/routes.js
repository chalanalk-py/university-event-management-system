import { Router } from 'express';
import { postLostItem, postFoundItem, getPosts, resolvePost } from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

router.post('/lost', authenticate, upload.single('photo'), postLostItem);
router.post('/found', authenticate, upload.single('photo'), postFoundItem);
router.get('/event/:eventId', authenticate, getPosts);
router.patch('/:id/resolve', authenticate, resolvePost);

export default router;
