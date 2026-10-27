import { useEffect, useState } from 'react';
import {
  NEXT_STATUS,
  STATUS_LABEL,
  formatAddress,
  formatDate,
  getOrderDetail,
  proofUrl,
  updateOrderStatus,
  type OrderDetail,
  type OrderStatus,
} from './services/AdminOrders';
import {
  alertClass,
  btnPrimary,
  btnSecondary,
  dialogClass,
  errorMessage,
  formatRupiah,
  useShowModal,
} from './services/Adminui';

const STATUS_STYLE: Record<OrderStatus, { text: string; dot: string }> = {
  pending: { text: 'text-[#946200]', dot: 'bg-[#C98A00]' },
  paid: { text: 'text-[#0A6C9E]', dot: 'bg-[#0A6C9E]' },
  shipped: { text: 'text-[#5B3FB5]', dot: 'bg-[#5B3FB5]' },
  completed: { text: 'text-[#1B7F4B]', dot: 'bg-[#1B7F4B]' },
  cancelled: { text: 'text-[#B42318]', dot: 'bg-[#B42318]' },
};

// Status selalu berupa teks + titik, tidak hanya warna
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${s.text}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${s.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  paid: 'Tandai sudah dibayar',
  shipped: 'Tandai dikirim',
  completed: 'Tandai selesai',
};

interface Props {
  orderId: number;
  onClose: () => void;
  onChanged: () => void; // dipanggil setelah status berubah, supaya daftar dimuat ulang
}

export default function OrderDetailDialog({ orderId, onClose, onChanged }: Props) {
  const dialogRef = useShowModal();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    let ignore = false;
    getOrderDetail(orderId)
      .then((d) => !ignore && setOrder(d))
      .catch((err) => !ignore && setLoadError(errorMessage(err, 'Tidak dapat memuat pesanan.')));
    return () => {
      ignore = true;
    };
  }, [orderId]);

  const change = async (status: OrderStatus) => {
    setBusy(true);
    setError('');
    try {
      await updateOrderStatus(orderId, status);
      setOrder((o) => (o ? { ...o, status } : o));
      setConfirmCancel(false);
      onChanged();
    } catch (err) {
      setError(errorMessage(err, 'Tidak dapat mengubah status. Periksa koneksi internet, lalu coba lagi.'));
    } finally {
      setBusy(false);
    }
  };

  const next = order ? NEXT_STATUS[order.status] : [];
  const forward = next.filter((s) => s !== 'cancelled');
  const canCancel = next.includes('cancelled');

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(e) => {
        if (busy) e.preventDefault();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      aria-labelledby="order-dialog-title"
      className={`${dialogClass} max-w-[640px]`}
    >
      <div className="p-6">
        <h2 id="order-dialog-title" className="text-xl font-extrabold tracking-[-0.02em]">
          Pesanan #{orderId}
        </h2>

        {!order && !loadError && <p className="mt-4 text-base text-[#5A6472]">Memuat pesanan…</p>}
        {loadError && (
          <div role="alert" className={`mt-4 ${alertClass}`}>
            {loadError}
          </div>
        )}

        {order && (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <OrderStatusBadge status={order.status} />
              <span className="text-sm text-[#5A6472]">{formatDate(order.created_at)}</span>
            </div>

            {error && (
              <div role="alert" className={`mt-4 ${alertClass}`}>
                {error}
              </div>
            )}

            {/* Item */}
            <div className="mt-5 overflow-hidden rounded-lg border border-[#D5D9D2]">
              <ul className="divide-y divide-[#E4E7E0]">
                {order.items.map((it, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{it.product_name}</p>
                      <p className="text-sm text-[#5A6472]">
                        {it.quantity} × {formatRupiah(Number(it.price))}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums">
                      {formatRupiah(Number(it.price) * it.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
              <dl className="space-y-1 border-t border-[#D5D9D2] bg-[#EEF0EB] px-4 py-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#5A6472]">Subtotal</dt>
                  <dd className="tabular-nums">{formatRupiah(Number(order.subtotal))}</dd>
                </div>
                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[#5A6472]">Diskon{order.discount_name ? ` (${order.discount_name})` : ''}</dt>
                    <dd className="tabular-nums">− {formatRupiah(Number(order.discount_amount))}</dd>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatRupiah(Number(order.total))}</dd>
                </div>
              </dl>
            </div>

            {/* Alamat */}
            <div className="mt-5">
              <p className="text-sm font-semibold">Alamat pengiriman</p>
              <p className="mt-1 text-sm text-[#5A6472]">{formatAddress(order.shipping_address)}</p>
            </div>

            {/* Pembayaran */}
            <div className="mt-5">
              <p className="text-sm font-semibold">
                Pembayaran: {order.payment_method === 'cod' ? 'Bayar di tempat (COD)' : 'Transfer bank'}
              </p>
              {order.payment_method === 'transfer' &&
                (order.payment_proof ? (
                  <a
                    href={proofUrl(order.payment_proof)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block rounded-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50"
                  >
                    <img
                      src={proofUrl(order.payment_proof)}
                      alt="Bukti pembayaran (klik untuk memperbesar)"
                      className="max-h-56 rounded-lg border border-[#D5D9D2] bg-[#EEF0EB] object-contain"
                    />
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-[#946200]">Customer belum mengunggah bukti pembayaran.</p>
                ))}
            </div>

            {/* Ubah status */}
            {next.length > 0 && (
              <div className="mt-6 border-t border-[#D5D9D2] pt-5">
                <p className="text-sm font-semibold">Ubah status</p>

                {confirmCancel ? (
                  <div className="mt-3 rounded-lg border border-[#B42318]/30 bg-[#B42318]/10 p-4">
                    <p className="text-sm text-[#B42318]">
                      Batalkan pesanan ini? Stok barang akan dikembalikan dan pesanan tidak bisa diaktifkan lagi.
                    </p>
                    <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row">
                      <button type="button" onClick={() => setConfirmCancel(false)} disabled={busy} className={btnSecondary}>
                        Tidak
                      </button>
                      <button
                        type="button"
                        onClick={() => change('cancelled')}
                        disabled={busy}
                        className="h-11 cursor-pointer rounded-lg bg-[#B42318] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#8F1C13] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#B42318]/50 disabled:opacity-60"
                      >
                        {busy ? 'Memproses…' : 'Ya, batalkan pesanan'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    {forward.map((s) => (
                      <button key={s} type="button" onClick={() => change(s)} disabled={busy} className={btnPrimary + ' cursor-pointer'}>
                        {busy ? 'Memproses…' : ACTION_LABEL[s]}
                      </button>
                    ))}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(true)}
                        disabled={busy}
                        className="h-11 cursor-pointer rounded-lg border border-[#B42318]/40 px-4 text-sm font-semibold text-[#B42318] transition-colors hover:bg-[#B42318]/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#B42318]/40 disabled:opacity-60"
                      >
                        Batalkan pesanan
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="mt-6 flex sm:justify-end">
          <button type="button" onClick={onClose} disabled={busy} className={btnSecondary + ' w-full sm:w-auto'}>
            Tutup
          </button>
        </div>
      </div>
    </dialog>
  );
}