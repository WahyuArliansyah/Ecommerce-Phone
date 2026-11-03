import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import SiteHeader from '../../components/SiteHeader';
import OrderStatusPill from '../../components/OrderStatusPill';
import { apiError } from '../../utils/profile';
import { formatRupiah, notifyOrdersChanged } from '../../utils/shop';
import { PAYMENT_LABEL, formatDate, proofUrl, type OrderStatus, type PaymentMethod } from '../../utils/orders';

interface OrderDetail {
    id: number;
    status: OrderStatus;
    payment_method: PaymentMethod;
    payment_proof: string | null;
    bank_account?: string;
    shipping_address: string | null;
    subtotal: number | string;
    discount_amount: number | string;
    discount_name: string | null;
    total: number | string;
    created_at: string;
    items: { product_name: string; quantity: number; price: number | string }[];
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PROOF_BYTES = 5 * 1024 * 1024; // samakan dengan batas uploadPaymentProof di backend

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const justCreated = (location.state as { created?: boolean } | null)?.created === true;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const [uploading, setUploading] = useState(false);
    const [proofError, setProofError] = useState('');
    const [notice, setNotice] = useState('');

    const [confirmCancel, setConfirmCancel] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await api.get<OrderDetail>(`/orders/${id}`);
            setOrder(res.data);
            setLoadError('');
        } catch (err) {
            setLoadError(apiError(err, 'Tidak dapat memuat pesanan. Periksa koneksi internet, lalu coba lagi.'));
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    const handleProof = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!IMAGE_TYPES.includes(file.type)) {
            setProofError('Format bukti harus JPG, PNG, atau WEBP.');
            return;
        }
        if (file.size > MAX_PROOF_BYTES) {
            setProofError('Ukuran bukti maksimal 5 MB.');
            return;
        }
        setProofError('');
        setNotice('');
        setUploading(true);
        try {
            const form = new FormData();
            form.append('payment_proof', file); // nama field harus sama dengan di backend
            await api.post(`/orders/${id}/proof`, form);
            await load();
            notifyOrdersChanged();
            setNotice('Bukti pembayaran terkirim. Admin akan memeriksanya.');
        } catch (err) {
            setProofError(apiError(err, 'Tidak dapat mengunggah bukti. Periksa koneksi internet, lalu coba lagi.'));
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        setCancelError('');
        try {
            await api.put(`/orders/${id}/cancel`);
            setConfirmCancel(false);
            await load();
            notifyOrdersChanged();
        } catch (err) {
            setCancelError(apiError(err, 'Tidak dapat membatalkan pesanan. Coba lagi.'));
        } finally {
            setCancelling(false);
        }
    };

    const pending = order?.status === 'pending';
    const isTransfer = order?.payment_method === 'transfer';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <SiteHeader />

            <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
                <Link
                    to="/orders"
                    className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Semua pesanan
                </Link>

                {loading ? (
                    <p aria-busy="true" className="mt-4 text-sm text-slate-500">
                        Memuat pesanan…
                    </p>
                ) : loadError || !order ? (
                    <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                        {loadError || 'Pesanan tidak ditemukan.'}
                    </div>
                ) : (
                    <div className="mt-2 space-y-5">
                        {justCreated && (
                            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                                Pesanan berhasil dibuat.
                            </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Pesanan #{order.id}</h1>
                                <p className="mt-0.5 text-sm text-slate-500">{formatDate(order.created_at)}</p>
                            </div>
                            <OrderStatusPill status={order.status} />
                        </div>

                        <div role="status" aria-live="polite">
                            {notice && (
                                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                                    {notice}
                                </p>
                            )}
                        </div>

                        {/* Pembayaran */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h2 className="text-sm font-bold text-slate-900">Pembayaran</h2>
                            <p className="mt-1 text-sm text-slate-600">{PAYMENT_LABEL[order.payment_method]}</p>

                            {order.payment_method === 'cod' && pending && (
                                <p className="mt-3 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
                                    Siapkan uang tunai sebesar <b>{formatRupiah(order.total)}</b> saat handphone tiba.
                                </p>
                            )}

                            {isTransfer && pending && (
                                <div className="mt-3 space-y-4">
                                    <div className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                                        <p>Transfer sebesar</p>
                                        <p className="text-xl font-black tabular-nums">{formatRupiah(order.total)}</p>
                                        <p className="mt-2">ke rekening</p>
                                        <p className="text-lg font-black tracking-wide">{order.bank_account}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {order.payment_proof ? 'Bukti pembayaran Anda' : 'Unggah bukti pembayaran'}
                                        </p>
                                        {order.payment_proof && (
                                            <a
                                                href={proofUrl(order.payment_proof)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                            >
                                                <img
                                                    src={proofUrl(order.payment_proof)}
                                                    alt="Bukti pembayaran (klik untuk memperbesar)"
                                                    className="max-h-56 rounded-lg border border-slate-200 bg-slate-50 object-contain"
                                                />
                                            </a>
                                        )}
                                        <div className="mt-2">
                                            <label
                                                htmlFor="proof-input"
                                                className={`inline-flex h-10 cursor-pointer items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-within:ring-2 focus-within:ring-indigo-500 ${uploading ? 'pointer-events-none opacity-60' : ''}`}
                                            >
                                                {uploading ? 'Mengunggah…' : order.payment_proof ? 'Ganti bukti' : 'Pilih file bukti'}
                                            </label>
                                            <input
                                                id="proof-input"
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                onChange={handleProof}
                                                disabled={uploading}
                                                className="sr-only"
                                            />
                                            <p className="mt-1.5 text-xs text-slate-500">JPG, PNG, atau WEBP, maksimal 5 MB.</p>
                                            {proofError && (
                                                <p role="alert" className="mt-1.5 text-xs font-semibold text-rose-600">
                                                    {proofError}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isTransfer && !pending && order.payment_proof && (
                                <a href={proofUrl(order.payment_proof)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline">
                                    Lihat bukti pembayaran
                                </a>
                            )}
                        </section>

                        {/* Barang */}
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                            <h2 className="px-5 pt-5 text-sm font-bold text-slate-900">Barang</h2>
                            <ul className="mt-3 divide-y divide-slate-100 px-5">
                                {order.items.map((it, i) => (
                                    <li key={i} className="flex justify-between gap-3 py-3 text-sm">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-900">{it.product_name}</p>
                                            <p className="text-slate-500">
                                                {it.quantity} × {formatRupiah(it.price)}
                                            </p>
                                        </div>
                                        <p className="shrink-0 font-bold tabular-nums">{formatRupiah(Number(it.price) * it.quantity)}</p>
                                    </li>
                                ))}
                            </ul>
                            <dl className="mt-1 space-y-1 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Subtotal</dt>
                                    <dd className="tabular-nums">{formatRupiah(order.subtotal)}</dd>
                                </div>
                                {Number(order.discount_amount) > 0 && (
                                    <div className="flex justify-between text-emerald-700">
                                        <dt>Diskon{order.discount_name ? ` (${order.discount_name})` : ''}</dt>
                                        <dd className="tabular-nums">− {formatRupiah(order.discount_amount)}</dd>
                                    </div>
                                )}
                                <div className="flex justify-between text-base">
                                    <dt className="font-bold">Total</dt>
                                    <dd className="font-black tabular-nums text-indigo-600">{formatRupiah(order.total)}</dd>
                                </div>
                            </dl>
                        </section>

                        {/* Alamat */}
                        <section className="rounded-2xl border border-slate-200 bg-white p-5">
                            <h2 className="text-sm font-bold text-slate-900">Alamat pengiriman</h2>
                            <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{order.shipping_address || '-'}</p>
                        </section>

                        {/* Batalkan (hanya saat masih menunggu pembayaran) */}
                        {pending && (
                            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                                {confirmCancel ? (
                                    <div>
                                        <p className="text-sm text-slate-700">Batalkan pesanan ini? Tindakan ini tidak bisa dibatalkan.</p>
                                        {cancelError && (
                                            <p role="alert" className="mt-2 text-sm text-rose-600">
                                                {cancelError}
                                            </p>
                                        )}
                                        <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row">
                                            <button
                                                type="button"
                                                onClick={() => setConfirmCancel(false)}
                                                disabled={cancelling}
                                                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                            >
                                                Tidak
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                disabled={cancelling}
                                                className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                            >
                                                {cancelling ? 'Membatalkan…' : 'Ya, batalkan pesanan'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmCancel(true)}
                                        className="h-10 rounded-lg border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                                    >
                                        Batalkan pesanan
                                    </button>
                                )}
                            </section>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}