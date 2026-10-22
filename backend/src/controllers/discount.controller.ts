import { Request, Response } from 'express';
import { z } from 'zod';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { findBestDiscount } from '../services/discount.service';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

const discountSchema = z
  .object({
    name: z.string().min(1, 'Nama diskon wajib diisi').max(100),
    min_purchase: z.number().positive('Minimal belanja harus lebih dari 0'),
    discount_type: z.enum(['percent', 'fixed']),
    discount_value: z.number().positive('Nilai diskon harus lebih dari 0'),
    max_discount: z.number().positive().nullable().optional(),
    is_active: z.boolean().optional(),
    start_date: dateString.nullable().optional(),
    end_date: dateString.nullable().optional(),
  })
  .refine((d) => d.discount_type !== 'percent' || d.discount_value <= 100, {
    message: 'Diskon persen maksimal 100',
  })
  .refine((d) => !d.start_date || !d.end_date || d.start_date <= d.end_date, {
    message: 'Tanggal selesai harus sama atau setelah tanggal mulai',
  });

function toValues(d: z.infer<typeof discountSchema>) {
  return [
    d.name,
    d.min_purchase,
    d.discount_type,
    d.discount_value,
    d.max_discount ?? null,
    d.is_active === false ? 0 : 1,
    d.start_date ?? null,
    d.end_date ?? null,
  ];
}

// ---------- PUBLIK ----------

export async function getActiveDiscounts(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, min_purchase, discount_type, discount_value, max_discount
     FROM discount_rules
     WHERE is_active = 1
       AND (start_date IS NULL OR start_date <= CURDATE())
       AND (end_date IS NULL OR end_date >= CURDATE())
     ORDER BY min_purchase`
  );
  res.json(rows);
}

// Untuk mencoba hitungan diskon tanpa checkout: /api/discounts/preview?subtotal=15000000
export async function previewDiscount(req: Request, res: Response) {
  const subtotal = Number(req.query.subtotal);
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return res.status(400).json({ message: 'subtotal harus berupa angka' });
  }

  const best = await findBestDiscount(subtotal);
  res.json({
    subtotal,
    discount_amount: best.amount,
    total: subtotal - best.amount,
    rule: best.ruleId ? { id: best.ruleId, name: best.name } : null,
  });
}

// ---------- ADMIN ----------

export async function getAllDiscounts(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM discount_rules ORDER BY min_purchase'
  );
  res.json(rows);
}

export async function createDiscount(req: Request, res: Response) {
  const parsed = discountSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO discount_rules
       (name, min_purchase, discount_type, discount_value, max_discount, is_active, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    toValues(parsed.data)
  );
  res.status(201).json({ id: result.insertId, ...parsed.data });
}

export async function updateDiscount(req: Request, res: Response) {
  const parsed = discountSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE discount_rules
     SET name = ?, min_purchase = ?, discount_type = ?, discount_value = ?,
         max_discount = ?, is_active = ?, start_date = ?, end_date = ?
     WHERE id = ?`,
    [...toValues(parsed.data), Number(req.params.id)]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Aturan diskon tidak ditemukan' });
  }
  res.json({ message: 'Aturan diskon diperbarui' });
}

export async function deleteDiscount(req: Request, res: Response) {
  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM discount_rules WHERE id = ?',
    [Number(req.params.id)]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Aturan diskon tidak ditemukan' });
  }
  res.json({ message: 'Aturan diskon dihapus' });
}