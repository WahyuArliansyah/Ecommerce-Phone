import { Request, Response } from 'express';
import { z } from 'zod';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { findBestDiscount } from '../services/discount.service';
import { addressSchema } from '../utils/validators';

const checkoutSchema = z.object({
    shipping_address: addressSchema.optional(),
});

class CheckoutError extends Error { }

export async function checkout(req: Request, res: Response) {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const userId = req.user!.id;
    // Tentukan alamat: pakai yang dikirim saat checkout, kalau tidak ada pakai alamat profil
    let address = parsed.data.shipping_address;
    if (!address) {
        const [users] = await pool.query<RowDataPacket[]>(
            'SELECT address FROM users WHERE id = ?',
            [userId]
        );
        address = users[0]?.address;
    }
    if (!address) {
        return res.status(400).json({
            message: 'Alamat pengiriman belum diisi. Lengkapi alamat di profil atau isi saat checkout.',
        });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [items] = await conn.query<RowDataPacket[]>(
            `SELECT c.variant_id, c.quantity, v.price, v.stock, v.storage, v.color,
              p.name AS product_name, p.is_active
       FROM cart_items c
       JOIN product_variants v ON v.id = c.variant_id
       JOIN products p ON p.id = v.product_id
       WHERE c.user_id = ?
       ORDER BY c.variant_id
       FOR UPDATE`,
            [userId]
        );

        if (items.length === 0) {
            throw new CheckoutError('Keranjang kosong');
        }

        let subtotal = 0;
        for (const item of items) {
            const label = `${item.product_name} ${item.storage} ${item.color}`;
            if (!item.is_active) {
                throw new CheckoutError(`${label} sudah tidak dijual`);
            }
            if (item.quantity > item.stock) {
                throw new CheckoutError(`Stok ${label} tidak cukup (tersisa ${item.stock})`);
            }
            subtotal += item.price * item.quantity;
        }

        const discount = await findBestDiscount(subtotal);
        const total = subtotal - discount.amount;

        const [orderResult] = await conn.query<ResultSetHeader>(
            `INSERT INTO orders (user_id, discount_rule_id, subtotal, discount_amount, total, shipping_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, discount.ruleId, subtotal, discount.amount, total, address]
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            await conn.query(
                `INSERT INTO order_items (order_id, variant_id, product_name, quantity, price)
         VALUES (?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.variant_id,
                    `${item.product_name} ${item.storage} ${item.color}`,
                    item.quantity,
                    item.price,
                ]
            );
            await conn.query(
                'UPDATE product_variants SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.variant_id]
            );
        }

        await conn.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);

        await conn.commit();
        res.status(201).json({
            id: orderId,
            subtotal,
            discount_name: discount.name,
            discount_amount: discount.amount,
            total,
            status: 'pending',
        });
    } catch (err) {
        await conn.rollback();
        if (err instanceof CheckoutError) {
            return res.status(400).json({ message: err.message });
        }
        throw err;
    } finally {
        conn.release();
    }
}

