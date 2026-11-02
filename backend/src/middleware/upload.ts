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
    const ext = EXT[file.mimetype];
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
const EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const uploadAvatarImage = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarDir),
    filename: (_req, file, cb) =>
      cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e6)}${EXT[file.mimetype]}`),
  }),
  fileFilter, // filter JPG/PNG/WEBP yang sudah ada di file ini
  limits: { fileSize: 5 * 1024 * 1024 }, // maks 2 MB
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

// Tanda pengenal di awal isi file. MIME dari browser bisa dipalsukan, isi file tidak.
function detectImageType(b: Buffer): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return 'image/png';
  if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP')
    return 'image/webp';
  return null;
}

// Jalankan SETELAH multer. File yang isinya bukan gambar sesuai klaimnya dihapus dan ditolak.
export const verifyImage: RequestHandler = async (req, res, next) => {
  const file = req.file;
  if (!file) return next(); // ketiadaan file ditangani oleh handler route masing-masing

  let valid = false;
  try {
    const fh = await fs.promises.open(file.path, 'r');
    try {
      const buf = Buffer.alloc(12);
      const { bytesRead } = await fh.read(buf, 0, 12, 0);
      valid = detectImageType(buf.subarray(0, bytesRead)) === file.mimetype;
    } finally {
      await fh.close();
    }
  } catch {
    valid = false;
  }

  if (!valid) {
    await fs.promises.unlink(file.path).catch(() => { });
    return res.status(400).json({ message: 'File bukan gambar yang valid (JPG, PNG, atau WEBP)' });
  }
  next();
};