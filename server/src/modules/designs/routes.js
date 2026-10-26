import { Router } from 'express';
import { uploadDesign, getDesigns, getDesign, deleteDesign } from './controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

router.post('/', authenticate, authorize('Designer', 'Admin'), upload.single('file'), uploadDesign);
router.get('/event/:eventId', authenticate, getDesigns);
router.get('/:id', authenticate, getDesign);
router.delete('/:id', authenticate, deleteDesign);

export default router;