export async function getMyOrders(req: Request, res: Response) {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, subtotal, discount_amount, total, status, created_at
     FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC`,
        [req.user!.id]
    );
    res.json(rows);
}

export async function getOrderById(req: Request, res: Response) {
    const orderId = Number(req.params.id);

    const [orders] = await pool.query<RowDataPacket[]>(
        `SELECT o.id, o.user_id, o.subtotal, o.discount_amount, o.total, o.status,
            o.shipping_address, o.created_at, d.name AS discount_name
     FROM orders o
     LEFT JOIN discount_rules d ON d.id = o.discount_rule_id
     WHERE o.id = ?`,
        [orderId]
    );

    const order = orders[0];
    const isOwner = order && order.user_id === req.user!.id;
    if (!order || (!isOwner && req.user!.role !== 'admin')) {
        return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    const [items] = await pool.query<RowDataPacket[]>(
        'SELECT product_name, quantity, price FROM order_items WHERE order_id = ?',
        [orderId]
    );

    res.json({ ...order, items });

}

// ====== MANAJEMEN STATUS PESANAN ======

// Error khusus yang membawa kode HTTP (404, 400, dst) agar mudah dibalas ke user
class OrderError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

// Peta alur status: kunci = status sekarang, isi = status berikutnya yang boleh
const allowedTransitions: Record<string, string[]> = {
    pending: ['paid', 'cancelled'],
    paid: ['shipped', 'cancelled'],
    shipped: ['completed'],
    completed: [], // status akhir, tidak bisa diubah lagi
    cancelled: [], // status akhir
};

// Admin tidak boleh memilih 'pending' (itu status awal otomatis)
const statusSchema = z.object({
    status: z.enum(['paid', 'shipped', 'completed', 'cancelled']),
});

// Fungsi inti pengubah status, dipakai oleh admin DAN customer.
// ownerId  : kalau diisi, pesanan harus milik user itu (untuk customer)
// allowedFrom : kalau diisi, status sekarang harus salah satu dari daftar ini
async function changeOrderStatus(
    orderId: number,
    newStatus: string,
    opts: { ownerId?: number; allowedFrom?: string[] } = {}
) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Ambil pesanan dan kunci barisnya (FOR UPDATE) supaya tidak diubah dua orang bersamaan
        const [rows] = await conn.query<RowDataPacket[]>(
            'SELECT status, user_id FROM orders WHERE id = ? FOR UPDATE',
            [orderId]
        );
        const order = rows[0];

        // Pesanan tidak ada, atau bukan milik customer ini -> pura-pura tidak ada (404)
        if (!order || (opts.ownerId !== undefined && order.user_id !== opts.ownerId)) {
            throw new OrderError(404, 'Pesanan tidak ditemukan');
        }
        if (opts.allowedFrom && !opts.allowedFrom.includes(order.status)) {
            throw new OrderError(400, 'Pesanan hanya bisa dibatalkan saat masih berstatus pending');
        }
        // Cek apakah perpindahan status ini sesuai alur
        if (!allowedTransitions[order.status].includes(newStatus)) {
            throw new OrderError(400, `Status tidak bisa diubah dari ${order.status} ke ${newStatus}`);
        }

        // Kalau dibatalkan, kembalikan stok tiap item ke varian aslinya
        if (newStatus === 'cancelled') {
            const [items] = await conn.query<RowDataPacket[]>(
                'SELECT variant_id, quantity FROM order_items WHERE order_id = ?',
                [orderId]
            );
            for (const item of items) {
                await conn.query(
                    'UPDATE product_variants SET stock = stock + ? WHERE id = ?',
                    [item.quantity, item.variant_id]
                );
            }
        }

        await conn.query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, orderId]);
        await conn.commit(); // semua langkah berhasil -> simpan permanen
    } catch (err) {
        await conn.rollback(); // ada yang gagal -> batalkan semuanya
        throw err;
    } finally {
        conn.release(); // kembalikan koneksi ke pool
    }
}

// Admin: ubah status pesanan apa pun
export async function updateOrderStatus(req: Request, res: Response) {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: 'Status harus paid, shipped, completed, atau cancelled' });
    }

    try {
        await changeOrderStatus(Number(req.params.id), parsed.data.status);
        res.json({ message: 'Status pesanan diperbarui', status: parsed.data.status });
    } catch (err) {
        if (err instanceof OrderError) {
            return res.status(err.status).json({ message: err.message });
        }
        throw err;
    }
}

// Customer: batalkan pesanan sendiri, hanya kalau masih pending
export async function cancelMyOrder(req: Request, res: Response) {
    try {
        await changeOrderStatus(Number(req.params.id), 'cancelled', {
            ownerId: req.user!.id,
            allowedFrom: ['pending'],
        });
        res.json({ message: 'Pesanan dibatalkan', status: 'cancelled' });
    } catch (err) {
        if (err instanceof OrderError) {
            return res.status(err.status).json({ message: err.message });
        }
        throw err;
    }
}

// Admin: daftar semua pesanan (bisa difilter ?status=pending, dan ?page=&limit=)
export async function getAllOrders(req: Request, res: Response) {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    // Filter status hanya dipakai kalau nilainya valid
    const status = String(req.query.status || '');
    const useStatus = status in allowedTransitions;
    const whereSql = useStatus ? 'WHERE o.status = ?' : '';
    const params = useStatus ? [status] : [];

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT o.id, o.total, o.status, o.created_at,
            u.name AS customer_name, u.email AS customer_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ${whereSql}
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS total FROM orders o ${whereSql}`,
        params
    );

    res.json({ data: rows, page, limit, total: countRows[0].total });
}