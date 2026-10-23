import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Pastikan folder uploads/payment_proofs ada
const uploadDir = path.join(process.cwd(), 'uploads', 'payment_proofs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Format: proof-<timestamp>-<random>.<ext>
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `proof-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

// Hanya izinkan gambar (JPG, PNG, WEBP)
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP'));
  }
};

export const uploadPaymentProof = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // maks 5 MB
}).single('payment_proof');
