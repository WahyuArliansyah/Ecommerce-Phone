import { Router } from 'express';
import {
  addVariant,
  createProduct,
  deleteProduct,
  deleteVariant,
  getProductById,
  getProducts,
  updateProduct,
  updateVariant,
} from '../controllers/product.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);

router.post('/', requireAuth, requireAdmin, createProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

router.post('/:id/variants', requireAuth, requireAdmin, addVariant);
router.put('/:id/variants/:variantId', requireAuth, requireAdmin, updateVariant);
router.delete('/:id/variants/:variantId', requireAuth, requireAdmin, deleteVariant);

export default router;