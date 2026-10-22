import { Request, Response } from 'express';
import { z } from 'zod';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db';

const variantSchema = z.object({
  storage: z.string().min(1, 'Storage wajib diisi'),
  color: z.string().min(1, 'Warna wajib diisi'),
  price: z.number().positive('Harga harus lebih dari 0'),
  stock: z.number().int().min(0, 'Stok tidak boleh negatif'),
});

const productSchema = z.object({
  brand_id: z.number().int().positive('Merek wajib dipilih'),
  name: z.string().min(1, 'Nama produk wajib diisi').max(150),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

const createProductSchema = productSchema.extend({
  variants: z.array(variantSchema).min(1, 'Minimal satu varian'),
});

const dbCode = (err: unknown) => (err as { code?: string }).code;

// ---------- PUBLIK ----------

export async function getProducts(req: Request, res: Response) {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  const offset = (page - 1) * limit;

  const where: string[] = ['p.is_active = 1'];
  const params: (string | number)[] = [];

  if (req.query.brand_id) {
    where.push('p.brand_id = ?');
    params.push(Number(req.query.brand_id));
  }
  if (req.query.search) {
    where.push('p.name LIKE ?');
    params.push(`%${String(req.query.search)}%`);
  }
  const whereSql = where.join(' AND ');

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id, p.name, p.image_url, b.name AS brand,
            MIN(v.price) AS min_price,
            COALESCE(SUM(v.stock), 0) AS total_stock
     FROM products p
     JOIN brands b ON b.id = p.brand_id
     LEFT JOIN product_variants v ON v.product_id = p.id
     WHERE ${whereSql}
     GROUP BY p.id, b.name
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM products p WHERE ${whereSql}`,
    params
  );

  res.json({ data: rows, page, limit, total: countRows[0].total });
}

export async function getProductById(req: Request, res: Response) {
  const id = Number(req.params.id);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT p.id, p.name, p.description, p.image_url, p.brand_id, b.name AS brand
     FROM products p
     JOIN brands b ON b.id = p.brand_id
     WHERE p.id = ? AND p.is_active = 1`,
    [id]
  );
  if (rows.length === 0) {
    return res.status(404).json({ message: 'Produk tidak ditemukan' });
  }

  const [variants] = await pool.query<RowDataPacket[]>(
    'SELECT id, storage, color, price, stock FROM product_variants WHERE product_id = ? ORDER BY price',
    [id]
  );

  res.json({ ...rows[0], variants });
}

// ---------- ADMIN: PRODUK ----------

export async function createProduct(req: Request, res: Response) {
  const parsed = createProductSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { brand_id, name, description, image_url, variants } = parsed.data;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query<ResultSetHeader>(
      'INSERT INTO products (brand_id, name, description, image_url) VALUES (?, ?, ?, ?)',
      [brand_id, name, description ?? null, image_url ?? null]
    );
    const productId = result.insertId;

    for (const v of variants) {
      await conn.query(
        'INSERT INTO product_variants (product_id, storage, color, price, stock) VALUES (?, ?, ?, ?, ?)',
        [productId, v.storage, v.color, v.price, v.stock]
      );
    }

    await conn.commit();
    res.status(201).json({ id: productId, name });
  } catch (err) {
    await conn.rollback();
    if (dbCode(err) === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Merek tidak ditemukan' });
    }
    if (dbCode(err) === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ada varian dengan storage dan warna yang sama' });
    }
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateProduct(req: Request, res: Response) {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { brand_id, name, description, image_url } = parsed.data;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE products SET brand_id = ?, name = ?, description = ?, image_url = ? WHERE id = ?',
      [brand_id, name, description ?? null, image_url ?? null, Number(req.params.id)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    res.json({ message: 'Produk diperbarui' });
  } catch (err) {
    if (dbCode(err) === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Merek tidak ditemukan' });
    }
    throw err;
  }
}

// Soft delete: produk disembunyikan, bukan dihapus, supaya riwayat pesanan tetap utuh
export async function deleteProduct(req: Request, res: Response) {
  const [result] = await pool.query<ResultSetHeader>(
    'UPDATE products SET is_active = 0 WHERE id = ?',
    [Number(req.params.id)]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Produk tidak ditemukan' });
  }
  res.json({ message: 'Produk dinonaktifkan' });
}

// ---------- ADMIN: VARIAN ----------

export async function addVariant(req: Request, res: Response) {
  const parsed = variantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { storage, color, price, stock } = parsed.data;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO product_variants (product_id, storage, color, price, stock) VALUES (?, ?, ?, ?, ?)',
      [Number(req.params.id), storage, color, price, stock]
    );
    res.status(201).json({ id: result.insertId, storage, color, price, stock });
  } catch (err) {
    if (dbCode(err) === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }
    if (dbCode(err) === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Varian dengan storage dan warna itu sudah ada' });
    }
    throw err;
  }
}

export async function updateVariant(req: Request, res: Response) {
  const parsed = variantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { storage, color, price, stock } = parsed.data;

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE product_variants SET storage = ?, color = ?, price = ?, stock = ? WHERE id = ? AND product_id = ?',
      [storage, color, price, stock, Number(req.params.variantId), Number(req.params.id)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Varian tidak ditemukan' });
    }
    res.json({ message: 'Varian diperbarui' });
  } catch (err) {
    if (dbCode(err) === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Varian dengan storage dan warna itu sudah ada' });
    }
    throw err;
  }
}

export async function deleteVariant(req: Request, res: Response) {
  try {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM product_variants WHERE id = ? AND product_id = ?',
      [Number(req.params.variantId), Number(req.params.id)]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Varian tidak ditemukan' });
    }
    res.json({ message: 'Varian dihapus' });
  } catch (err) {
    if (dbCode(err) === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({
        message: 'Varian sudah pernah dipesan, tidak bisa dihapus. Ubah stoknya jadi 0 saja.',
      });
    }
    throw err;
  }
}