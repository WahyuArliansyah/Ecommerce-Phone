import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

// Interface tipe data produk dari backend atau mock data
export interface ProductItem {
    id: number;
    name: string;
    brand: string;
    image_url?: string | null;
    min_price?: number | null;
    total_stock?: number;
    description?: string;
}

// Data dummy produk handphone sebagai cadangan (fallback) jika database backend masih kosong
const FALLBACK_PHONES: ProductItem[] = [
    {
        id: 1,
        name: 'iPhone 15 Pro Max 256GB',
        brand: 'Apple',
        image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
        min_price: 22499000,
        total_stock: 15,
        description: 'Titanium alami, Chip A17 Pro bertenaga, sistem kamera pro tercanggih.',
    },
    {
        id: 2,
        name: 'Samsung Galaxy S24 Ultra 5G',
        brand: 'Samsung',
        image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&auto=format&fit=crop&q=80',
        min_price: 21999000,
        total_stock: 12,
        description: 'Galaxy AI terintegrasi, Kamera 200MP, bodi titanium, dan S-Pen bawaan.',
    },
    {
        id: 3,
        name: 'Xiaomi 14 5G 12/256GB',
        brand: 'Xiaomi',
        image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
        min_price: 11999000,
        total_stock: 20,
        description: 'Lensa optik Leica generasi baru, Snapdragon 8 Gen 3, layar 1.5K 120Hz.',
    },
    {
        id: 4,
        name: 'Google Pixel 8 Pro 128GB',
        brand: 'Google',
        image_url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&auto=format&fit=crop&q=80',
        min_price: 15499000,
        total_stock: 8,
        description: 'Kamera komputasi AI terbaik, Google Tensor G3, jaminan update 7 tahun.',
    },
    {
        id: 5,
        name: 'Oppo Find N3 Flip 12/256GB',
        brand: 'Oppo',
        image_url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80',
        min_price: 14999000,
        total_stock: 6,
        description: 'Layar lipat fleksibel tanpa celah, Hasselblad Camera, cover screen interaktif.',
    },
    {
        id: 6,
        name: 'Vivo X100 Pro 16/512GB',
        brand: 'Vivo',
        image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
        min_price: 16999000,
        total_stock: 9,
        description: 'ZEISS APO Telephoto Camera, Dimensity 9300 flagship, pengisian cepat 100W.',
    },
];

