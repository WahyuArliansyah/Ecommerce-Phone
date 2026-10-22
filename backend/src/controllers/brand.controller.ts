import { Request, Response } from 'express';
import { z } from 'zod';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db';

const brandSchema = z.object({
  name: z.string().min(1, 'Nama merek wajib diisi').max(100),
});

export async function getBrands(_req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, name FROM brands ORDER BY name'
  );
  res.json(rows);
}

export async function createBrand(req: Request, res: Response) {
  const parsed = brandSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO brands (name) VALUES (?)',
      [parsed.data.name]
    );
    res.status(201).json({ id: result.insertId, name: parsed.data.name });
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Merek sudah ada' });
    }
    throw err;
  }
}

export async function updateBrand(req: Request, res: Response) {
  const parsed = brandSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE brands SET name = ? WHERE id = ?',
      [parsed.data.name, Number(req.params.id)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Merek tidak ditemukan' });
    }
    res.json({ id: Number(req.params.id), name: parsed.data.name });
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Merek sudah ada' });
    }
    throw err;
  }
}

export async function deleteBrand(req: Request, res: Response) {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM brands WHERE id = ?',
      [Number(req.params.id)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Merek tidak ditemukan' });
    }
    res.json({ message: 'Merek dihapus' });
  } catch (err) {
    if ((err as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2') {
      return res
        .status(409)
        .json({ message: 'Merek masih dipakai oleh produk, tidak bisa dihapus' });
    }
    throw err;
  }
}