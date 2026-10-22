import { Router } from 'express';
import {
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from '../controllers/brand.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', getBrands);
router.post('/', requireAuth, requireAdmin, createBrand);
router.put('/:id', requireAuth, requireAdmin, updateBrand);
router.delete('/:id', requireAuth, requireAdmin, deleteBrand);

export default router;