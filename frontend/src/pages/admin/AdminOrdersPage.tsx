import { useCallback, useEffect, useState } from 'react';
import { STATUS_LABEL, formatDate, getOrders, type OrderRow, type OrderStatus } from './services/AdminOrders';
import OrderDetailDialog, { OrderStatusBadge } from './OrderDetailDialog';
import { alertClass, btnSecondary, errorMessage, fieldClass, formatRupiah, rowBtnNormal } from './services/Adminui';

const PAGE_SIZE = 10;
const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [detailId, setDetailId] = useState<number | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const res = await getOrders({ page, limit: PAGE_SIZE, status: status || undefined });
        setOrders(res.data ?? []);
        setTotal(Number(res.total) || 0);
      } catch (err) {
        setError(errorMessage(err, 'Periksa koneksi internet dan pastikan server berjalan.'));
      } finally {
        setLoading(false);
      }
    },
    [page, status],
  );

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Kalau halaman terakhir jadi kosong (misalnya setelah filter berubah), mundur ke halaman terakhir
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
      <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.03em]">Pesanan</h1>
      {!loading && !error && (
        <p className="mt-1.5 text-base text-[#5A6472]">
          {total} pesanan{status ? ` berstatus ${STATUS_LABEL[status as OrderStatus].toLowerCase()}` : ''}.
        </p>
      )}

      {error && (
        <div role="alert" className={`mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${alertClass}`}>
          <p>Tidak dapat memuat pesanan. {error}</p>
          <button
            type="button"
            onClick={() => load()}
            className="h-11 shrink-0 rounded-lg bg-[#B42318] px-4 font-semibold text-white transition-colors hover:bg-[#8F1C13] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#B42318]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EEF0EB]"
          >
            Coba lagi
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* Filter status (diproses server) */}
          <div className="mt-6 sm:w-64">
            <label htmlFor="order-status" className="sr-only">
              Filter status
            </label>
            <select
              id="order-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className={fieldClass}
            >
              <option value="">Semua status</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#D5D9D2] bg-white">
            {loading ? (
              <ul aria-busy="true" aria-label="Memuat pesanan" className="divide-y divide-[#E4E7E0]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-4 motion-safe:animate-pulse">
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-1/3 rounded bg-[#E4E7E0]" />
                      <div className="h-3 w-1/2 rounded bg-[#E4E7E0]" />
                    </div>
                    <div className="h-8 w-16 rounded bg-[#E4E7E0]" />
                  </li>
                ))}
              </ul>
            ) : orders.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-base font-semibold">{status ? 'Tidak ada pesanan dengan status ini' : 'Belum ada pesanan'}</p>
                {status && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('');
                      setPage(1);
                    }}
                    className={`mt-4 ${btnSecondary}`}
                  >
                    Hapus filter
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-[#E4E7E0]">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <p className="text-sm font-bold">#{o.id}</p>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <p className="mt-0.5 truncate text-sm font-semibold">{o.customer_name}</p>
                      <p className="truncate text-sm text-[#5A6472]">
                        {o.customer_email} · {formatDate(o.created_at)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums">{formatRupiah(Number(o.total))}</p>
                      <button
                        type="button"
                        onClick={() => setDetailId(o.id)}
                        aria-label={`Kelola pesanan ${o.id}`}
                        className={`mt-1 border border-[#8A93A0] ${rowBtnNormal}`}
                      >
                        Kelola
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <nav aria-label="Halaman pesanan" className="mt-4 flex items-center justify-between gap-3">
              <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} className={btnSecondary}>
                Sebelumnya
              </button>
              <p className="text-sm text-[#5A6472]">
                Halaman {page} dari {totalPages}
              </p>
              <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} className={btnSecondary}>
                Berikutnya
              </button>
            </nav>
          )}
        </>
      )}

      {detailId !== null && (
        <OrderDetailDialog
          orderId={detailId}
          onClose={() => setDetailId(null)}
          onChanged={() => load(true)} // daftar ikut diperbarui tanpa kedip loading
        />
      )}
    </div>
  );
}