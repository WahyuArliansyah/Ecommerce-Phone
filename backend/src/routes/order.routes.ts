import { Router } from 'express';
import {
  cancelMyOrder,
  checkout,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} from '../controllers/order.controller';
import { requireAdmin, requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth); // semua rute di sini wajib login

router.post('/', checkout); // customer: checkout
router.get('/', getMyOrders); // customer: riwayat pesanan sendiri
router.get('/admin/all', requireAdmin, getAllOrders); // admin: semua pesanan
router.get('/:id', getOrderById); // detail (pemilik atau admin)
router.put('/:id/cancel', cancelMyOrder); // customer: batalkan pesanan sendiri
router.put('/:id/status', requireAdmin, updateOrderStatus); // admin: ubah status

export default router;