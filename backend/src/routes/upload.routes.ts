// src/routes/upload.routes.ts
import { Router } from 'express';
import { uploadProductImage } from '../middleware/upload';   // sesuaikan path
import { uploadImage } from '../controllers/upload.controller';

const router = Router();

router.post(
    '/product-image',
    /* middleware login + admin yang sama seperti route brands */
    (req, res, next) =>
        uploadProductImage(req, res, (err) => {
            if (err) {
                const code = (err as { code?: string }).code;
                const message =
                    code === 'LIMIT_FILE_SIZE' ? 'Ukuran gambar maksimal 2 MB' : err.message || 'Gagal mengunggah gambar';
                return res.status(400).json({ message });
            }
            next();
        }),
    uploadImage,
);

export default router;