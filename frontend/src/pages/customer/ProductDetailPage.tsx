import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import SiteHeader from '../../components/SiteHeader';
import { apiError } from '../../utils/profile';
import { formatRupiah, notifyCartChanged } from '../../utils/shop';

interface Variant {
  id: number;
  storage: string;
  color: string;
  price: number | string;
  stock: number;
}

interface ProductDetail {
  id: number;
  name: string;
  brand: string;
  description: string | null;
  image_url: string | null;
  variants: Variant[];
}

const chipBase =
  'rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed';
const chipOn = 'border-indigo-600 bg-indigo-50 text-indigo-700';
const chipOff = 'border-slate-300 bg-white text-slate-700 hover:border-slate-400';
const chipDisabled = 'border-slate-200 bg-slate-100 text-slate-400 line-through';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [storage, setStorage] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);

  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    let ignore = false;
    api
      .get<ProductDetail>(`/products/${id}`)
      .then((res) => {
        if (ignore) return;
        const p = res.data;
        setProduct(p);
        // Pilih varian pertama yang stoknya ada (daftar sudah diurutkan dari harga termurah)
        const first = p.variants.find((v) => v.stock > 0) ?? p.variants[0];
        if (first) {
          setStorage(first.storage);
          setColor(first.color);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(apiError(err, 'Tidak dapat memuat produk. Periksa koneksi internet, lalu coba lagi.'));
        setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  const variants = product?.variants ?? [];
  const storages = [...new Set(variants.map((v) => v.storage))];
  const colorOptions = variants.filter((v) => v.storage === storage);
  const selected = variants.find((v) => v.storage === storage && v.color === color) ?? null;
  const soldOut = !selected || selected.stock <= 0;

  const resetFeedback = () => {
    setError('');
    setAdded(false);
    setQty(1);
  };

  const chooseStorage = (s: string) => {
    setStorage(s);
    // Pertahankan warna jika tersedia di storage baru, kalau tidak pilih warna lain yang ada stoknya
    const options = variants.filter((v) => v.storage === s);
    const next = options.find((v) => v.color === color) ?? options.find((v) => v.stock > 0) ?? options[0];
    setColor(next.color);
    resetFeedback();
  };

  const chooseColor = (c: string) => {
    setColor(c);
    resetFeedback();
  };

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    setError('');
    setAdded(false);
    try {
      await api.post('/cart', { variant_id: selected.id, quantity: qty });
      notifyCartChanged(); // badge keranjang di header ikut berubah
      setAdded(true);
    } catch (err) {
      setError(apiError(err, 'Tidak dapat menambahkan ke keranjang. Periksa koneksi internet, lalu coba lagi.'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          to="/"
          className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Kembali ke katalog
        </Link>

        {loading ? (
          <div aria-busy="true" className="mt-4 grid gap-8 md:grid-cols-2 motion-safe:animate-pulse">
            <div className="h-72 rounded-2xl bg-slate-200 sm:h-96" />
            <div className="space-y-4">
              <div className="h-4 w-20 rounded bg-slate-200" />
              <div className="h-7 w-3/4 rounded bg-slate-200" />
              <div className="h-6 w-1/3 rounded bg-slate-200" />
              <div className="h-24 rounded bg-slate-200" />
            </div>
          </div>
        ) : loadError || !product ? (
          <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {loadError || 'Produk tidak ditemukan.'}
            <Link to="/" className="ml-2 font-semibold underline">
              Kembali ke katalog
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-2 md:gap-10">
            {/* Gambar */}
            <div className="flex h-72 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 sm:h-96">
              {product.image_url && !imgFailed ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  onError={() => setImgFailed(true)}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <svg aria-hidden="true" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="3" />
                  <line x1="10" y1="18" x2="14" y2="18" />
                </svg>
              )}
            </div>

            {/* Info & pilihan */}
            <div>
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600">{product.brand}</span>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{product.name}</h1>

              {variants.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Produk ini belum memiliki varian yang dijual.</p>
              ) : (
                <>
                  <p className="mt-3 text-2xl font-black text-indigo-600">{formatRupiah(selected?.price)}</p>
                  <p className={`mt-1 text-sm font-semibold ${soldOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {soldOut ? 'Stok habis' : `Stok tersedia: ${selected!.stock} unit`}
                  </p>

                  {/* Storage */}
                  <fieldset className="mt-5">
                    <legend className="text-sm font-bold text-slate-900">Storage</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {storages.map((s) => (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={s === storage}
                          onClick={() => chooseStorage(s)}
                          className={`${chipBase} ${s === storage ? chipOn : chipOff}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Warna (hanya yang tersedia untuk storage terpilih) */}
                  <fieldset className="mt-5">
                    <legend className="text-sm font-bold text-slate-900">Warna</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {colorOptions.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          aria-pressed={v.color === color}
                          disabled={v.stock <= 0}
                          onClick={() => chooseColor(v.color)}
                          className={`${chipBase} ${v.stock <= 0 ? chipDisabled : v.color === color ? chipOn : chipOff}`}
                        >
                          {v.color}
                          {v.stock <= 0 && <span className="ml-1 text-xs no-underline">(habis)</span>}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  {/* Jumlah */}
                  <div className="mt-5">
                    <p id="qty-label" className="text-sm font-bold text-slate-900">
                      Jumlah
                    </p>
                    <div role="group" aria-labelledby="qty-label" className="mt-2 inline-flex items-center rounded-lg border border-slate-300 bg-white">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        disabled={soldOut || qty <= 1}
                        aria-label="Kurangi jumlah"
                        className="h-11 w-11 text-lg font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        −
                      </button>
                      <span aria-live="polite" className="w-10 text-center text-sm font-bold tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.min(selected?.stock ?? 1, q + 1))}
                        disabled={soldOut || qty >= (selected?.stock ?? 1)}
                        aria-label="Tambah jumlah"
                        className="h-11 w-11 text-lg font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {error}
                    </p>
                  )}
                  <div role="status" aria-live="polite">
                    {added && (
                      <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                        Ditambahkan ke keranjang.{' '}
                        <Link to="/cart" className="underline">
                          Lihat keranjang →
                        </Link>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={soldOut || adding}
                    className="mt-5 h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-100 transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {adding ? 'Menambahkan…' : soldOut ? 'Stok habis' : 'Tambah ke Keranjang'}
                  </button>
                </>
              )}

              {product.description && (
                <div className="mt-8 border-t border-slate-200 pt-5">
                  <h2 className="text-sm font-bold text-slate-900">Deskripsi</h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{product.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}