import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import SiteHeader from '../../components/SiteHeader';
import { apiError } from '../../utils/profile';
import { formatRupiah, notifyCartChanged } from '../../utils/shop';

interface CartItem {
  variant_id: number;
  quantity: number;
  storage: string;
  color: string;
  price: number | string;
  stock: number;
  product_id: number;
  product_name: string;
  image_url: string | null;
  line_total: number | string;
}

interface CartData {
  items: CartItem[];
  subtotal: number | string;
  discount_name: string | null;
  discount_amount: number | string;
  total: number | string;
}

function ItemImage({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 p-1">
      {src && !failed ? (
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="max-h-full max-w-full object-contain" />
      ) : (
        <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="3" />
          <line x1="10" y1="18" x2="14" y2="18" />
        </svg>
      )}
    </div>
  );
}

const stepBtn =
  'h-9 w-9 text-base font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:text-slate-300';

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null); // varian yang sedang diproses
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const load = useCallback(async () => {
    try {
      const res = await api.get<CartData>('/cart');
      setCart(res.data);
      setLoadError('');
    } catch (err) {
      setLoadError(apiError(err, 'Tidak dapat memuat keranjang. Periksa koneksi internet, lalu coba lagi.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Jalankan satu aksi (ubah jumlah / hapus), lalu muat ulang keranjang dan perbarui badge di header
  const run = async (variantId: number, action: () => Promise<unknown>) => {
    setBusyId(variantId);
    setError('');
    try {
      await action();
      await load();
      notifyCartChanged();
    } catch (err) {
      setError(apiError(err, 'Tidak dapat memperbarui keranjang. Coba lagi.'));
    } finally {
      setBusyId(null);
    }
  };

  const setQuantity = (item: CartItem, quantity: number) =>
    run(item.variant_id, () => api.put(`/cart/${item.variant_id}`, { quantity }));

  const removeItem = (item: CartItem) => run(item.variant_id, () => api.delete(`/cart/${item.variant_id}`));

  const items = cart?.items ?? [];
  const hasStockIssue = items.some((i) => i.stock < i.quantity);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Keranjang</h1>

        {loading ? (
          <p aria-busy="true" className="mt-6 text-sm text-slate-500">
            Memuat keranjang…
          </p>
        ) : loadError ? (
          <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between">
            <p>{loadError}</p>
            <button type="button" onClick={load} className="h-10 shrink-0 rounded-lg bg-rose-600 px-4 font-semibold text-white hover:bg-rose-700">
              Coba lagi
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-base font-semibold text-slate-900">Keranjang Anda kosong</p>
            <p className="mt-1 text-sm text-slate-500">Pilih handphone favorit Anda di katalog.</p>
            <Link to="/" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
              Lihat katalog
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
            {/* Daftar item */}
            <div>
              {error && (
                <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {items.map((item) => {
                  const busy = busyId === item.variant_id;
                  const over = item.stock < item.quantity;
                  return (
                    <li key={item.variant_id} className={`p-4 ${busy ? 'opacity-60' : ''}`}>
                      <div className="flex gap-3">
                        <ItemImage src={item.image_url} />
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/products/${item.product_id}`}
                            className="line-clamp-2 text-sm font-bold text-slate-900 hover:text-indigo-600"
                          >
                            {item.product_name}
                          </Link>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.storage} · {item.color}
                          </p>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-slate-700">{formatRupiah(item.price)}</p>
                          {over && (
                            <p className="mt-1 text-xs font-semibold text-rose-600">
                              {item.stock > 0 ? `Stok hanya tersisa ${item.stock}. Kurangi jumlahnya.` : 'Stok habis. Hapus dari keranjang.'}
                            </p>
                          )}
                        </div>
                        <p className="hidden shrink-0 text-sm font-black tabular-nums text-slate-900 sm:block">
                          {formatRupiah(item.line_total)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div role="group" aria-label={`Jumlah ${item.product_name}`} className="inline-flex items-center rounded-lg border border-slate-300">
                          <button
                            type="button"
                            onClick={() => setQuantity(item, item.quantity - 1)}
                            disabled={busy || item.quantity <= 1}
                            aria-label="Kurangi jumlah"
                            className={stepBtn}
                          >
                            −
                          </button>
                          <span aria-live="polite" className="w-9 text-center text-sm font-bold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item, item.quantity + 1)}
                            disabled={busy || item.quantity >= item.stock}
                            aria-label="Tambah jumlah"
                            className={stepBtn}
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-black tabular-nums text-slate-900 sm:hidden">{formatRupiah(item.line_total)}</p>

                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          disabled={busy}
                          aria-label={`Hapus ${item.product_name} dari keranjang`}
                          className="h-9 rounded-lg px-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-60"
                        >
                          Hapus
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Ringkasan */}
            <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
              <h2 className="text-sm font-bold text-slate-900">Ringkasan belanja</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd className="font-semibold tabular-nums">{formatRupiah(cart!.subtotal)}</dd>
                </div>
                {Number(cart!.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-700 gap-3">
                    <dt>Diskon{cart!.discount_name ? ` (${cart!.discount_name})` : ''}</dt>
                    <dd className="shrink-0 font-semibold tabular-nums">− {formatRupiah(cart!.discount_amount)}</dd>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                  <dt className="font-bold">Total</dt>
                  <dd className="font-black tabular-nums text-indigo-600">{formatRupiah(cart!.total)}</dd>
                </div>
              </dl>

              {hasStockIssue && (
                <p className="mt-3 text-xs text-rose-600">Ada barang yang stoknya tidak cukup. Perbaiki dulu sebelum checkout.</p>
              )}

              {/* Checkout menyusul di tahap berikutnya */}
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                disabled={hasStockIssue}
                className="mt-4 h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-100 transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Lanjut ke Checkout
              </button>
              <p className="mt-2 text-center text-xs text-slate-400">Checkout segera hadir</p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}