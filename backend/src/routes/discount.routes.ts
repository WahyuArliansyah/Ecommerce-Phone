import { Router } from 'express';
import {
  createDiscount,
  deleteDiscount,
  getActiveDiscounts,
  getAllDiscounts,
  previewDiscount,
  updateDiscount,
} from '../controllers/discount.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/active', getActiveDiscounts);
router.get('/preview', previewDiscount);

router.get('/', requireAuth, requireAdmin, getAllDiscounts);
router.post('/', requireAuth, requireAdmin, createDiscount);
router.put('/:id', requireAuth, requireAdmin, updateDiscount);
router.delete('/:id', requireAuth, requireAdmin, deleteDiscount);

export default router;