import { Router } from 'express';
import { changePassword, login, me, register, updateProfile, uploadAvatar } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { handleUpload, uploadAvatarImage, verifyImage } from '../middleware/upload';
import { ipLoginLimiter, loginLimiter, registerLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, ipLoginLimiter, login);
router.get('/me', requireAuth, me);
router.put('/me', requireAuth, updateProfile);
router.put('/me/password', requireAuth, changePassword);// ganti password
router.post('/me/avatar', requireAuth, handleUpload(uploadAvatarImage), verifyImage, uploadAvatar);

export default router;