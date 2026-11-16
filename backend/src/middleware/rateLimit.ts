import rateLimit from 'express-rate-limit';

// Dimatikan saat load test supaya k6 (yang semua requestnya dari satu IP) tidak ditolak
const disabled = process.env.DISABLE_RATE_LIMIT === 'true';

// Batas untuk login: maksimal 10 percobaan per IP dalam 15 menit
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10, // di express-rate-limit versi lama (v6 ke bawah) namanya "max"
  skip: () => disabled,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
});

// Batas untuk register: maksimal 5 akun baru per IP per jam
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  skip: () => disabled,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Terlalu banyak pendaftaran dari alamat ini, coba lagi nanti' },
});