import { api } from '../../../services/api';

/* ⚠ Sesuaikan 3 alamat ini dengan order.routes.ts Anda */
const LIST_PATH = '/orders/admin/all';
const detailPath = (id: number) => `/orders/${id}`;
const statusPath = (id: number) => `/orders/${id}/status`;

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';

export interface OrderRow {
    id: number;
    total: number | string;
    status: OrderStatus;
    created_at: string;
    customer_name: string;
    customer_email: string;
}

export interface OrderDetail {
    id: number;
    subtotal: number | string;
    discount_amount: number | string;
    discount_name: string | null;
    total: number | string;
    status: OrderStatus;
    shipping_address: unknown;
    payment_method: 'cod' | 'transfer';
    payment_proof: string | null;
    created_at: string;
    items: { product_name: string; quantity: number; price: number | string }[];
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: 'Menunggu pembayaran',
    paid: 'Dibayar',
    shipped: 'Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
};

// Sama dengan allowedTransitions di backend
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
    pending: ['paid', 'cancelled'],
    paid: ['shipped', 'cancelled'],
    shipped: ['completed'],
    completed: [],
    cancelled: [],
};

export async function getOrders(params: { page: number; limit: number; status?: string }) {
    const res = await api.get<{ data: OrderRow[]; total: number }>(LIST_PATH, { params });
    return res.data;
}

export async function getOrderDetail(id: number) {
    const res = await api.get<OrderDetail>(detailPath(id));
    return res.data;
}

export async function updateOrderStatus(id: number, status: OrderStatus) {
    await api.put(statusPath(id), { status });
}

// Bukti pembayaran disajikan backend di /uploads/payment_proofs/<nama-file> (di luar prefix /api)
export function proofUrl(filename: string) {
    const origin = (api.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
    return `${origin}/uploads/payment_proofs/${filename}`;
}

// Alamat bisa berupa teks atau objek; tampilkan sebagai satu baris
export function formatAddress(a: unknown): string {
    if (!a) return '-';
    if (typeof a === 'string') {
        try {
            return formatAddress(JSON.parse(a));
        } catch {
            return a;
        }
    }
    if (typeof a !== 'object') return String(a);
    return Object.values(a as Record<string, unknown>).filter(Boolean).join(', ') || '-';
}

export const formatDate = (s: string) =>
    new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });