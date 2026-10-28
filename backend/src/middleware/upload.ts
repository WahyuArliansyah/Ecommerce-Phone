import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { RequestHandler } from 'express';

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

// Folder khusus gambar produk (dibuat otomatis kalau belum ada)
const productDir = path.join(process.cwd(), 'uploads', 'products');
if (!fs.existsSync(productDir)) {
  fs.mkdirSync(productDir, { recursive: true });
}

const productStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  },
});

export const uploadProductImage = multer({
  storage: productStorage,
  fileFilter, // filter JPG/PNG/WEBP yang sudah ada di atas, dipakai ulang
  limits: { fileSize: 2 * 1024 * 1024 }, // maksimal 2 MB
}).single('image');

// ====== FOTO PROFIL ======
const avatarDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// Ekstensi diambil dari tipe file yang sudah diverifikasi, bukan dari nama asli file
const AVATAR_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const uploadAvatarImage = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarDir),
    filename: (_req, file, cb) =>
      cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e6)}${AVATAR_EXT[file.mimetype]}`),
  }),
  fileFilter, // filter JPG/PNG/WEBP yang sudah ada di file ini
  limits: { fileSize: 2 * 1024 * 1024 }, // maks 2 MB
}).single('avatar');

// Pembungkus: error multer (format salah / terlalu besar) dibalas 400 dengan pesan jelas, bukan 500
export const handleUpload =
  (mw: RequestHandler): RequestHandler =>
  (req, res, next) =>
    mw(req, res, (err?: unknown) => {
      if (err) {
        const code = (err as { code?: string }).code;
        const message =
          code === 'LIMIT_FILE_SIZE'
            ? 'Ukuran gambar maksimal 2 MB'
            : (err as Error).message || 'Gagal mengunggah gambar';
        return res.status(400).json({ message });
      }
      next();
    });