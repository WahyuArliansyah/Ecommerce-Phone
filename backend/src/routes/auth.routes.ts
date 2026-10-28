import { Router } from 'express';
import { changePassword, login, me, register, updateProfile, uploadAvatar } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { handleUpload, uploadAvatarImage } from '../middleware/upload';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.put('/me', requireAuth, updateProfile);
router.put('/me/password', requireAuth, changePassword);// ganti password
router.post('/me/avatar', requireAuth, handleUpload(uploadAvatarImage), uploadAvatar); // upload foto profil

export default router;