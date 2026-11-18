import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Dimatikan saat load test menggunakan k6
const disabled = process.env.DISABLE_RATE_LIMIT === 'true';

// Batas untuk login: maksimal 10 percobaan per IP dalam 15 menit
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // lama waktu batas dalam 15 menit
  limit: 5,  // batas percobaan login
  skipSuccessfulRequests: true,  // batas percobaan login
  skip: () => disabled,
  // menghitung percobaan login berdasarkan email dan ip
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'tanpa-email';
    return `${ipKeyGenerator(req.ip ?? '')}|${email}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit',
    });
  },
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

// batas login per ip
export const ipLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  skip: () => disabled,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({ message: 'Terlalu banyak percobaan login dari alamat ini. Coba lagi nanti.' });
  },
});