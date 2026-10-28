import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { addressSchema } from '../utils/validators';
import path from 'path';
import fs from 'fs';

// Aturan validasi untuk data register. Data dari user diperiksa dulu sebelum disimpan.
const registerSchema = z.object({
  name: z
    .string("Nama wajib diisi") // harus berupa teks
    .trim() // buang spasi di awal dan akhir
    .min(2, 'Nama minimal 2 karakter') // panjang minimal
    .max(100, 'Nama maksimal 100 karakter') // panjang maksimal
    .regex(
      // hanya boleh huruf, angka, spasi, titik, apostrof, dan strip
      /^[\p{L}\p{N} .'-]+$/u,
      'Nama hanya boleh berisi huruf, angka, spasi, titik, apostrof, dan strip'
    )
    // tolak nama yang mengandung kata "admin" (huruf besar/kecil sama saja)
    .refine((v) => !/admin/i.test(v), 'Nama tidak boleh mengandung kata "admin"'),

  // cek format email (harus ada @ dan domain)
  email: z.email('Format email tidak valid'),

  password: z
    .string("Password wajib diisi")
    .min(8, 'Password minimal 8 karakter') // minimal 8 karakter
    .max(72, 'Password maksimal 72 karakter') // batas maksimal bcrypt
    .regex(/[A-Za-z]/, 'Password harus mengandung huruf') // wajib ada huruf
    .regex(/\d/, 'Password harus mengandung angka'), // wajib ada angka

  phone: z
    .string()
    // format nomor HP Indonesia: 08..., 628..., atau +628...
    .regex(/^(\+62|62|0)8\d{8,11}$/, 'Nomor HP tidak valid (contoh: 081234567890)')
    .optional(), // boleh tidak diisi
});

const loginSchema = z.object({
  email: z.email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const profileSchema = z.object({
  name: registerSchema.shape.name,
  phone: registerSchema.shape.phone,
  address: addressSchema.optional()
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Password lama wajib diisi'),
    new_password: registerSchema.shape.password, // aturan sama seperti saat register
  })
  .refine((d) => d.current_password !== d.new_password, {
    message: 'Password baru tidak boleh sama dengan password lama',
    path: ['new_password'],
  });

function signToken(id: number, role: string) {
  return jwt.sign({ id, role }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'],
  });
}

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { name, email, password, phone } = parsed.data;

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM users WHERE email = ?',
    [email]
  );
  if (existing.length > 0) {
    return res.status(409).json({ message: 'Email sudah terdaftar' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
    [name, email, hashed, phone ?? null]
  );

  const token = signToken(result.insertId, 'customer');
  res.status(201).json({
    token,
    user: { id: result.insertId, name, email, role: 'customer', phone: phone ?? null, address: null, avatar: null },
  });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { email, password } = parsed.data;

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, email, password, role, phone, address, avatar FROM users WHERE email = ?',
    [email]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Email atau password salah' });
  }

  const token = signToken(user.id, user.role);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      avatar: user.avatar,
    },
  });
}

export async function me(req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, email, phone, address, role, avatar FROM users WHERE id = ?',
    [req.user!.id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ message: 'User tidak ditemukan' });
  }
  res.json(rows[0]);
}

// Customer mengubah data profilnya sendiri (nama, HP, alamat).
// Bersifat "timpa semua": field yang tidak dikirim akan dikosongkan.
export async function updateProfile(req: Request, res: Response) {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { name, phone, address } = parsed.data;

  await pool.query(
    'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
    [name, phone ?? null, address ?? null, req.user!.id] // ?? null = kalau kosong, simpan NULL
  );
  res.json({ name, phone: phone ?? null, address: address ?? null });
}

// Customer mengganti password sendiri. Harus menyertakan password lama.
export async function changePassword(req: Request, res: Response) {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { current_password, new_password } = parsed.data;

  const [rows] = await pool.query<RowDataPacket[]>('SELECT password FROM users WHERE id = ?', [req.user!.id]);
  const user = rows[0];
  // Sengaja 400, bukan 401: 401 bisa membuat frontend mengira token habis lalu logout otomatis
  if (!user || !(await bcrypt.compare(current_password, user.password))) {
    return res.status(400).json({ message: 'Password lama salah' });
  }

  const hashed = await bcrypt.hash(new_password, 10);
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user!.id]);
  res.json({ message: 'Password berhasil diganti' });
}

// Customer mengunggah foto profil (field form: "avatar")
export async function uploadAvatar(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: 'File foto wajib diisi (JPG, PNG, atau WEBP)' });
  }

  const [rows] = await pool.query<RowDataPacket[]>('SELECT avatar FROM users WHERE id = ?', [req.user!.id]);
  const oldAvatar: string | null = rows[0]?.avatar ?? null;

  await pool.query('UPDATE users SET avatar = ? WHERE id = ?', [req.file.filename, req.user!.id]);

  // Hapus foto lama supaya folder tidak menumpuk
  if (oldAvatar) {
    const oldPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(oldAvatar));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  res.json({ avatar: req.file.filename });
}