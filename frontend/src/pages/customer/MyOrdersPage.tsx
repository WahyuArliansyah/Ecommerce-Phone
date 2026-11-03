import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import SiteHeader from '../../components/SiteHeader';
import OrderStatusPill from '../../components/OrderStatusPill';
import { apiError } from '../../utils/profile';
import { formatRupiah } from '../../utils/shop';
import { PAYMENT_LABEL, formatDate, type OrderStatus, type PaymentMethod } from '../../utils/orders';

interface OrderRow {
  id: number;
  total: number | string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_proof: string | null;
  created_at: string;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    api
      .get<OrderRow[]>('/orders')
      .then((res) => {
        if (!ignore) setOrders(res.data);
      })
      .catch((err) => {
        if (!ignore) setError(apiError(err, 'Tidak dapat memuat pesanan. Periksa koneksi internet, lalu coba lagi.'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Pesanan Saya</h1>

        {loading ? (
          <p aria-busy="true" className="mt-6 text-sm text-slate-500">
            Memuat pesanan…
          </p>
        ) : error ? (
          <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-base font-semibold text-slate-900">Belum ada pesanan</p>
            <Link to="/" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              Mulai belanja
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {orders.map((o) => {
              const needsProof = o.status === 'pending' && o.payment_method === 'transfer' && !o.payment_proof;
              return (
                <li key={o.id}>
                  <Link
                    to={`/orders/${o.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">Pesanan #{o.id}</p>
                        <p className="text-xs text-slate-500">{formatDate(o.created_at)}</p>
                      </div>
                      <OrderStatusPill status={o.status} />
                    </div>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <p className="text-xs text-slate-500">{PAYMENT_LABEL[o.payment_method]}</p>
                      <p className="text-base font-black tabular-nums text-indigo-600">{formatRupiah(o.total)}</p>
                    </div>
                    {needsProof && <p className="mt-2 text-xs font-semibold text-amber-700">Belum ada bukti pembayaran. Unggah sekarang.</p>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}