import { api } from '../services/api';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
export type PaymentMethod = 'cod' | 'transfer';

export const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: 'Menunggu pembayaran',
    paid: 'Dibayar',
    shipped: 'Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
    cod: 'Bayar di tempat (COD)',
    transfer: 'Transfer bank BCA',
};

// Bukti pembayaran disajikan backend di /uploads/payment_proofs/<nama-file> (di luar prefix /api)
export function proofUrl(filename: string): string {
    const origin = (api.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
    return `${origin}/uploads/payment_proofs/${filename}`;
}

export const formatDate = (s: string) =>
    new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

// Pesanan yang masih menunggu tindakan customer: transfer, status pending, belum ada bukti
export const needsPayment = (o: {
    status: OrderStatus;
    payment_method: PaymentMethod;
    payment_proof: string | null;
}) => o.status === 'pending' && o.payment_method === 'transfer' && !o.payment_proof;