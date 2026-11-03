import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import SiteHeader from '../../components/SiteHeader';
import { apiError } from '../../utils/profile';
import { formatRupiah, notifyCartChanged, notifyOrdersChanged } from '../../utils/shop';
import type { PaymentMethod } from '../../utils/orders';

interface CartItem {
    variant_id: number;
    quantity: number;
    storage: string;
    color: string;
    stock: number;
    product_name: string;
    line_total: number | string;
}

interface CartData {
    items: CartItem[];
    subtotal: number | string;
    discount_name: string | null;
    discount_amount: number | string;
    total: number | string;
}

const METHODS: { value: PaymentMethod; title: string; desc: string }[] = [
    { value: 'transfer', title: 'Transfer bank BCA', desc: 'Transfer ke rekening toko, lalu unggah bukti pembayaran.' },
    { value: 'cod', title: 'Bayar di tempat (COD)', desc: 'Bayar tunai saat handphone sampai di tempat Anda.' },
];

export default function CheckoutPage() {
    const navigate = useNavigate();

    const [cart, setCart] = useState<CartData | null>(null);
    const [address, setAddress] = useState('');
    const [method, setMethod] = useState<PaymentMethod | ''>('');

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Ambil keranjang dan alamat profil bersamaan
    useEffect(() => {
        let ignore = false;
        Promise.all([api.get<CartData>('/cart'), api.get<{ address: string | null }>('/auth/me')])
            .then(([c, me]) => {
                if (ignore) return;
                setCart(c.data);
                setAddress(me.data.address ?? '');
                setLoading(false);
            })
            .catch((err) => {
                if (ignore) return;
                setLoadError(apiError(err, 'Tidak dapat memuat data checkout. Periksa koneksi internet, lalu coba lagi.'));
                setLoading(false);
            });
        return () => {
            ignore = true;
        };
    }, []);

    const items = cart?.items ?? [];
    const stockIssue = items.some((i) => i.stock < i.quantity);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        const addr = address.trim();
        if (addr.length < 10) {
            setError('Alamat pengiriman minimal 10 karakter.');
            return;
        }
        if (!method) {
            setError('Pilih metode pembayaran.');
            return;
        }
        setSaving(true);
        try {
            const res = await api.post<{ id: number }>('/orders', { payment_method: method, shipping_address: addr });
            notifyCartChanged(); // keranjang sudah dikosongkan server, badge ikut dikosongkan
            notifyOrdersChanged(); // pesanan baru: titik "menunggu pembayaran" langsung muncul
            // replace: tombol "kembali" tidak membawa ke checkout dengan keranjang kosong
            navigate(`/orders/${res.data.id}`, { replace: true, state: { created: true } });
        } catch (err) {
            setError(apiError(err, 'Tidak dapat membuat pesanan. Periksa koneksi internet, lalu coba lagi.'));
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            <SiteHeader />

            <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
                <Link
                    to="/cart"
                    className="-ml-2 inline-flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Kembali ke keranjang
                </Link>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Checkout</h1>

                {loading ? (
                    <p aria-busy="true" className="mt-6 text-sm text-slate-500">
                        Memuat…
                    </p>
                ) : loadError ? (
                    <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                        {loadError}
                    </div>
                ) : items.length === 0 ? (
                    <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                        <p className="text-base font-semibold text-slate-900">Keranjang Anda kosong</p>
                        <Link to="/" className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                            Lihat katalog
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
                        <div className="space-y-5">
                            {/* Alamat */}
                            <section className="rounded-2xl border border-slate-200 bg-white p-5">
                                <h2 className="text-sm font-bold text-slate-900">Alamat pengiriman</h2>
                                <label htmlFor="co-address" className="sr-only">
                                    Alamat pengiriman
                                </label>
                                <textarea
                                    id="co-address"
                                    required
                                    rows={4}
                                    minLength={10}
                                    maxLength={255}
                                    autoComplete="street-address"
                                    placeholder="Jalan, nomor rumah, kelurahan, kecamatan, kota, kode pos"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="mt-3 min-h-28 w-full resize-y rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                />
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Diisi dari profil Anda. Perubahan di sini hanya berlaku untuk pesanan ini.{' '}
                                    <Link to="/profile" className="font-semibold text-indigo-600 hover:underline">
                                        Ubah alamat di profil
                                    </Link>
                                </p>
                            </section>

                            {/* Metode pembayaran */}
                            <fieldset className="rounded-2xl border border-slate-200 bg-white p-5">
                                <legend className="px-1 text-sm font-bold text-slate-900">Metode pembayaran</legend>
                                <div className="mt-2 space-y-3">
                                    {METHODS.map((m) => (
                                        <label key={m.value} className="block cursor-pointer">
                                            <input
                                                type="radio"
                                                name="payment_method"
                                                value={m.value}
                                                required
                                                checked={method === m.value}
                                                onChange={() => setMethod(m.value)}
                                                className="peer sr-only"
                                            />
                                            <span className="block rounded-xl border border-slate-300 p-4 transition-colors hover:border-slate-400 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500">
                                                <span className="block text-sm font-bold text-slate-900">{m.title}</span>
                                                <span className="mt-0.5 block text-xs text-slate-500">{m.desc}</span>
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        </div>

                        {/* Ringkasan */}
                        <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
                            <h2 className="text-sm font-bold text-slate-900">Ringkasan pesanan</h2>
                            <ul className="mt-3 space-y-2 border-b border-slate-200 pb-3">
                                {items.map((i) => (
                                    <li key={i.variant_id} className="flex justify-between gap-3 text-sm">
                                        <span className="min-w-0 text-slate-600">
                                            {i.product_name} <span className="text-slate-400">({i.storage}, {i.color})</span> × {i.quantity}
                                        </span>
                                        <span className="shrink-0 font-semibold tabular-nums">{formatRupiah(i.line_total)}</span>
                                    </li>
                                ))}
                            </ul>
                            <dl className="mt-3 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <dt className="text-slate-500">Subtotal</dt>
                                    <dd className="font-semibold tabular-nums">{formatRupiah(cart!.subtotal)}</dd>
                                </div>
                                {Number(cart!.discount_amount) > 0 && (
                                    <div className="flex justify-between text-emerald-700 gap-3">
                                        <dt>Diskon{cart!.discount_name ? ` (${cart!.discount_name})` : ''}</dt>
                                        <dd className="font-semibold tabular-nums shrink-0">− {formatRupiah(cart!.discount_amount)}</dd>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
                                    <dt className="font-bold">Total</dt>
                                    <dd className="font-black tabular-nums text-indigo-600">{formatRupiah(cart!.total)}</dd>
                                </div>
                            </dl>

                            {stockIssue && (
                                <p role="alert" className="mt-3 text-xs text-rose-600">
                                    Ada barang yang stoknya tidak cukup.{' '}
                                    <Link to="/cart" className="font-semibold underline">
                                        Perbaiki di keranjang
                                    </Link>
                                </p>
                            )}
                            {error && (
                                <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={saving || stockIssue}
                                className="mt-4 h-12 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-100 transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? 'Memproses…' : 'Buat Pesanan'}
                            </button>
                        </aside>
                    </form>
                )}
            </main>
        </div>
    );
}