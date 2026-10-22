import { Request, Response } from 'express';
import { z } from 'zod';
import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { findBestDiscount } from '../services/discount.service';

const addSchema = z.object({
  variant_id: z.number().int().positive('variant_id wajib diisi'),
  quantity: z.number().int().min(1, 'Jumlah minimal 1').default(1),
});

const updateSchema = z.object({
  quantity: z.number().int().min(1, 'Jumlah minimal 1'),
});

export async function getCart(req: Request, res: Response) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT c.variant_id, c.quantity, v.storage, v.color, v.price, v.stock,
            p.id AS product_id, p.name AS product_name, p.image_url
     FROM cart_items c
     JOIN product_variants v ON v.id = c.variant_id
     JOIN products p ON p.id = v.product_id
     WHERE c.user_id = ?
     ORDER BY c.id`,
    [req.user!.id]
  );

  const items = rows.map((r) => ({ ...r, line_total: r.price * r.quantity }));
  const subtotal = items.reduce((sum, i) => sum + i.line_total, 0);
  const discount = await findBestDiscount(subtotal);

  res.json({
    items,
    subtotal,
    discount_name: discount.name,
    discount_amount: discount.amount,
    total: subtotal - discount.amount,
  });
}

export async function addToCart(req: Request, res: Response) {
  const parsed = addSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const { variant_id, quantity } = parsed.data;
  const userId = req.user!.id;

  const [variants] = await pool.query<RowDataPacket[]>(
    `SELECT v.stock FROM product_variants v
     JOIN products p ON p.id = v.product_id
     WHERE v.id = ? AND p.is_active = 1`,
    [variant_id]
  );
  if (variants.length === 0) {
    return res.status(404).json({ message: 'Produk tidak ditemukan' });
  }

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT quantity FROM cart_items WHERE user_id = ? AND variant_id = ?',
    [userId, variant_id]
  );
  const newQty = (existing[0]?.quantity ?? 0) + quantity;

  if (newQty > variants[0].stock) {
    return res
      .status(400)
      .json({ message: `Stok tidak cukup (tersisa ${variants[0].stock})` });
  }

  await pool.query(
    `INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = ?`,
    [userId, variant_id, newQty, newQty]
  );
  res.status(201).json({ variant_id, quantity: newQty });
}

export async function updateCartItem(req: Request, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: parsed.error.issues[0].message });
  }
  const variantId = Number(req.params.variantId);

  const [variants] = await pool.query<RowDataPacket[]>(
    'SELECT stock FROM product_variants WHERE id = ?',
    [variantId]
  );
  if (variants.length === 0) {
    return res.status(404).json({ message: 'Produk tidak ditemukan' });
  }
  if (parsed.data.quantity > variants[0].stock) {
    return res
      .status(400)
      .json({ message: `Stok tidak cukup (tersisa ${variants[0].stock})` });
  }

  const [result] = await pool.query<import('mysql2').ResultSetHeader>(
    'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND variant_id = ?',
    [parsed.data.quantity, req.user!.id, variantId]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Item tidak ada di keranjang' });
  }
  res.json({ variant_id: variantId, quantity: parsed.data.quantity });
}

export async function removeCartItem(req: Request, res: Response) {
  const [result] = await pool.query<import('mysql2').ResultSetHeader>(
    'DELETE FROM cart_items WHERE user_id = ? AND variant_id = ?',
    [req.user!.id, Number(req.params.variantId)]
  );
  if (result.affectedRows === 0) {
    return res.status(404).json({ message: 'Item tidak ada di keranjang' });
  }
  res.json({ message: 'Item dihapus dari keranjang' });
}