export default function HomePage() {
    // 1. Hook auth untuk memeriksa status login pengguna
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // 2. State untuk menyimpan data produk, status loading, dan filter brand
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBrand, setSelectedBrand] = useState('Semua');

    // 3. Mengambil data produk dari backend saat pertama kali halaman dimuat
    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true);
                const res = await api.get<{ data: ProductItem[] }>('/products');
                // Jika dari database ada produk, pakai data backend. Jika belum ada, gunakan fallback katalog
                if (res.data?.data && res.data.data.length > 0) {
                    setProducts(res.data.data);
                } else {
                    setProducts(FALLBACK_PHONES);
                }
            } catch (err) {
                console.warn('Gagal memuat produk dari server, memakai data katalog lokal.', err);
                setProducts(FALLBACK_PHONES);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, []);

    // 4. Format mata uang Rupiah
    const formatRupiah = (val?: number | null) => {
        if (!val) return 'Hubungi Toko';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val);
    };

    // 5. ATURAN: Ketika klik lihat detail produk, pengguna langsung diarahkan ke halaman login
    const handleViewDetail = (_productId: number) => {
        navigate('/login');
    };

    // 6. Filter produk hanya berdasarkan brand yang dipilih
    const filteredProducts = products.filter((item) => {
        return selectedBrand === 'Semua' || item.brand?.toLowerCase() === selectedBrand.toLowerCase();
    });

    // Kategori brand handphone
    const brands = ['Semua', 'Apple', 'Samsung', 'Xiaomi', 'Google', 'Oppo', 'Vivo'];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* ===================== NAVBAR ATAS (RESPONSIVE) ===================== */}
            <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-xs backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3.5">
                    {/* Logo & Branding Toko */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 sm:h-10 sm:w-10">
                            {/* Icon Smartphone SVG */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
                                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={3} strokeLinecap="round" />
                            </svg>
                        </div>
                        <div>
                            <span className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                                Arli<span className="text-indigo-600">Phone</span>
                            </span>
                            <span className="hidden text-[10px] font-semibold tracking-wider text-slate-500 uppercase sm:block">
                                Official Phone Store
                            </span>
                        </div>
                    </Link>

                    {/* Area User / Tombol Login */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {user ? (
                            // Kondisi user sudah login
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="text-right">
                                    <p className="max-w-[120px] truncate text-xs font-bold text-slate-900 sm:max-w-none sm:text-sm">
                                        {user.name}
                                    </p>
                                    <span className="hidden rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 capitalize sm:inline-block">
                                        {user.role}
                                    </span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 sm:px-3 sm:py-1.5"
                                    title="Keluar dari akun"
                                >
                                    Keluar
                                </button>
                            </div>
                        ) : (
                            // Tombol Masuk / Login
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 sm:rounded-xl sm:px-5 sm:py-2 sm:text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                <span>Masuk</span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* ===================== HERO BANNER (RESPONSIVE) ===================== */}
            <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white">
                {/* Efek Blur Latar Belakang */}
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none sm:h-96 sm:w-96" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none sm:h-96 sm:w-96" />

                <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14 lg:py-16">
                    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
                        {/* Kolom Kiri: Teks Promosi */}
                        <div className="text-center lg:col-span-7 lg:text-left">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300">
                                🚀 Toko Handphone Terpercaya
                            </span>
                            <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                                Temukan Smartphone Impian dengan Garansi Resmi & Harga Terbaik
                            </h1>
                            <p className="mt-3 text-xs text-slate-300 sm:text-base">
                                Koleksi handphone terlengkap dari Apple, Samsung, Xiaomi, dan lainnya. Nikmati kemudahan bayar di tempat (<b className="text-white">COD</b>) atau <b className="text-white">Transfer Bank BCA</b>.
                            </p>

                            {/* Keunggulan Toko (Responsive 2 kolom mobile, 4 desktop) */}
                            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3.5">
                                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center backdrop-blur-sm sm:p-3 sm:text-left">
                                    <div className="text-lg sm:text-xl">🛡️</div>
                                    <div className="mt-1 text-xs font-bold text-white">100% Original</div>
                                    <div className="text-[10px] text-slate-400 sm:text-[11px]">Garansi Resmi</div>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center backdrop-blur-sm sm:p-3 sm:text-left">
                                    <div className="text-lg sm:text-xl">📦</div>
                                    <div className="mt-1 text-xs font-bold text-white">Packing Kayu</div>
                                    <div className="text-[10px] text-slate-400 sm:text-[11px]">Aman Seluruh RI</div>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center backdrop-blur-sm sm:p-3 sm:text-left">
                                    <div className="text-lg sm:text-xl">💳</div>
                                    <div className="mt-1 text-xs font-bold text-white">COD & Transfer</div>
                                    <div className="text-[10px] text-slate-400 sm:text-[11px]">BCA 1122140037</div>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center backdrop-blur-sm sm:p-3 sm:text-left">
                                    <div className="text-lg sm:text-xl">⚡</div>
                                    <div className="mt-1 text-xs font-bold text-white">Kirim Cepat</div>
                                    <div className="text-[10px] text-slate-400 sm:text-[11px]">Langsung Proses</div>
                                </div>
                            </div>
                        </div>

                        {/* Kolom Kanan: Showcase Smartphone Unggulan */}
                        <div className="flex justify-center lg:col-span-5">
                            <div className="w-full max-w-xs rounded-2xl border border-white/15 bg-gradient-to-b from-white/10 to-white/5 p-4 shadow-xl backdrop-blur-md sm:max-w-sm sm:p-6">
                                <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                                    HOT DEALS
                                </span>
                                <img
                                    src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80"
                                    alt="Flagship Phone"
                                    className="mx-auto my-3 h-40 w-auto object-contain transition-transform duration-300 hover:scale-105 sm:my-4 sm:h-52"
                                />
                                <h2 className="text-base font-bold text-white sm:text-lg">iPhone 15 Pro Max</h2>
                                <p className="text-xs text-slate-300">Titanium Alami - Chipset A17 Pro Terkencang</p>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-base font-black text-amber-400 sm:text-lg">Rp 22.499.000</span>
                                    <button
                                        type="button"
                                        onClick={() => handleViewDetail(1)}
                                        className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-indigo-600 active:scale-95"
                                    >
                                        Lihat Detail →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== FILTER BRAND & DAFTAR PRODUK (RESPONSIVE) ===================== */}
            <main className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-10">
                {/* Header Bagian Katalog & Filter Brand */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                            Katalog Smartphone Terbaru
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                            Pilih ponsel favoritmu. Klik kartu atau tombol untuk melihat detail spesifikasi.
                        </p>
                    </div>

                    {/* Filter Tombol Brand (Scrollable halus di HP) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:gap-2 sm:pb-0">
                        {brands.map((brand) => (
                            <button
                                key={brand}
                                type="button"
                                onClick={() => setSelectedBrand(brand)}
                                className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all sm:px-4 sm:py-1.5 ${
                                    selectedBrand === brand
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {brand}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ===================== DAFTAR PRODUK ===================== */}
                {loading ? (
                    // Loading skeleton responsive
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-3 sm:rounded-2xl sm:p-4">
                                <div className="h-32 rounded-lg bg-slate-200 sm:h-48 sm:rounded-xl" />
                                <div className="mt-3 h-3.5 w-3/4 rounded bg-slate-200 sm:h-4" />
                                <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
                                <div className="mt-4 h-7 rounded-lg bg-slate-200 sm:h-9" />
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    // Tampilan jika produk brand ini kosong
                    <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400 sm:h-14 sm:w-14 sm:text-2xl">
                            📱
                        </div>
                        <h3 className="mt-3 text-sm font-semibold text-slate-900 sm:text-base">Belum ada handphone untuk brand ini</h3>
                        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                            Silakan pilih kategori brand lain di atas.
                        </p>
                        <button
                            type="button"
                            onClick={() => setSelectedBrand('Semua')}
                            className="mt-4 rounded-lg bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
                        >
                            Tampilkan Semua Brand
                        </button>
                    </div>
                ) : (
                    // Grid Produk: 2 kolom di mobile, 3 di tablet, 4 di desktop
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
                        {filteredProducts.map((phone) => (
                            <div
                                key={phone.id}
                                onClick={() => handleViewDetail(phone.id)}
                                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-md sm:rounded-2xl sm:p-4"
                            >
                                {/* Badge Brand & Status Stok */}
                                <div className="flex items-center justify-between gap-1">
                                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 sm:rounded-md sm:px-2 sm:text-[11px]">
                                        {phone.brand}
                                    </span>
                                    <span
                                        className={`text-[10px] font-medium sm:text-[11px] ${
                                            (phone.total_stock ?? 0) > 0 ? 'text-emerald-600' : 'text-rose-500'
                                        }`}
                                    >
                                        {(phone.total_stock ?? 0) > 0 ? `Stok: ${phone.total_stock}` : 'Habis'}
                                    </span>
                                </div>

                                {/* Gambar Handphone */}
                                <div className="my-2.5 flex h-32 items-center justify-center overflow-hidden rounded-lg bg-slate-50 p-1.5 sm:my-3.5 sm:h-44 sm:rounded-xl sm:p-2">
                                    <img
                                        src={
                                            phone.image_url ||
                                            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80'
                                        }
                                        alt={phone.name}
                                        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Info Handphone */}
                                <div className="flex flex-1 flex-col">
                                    <h3 className="line-clamp-2 text-xs font-bold text-slate-900 group-hover:text-indigo-600 sm:text-sm">
                                        {phone.name}
                                    </h3>
                                    {phone.description && (
                                        <p className="mt-1 hidden line-clamp-2 text-xs text-slate-500 sm:block">
                                            {phone.description}
                                        </p>
                                    )}

                                    <div className="mt-auto pt-2.5 sm:pt-4">
                                        <p className="text-[10px] font-medium text-slate-400 sm:text-[11px]">Harga Mulai</p>
                                        <span className="text-xs font-black text-indigo-600 sm:text-base">
                                            {formatRupiah(phone.min_price)}
                                        </span>

                                        {/* Tombol Lihat Detail -> Mengarahkan ke page login */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Mencegah double trigger dari klik kartu
                                                handleViewDetail(phone.id);
                                            }}
                                            className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg bg-slate-900 py-1.5 text-[11px] font-semibold text-white transition-colors group-hover:bg-indigo-600 sm:mt-3 sm:rounded-xl sm:py-2.5 sm:text-xs"
                                        >
                                            <span>Lihat Detail</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* ===================== FOOTER (RESPONSIVE) ===================== */}
            <footer className="mt-14 border-t border-slate-200 bg-white py-8 sm:mt-20 sm:py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
                                    AP
                                </div>
                                <span className="text-base font-bold text-slate-900 sm:text-lg">ArliPhone</span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                Toko smartphone terlengkap & terpercaya. Menyediakan unit handphone resmi Indonesia dengan opsi pembayaran fleksibel.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Metode Pembayaran</h4>
                            <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                                <li className="flex items-center gap-2">
                                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700">COD</span>
                                    Bayar di Tempat saat handphone tiba
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="rounded bg-blue-50 px-1.5 py-0.5 font-bold text-blue-700">BCA</span>
                                    Transfer Bank: <b className="text-slate-800">1122140037 BCA</b>
                                </li>
                            </ul>
                        </div>

                        <div className="sm:col-span-2 lg:col-span-1">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Bantuan & Akun</h4>
                            <p className="mt-2 text-xs text-slate-500">
                                Masuk ke akun Anda untuk melihat rincian spesifikasi handphone, melakukan checkout, dan mengunggah bukti pembayaran.
                            </p>
                            <Link
                                to="/login"
                                className="mt-2.5 inline-block text-xs font-semibold text-indigo-600 hover:underline"
                            >
                                Sudah punya akun? Masuk di sini →
                            </Link>
                        </div>
                    </div>

                    <div className="mt-8 border-t border-slate-100 pt-6 text-center text-[11px] text-slate-400">
                        © {new Date().getFullYear()} ArliPhone Store. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}