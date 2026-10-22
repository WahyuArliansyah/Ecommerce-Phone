import { Router } from 'express';
import {
  addToCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '../controllers/cart.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:variantId', updateCartItem);
router.delete('/:variantId', removeCartItem);

export default router;