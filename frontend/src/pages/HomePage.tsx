import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import SiteHeader from '../components/SiteHeader';

/*
  Token desain (sama dengan LoginPage.tsx, ditulis sebagai arbitrary value Tailwind):
  Tinta      #131820  hero, blok bawah, teks utama
  Stone      #EEF0EB  latar katalog
  Abu        #5A6472  teks pendukung
  Teal       #0A7C86  tombol utama, focus ring
  Teal tua   #086872  hover tombol, teks tautan di atas Stone
  Teal muda  #3FB6C1  aksen di atas Tinta (angka langkah, tautan footer)
  Garis      #8A93A0  border / pemisah (dipakai dengan opacity)
  Galat      #B42318  status stok habis
  Font       Plus Jakarta Sans (pastikan sudah dimuat, seperti di LoginPage)
*/

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

const BANK_ACCOUNT = '1122140037';
const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80';

// Dipakai di hero kalau backend belum punya produk
const SPOTLIGHT_FALLBACK: ProductItem = {
    id: 1,
    name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
    min_price: 22499000,
    description: 'Rangka titanium alami dengan chipset A17 Pro.',
};

const iconProps = {
    'aria-hidden': true,
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
} as const;

const TRUST_POINTS = [
    {
        title: '100% original',
        text: 'Garansi resmi',
        icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    },
    {
        title: 'Packing kayu',
        text: 'Aman ke seluruh RI',
        icon: (
            <>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
            </>
        ),
    },
    {
        title: 'COD & transfer',
        text: `BCA ${BANK_ACCOUNT}`,
        icon: (
            <>
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
            </>
        ),
    },
    {
        title: 'Kirim cepat',
        text: 'Langsung diproses',
        icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
    },
];

const STEPS = [
    {
        title: 'Pilih ponsel',
        text: 'Telusuri katalog berdasarkan merek, lalu buka detail untuk melihat spesifikasi dan harga.',
    },
    {
        title: 'Masuk dan checkout',
        text: 'Masuk ke akun Anda, lalu lanjutkan checkout dengan alamat pengiriman.',
    },
    {
        title: 'Bayar sesuai pilihan',
        text: `Bayar di tempat saat ponsel tiba (COD), atau transfer ke BCA ${BANK_ACCOUNT} dan unggah bukti pembayaran.`,
    },
];

const ArrowIcon = ({ size = 16 }: { size?: number }) => (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

export default function HomePage() {
    // 1. Hook auth untuk memeriksa status login pengguna
    const { user } = useAuth();
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
                if (res.data?.data && res.data.data.length > 0) {
                    setProducts(res.data.data);
                }
            } catch (err) {
                console.warn('Gagal memuat produk dari server.', err);
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, []);

    // 4. Format mata uang Rupiah
    const formatRupiah = (val?: number | null) => {
        if (!val) return 'Hubungi toko';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val);
    };

    // 5. Belum login → halaman login. Sudah login → halaman detail produk.
    const handleViewDetail = (productId: number) => {
        navigate(user ? `/products/${productId}` : '/login');
    };

    // 6. Filter produk berdasarkan brand yang dipilih
    const matchBrand = (item: ProductItem, brand: string) =>
        brand === 'Semua' || item.brand?.trim().toLowerCase() === brand.toLowerCase();

    // Daftar brand dibuat dari produk yang ada di database (tanpa duplikat, urut abjad)
    const brandMap = new Map<string, string>();
    products.forEach((item) => {
        const name = item.brand?.trim();
        if (name && !brandMap.has(name.toLowerCase())) brandMap.set(name.toLowerCase(), name);
    });
    const brands = ['Semua', ...Array.from(brandMap.values()).sort((a, b) => a.localeCompare(b, 'id'))];

    const filteredProducts = products.filter((item) => matchBrand(item, selectedBrand));
    const countOf = (brand: string) => products.filter((item) => matchBrand(item, brand)).length;

    // 7. Produk terbaru di hero: produk pertama yang masih ada stok, atau data contoh
    const spotlight =
        products.find((p) => (p.total_stock ?? 0) > 0) ?? products[0] ?? SPOTLIGHT_FALLBACK;

    return (
        <div
            className="min-h-screen bg-[#EEF0EB] text-[#131820]"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
            {/* Pengaturan Header Berada di SiteHeader.tsx */}
            <SiteHeader />

            {/* ===================== HERO ===================== */}
            <section className="relative bg-[#131820] text-white">

                <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-12">
                    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
                        {/* Kiri: headline + ajakan */}
                        <div className="lg:col-span-7">
                            <h1 className="max-w-[12ch] text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl xl:text-7xl">
                                Temukan ponsel berikutnya.
                            </h1>
                            <p className="mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
                                Handphone original dari Apple, Samsung, Xiaomi, dan merek lain, lengkap dengan garansi resmi. Bayar di tempat atau transfer BCA.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                                <a
                                    href="#katalog"
                                    className="inline-flex h-12 items-center rounded-lg bg-[#0A7C86] px-6 text-base font-bold text-white transition-[background-color,transform] hover:bg-[#086872] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3FB6C1]/60 active:scale-[0.99]"
                                >
                                    Lihat katalog
                                </a>
                                <a
                                    href="#cara-belanja"
                                    className="inline-flex h-12 items-center rounded-lg text-base font-semibold text-white/90 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3FB6C1]/60"
                                >
                                    Cara belanja
                                </a>
                            </div>
                        </div>

                        {/* Kanan: produk terbaru, sejajar vertikal dengan teks di dalam hero */}
                        <div className="w-full max-w-sm justify-self-center lg:col-span-5 lg:justify-self-end">
                            <div className="rounded-3xl bg-white p-4 shadow-[0_20px_50px_-12px_rgba(19,24,32,0.55)] ring-1 ring-white/20 sm:p-5">
                                <div className="relative rounded-2xl bg-[#EEF0EB]">
                                    <img
                                        src={spotlight.image_url || FALLBACK_IMAGE}
                                        alt={spotlight.name}
                                        className="h-48 w-full object-contain p-5 sm:h-52"
                                    />
                                    <span className="absolute left-3 top-3 rounded-full bg-[#131820] px-2.5 py-1 text-xs font-semibold text-white">
                                        Terbaru 
                                    </span>
                                </div>

                                <div className="px-1 pb-1 pt-4">
                                    <p className="text-xs font-medium text-[#5A6472]">{spotlight.brand}</p>
                                    <h2 className="mt-0.5 text-xl font-extrabold tracking-[-0.02em] text-[#131820]">
                                        {spotlight.name}
                                    </h2>
                                    {spotlight.description && (
                                        <p className="mt-1 line-clamp-2 text-sm leading-normal text-[#5A6472]">
                                            {spotlight.description}
                                        </p>
                                    )}

                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <div>
                                            {spotlight.min_price ? (
                                                <p className="text-xs text-[#5A6472]">Mulai dari</p>
                                            ) : null}
                                            <p className="text-lg font-extrabold tracking-[-0.02em] text-[#131820]">
                                                {formatRupiah(spotlight.min_price)}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleViewDetail(spotlight.id)}
                                            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-[#0A7C86] px-4 text-sm font-bold text-white transition-[background-color,transform] hover:bg-[#086872] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50 focus-visible:ring-offset-2 active:scale-[0.99]"
                                        >
                                            Lihat detail
                                            <ArrowIcon />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===================== KEUNGGULAN TOKO ===================== */}
                        <section aria-label="Keunggulan toko" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
                <div>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
                        {TRUST_POINTS.map((point) => (
                            <li
                                key={point.title}
                                className="flex flex-col gap-2 sm:border-l sm:border-[#8A93A0]/40 sm:pl-4 sm:first:border-l-0 sm:first:pl-0"
                            >
                                <span className="text-[#086872]">
                                    <svg {...iconProps}>{point.icon}</svg>
                                </span>
                                <span>
                                    <span className="block text-sm font-bold text-[#131820]">{point.title}</span>
                                    <span className="block text-xs text-[#5A6472] sm:text-sm">{point.text}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* ===================== KATALOG ===================== */}
            <main id="katalog" className="mx-auto max-w-7xl scroll-mt-6 px-4 pb-16 pt-8 sm:px-6 sm:pb-24 lg:pt-12">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
                            Katalog smartphone
                        </h2>
                        <p className="mt-2 max-w-md text-base leading-normal text-[#5A6472]">
                            {user
                                ? 'Pilih ponsel untuk melihat spesifikasi dan harga lengkap.'
                                : 'Pilih ponsel untuk melihat detailnya. Anda akan diminta masuk lebih dulu.'}
                        </p>
                    </div>
                    {!loading && products.length > 0 && (
                        <p aria-live="polite" className="text-sm text-[#5A6472]">
                            Menampilkan {filteredProducts.length} dari {products.length} ponsel
                        </p>
                    )}
                </div>

                {/* Filter merek: tab bergaris bawah, bisa digeser di HP */}
                {(loading || products.length > 0) && (
                <div className="-mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                    <div className="flex min-w-max gap-5 border-b border-[#8A93A0]/40 sm:gap-7">
                        {brands.map((brand) => {
                            const active = selectedBrand === brand;
                            return (
                                <button
                                    key={brand}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => setSelectedBrand(brand)}
                                    className={`-mb-px flex h-11 shrink-0 items-center gap-1.5 rounded-t border-b-2 px-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50 ${active
                                        ? 'border-[#0A7C86] text-[#131820]'
                                        : 'border-transparent text-[#5A6472] hover:text-[#131820]'
                                        }`}
                                >
                                    {brand}
                                    {!loading && products.length > 0 && (
                                        <span className={`text-xs font-medium ${active ? 'text-[#086872]' : 'text-[#5A6472]'}`}>
                                            {countOf(brand)}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
                )}

                {/* ===================== DAFTAR PRODUK ===================== */}
                {loading ? (
                    <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[4/5] rounded-2xl bg-[#131820]/10" />
                                <div className="mt-3 h-3 w-1/3 rounded bg-[#131820]/10" />
                                <div className="mt-2 h-4 w-4/5 rounded bg-[#131820]/10" />
                                <div className="mt-3 h-4 w-1/2 rounded bg-[#131820]/10" />
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="mt-10 rounded-2xl border border-dashed border-[#8A93A0] p-8 text-center sm:p-12">
                        <h3 className="text-lg font-bold text-[#131820]">Katalog belum bisa dimuat</h3>
                        <p className="mx-auto mt-1 max-w-sm text-sm leading-normal text-[#5A6472]">
                            Produk belum tersedia atau koneksi ke server terputus. Muat ulang halaman, lalu coba lagi.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="mt-5 h-11 rounded-lg bg-[#0A7C86] px-5 text-sm font-bold text-white transition-colors hover:bg-[#086872] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EEF0EB]"
                        >
                            Muat ulang
                        </button>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="mt-10 rounded-2xl border border-dashed border-[#8A93A0] p-8 text-center sm:p-12">
                        <h3 className="text-lg font-bold text-[#131820]">Belum ada ponsel {selectedBrand}</h3>
                        <p className="mx-auto mt-1 max-w-sm text-sm leading-normal text-[#5A6472]">
                            Pilih merek lain di atas, atau tampilkan semua ponsel.
                        </p>
                        <button
                            type="button"
                            onClick={() => setSelectedBrand('Semua')}
                            className="mt-5 h-11 rounded-lg bg-[#0A7C86] px-5 text-sm font-bold text-white transition-colors hover:bg-[#086872] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EEF0EB]"
                        >
                            Tampilkan semua
                        </button>
                    </div>
                ) : (
                    <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
                        {filteredProducts.map((phone) => {
                            const inStock = (phone.total_stock ?? 0) > 0;
                            return (
                                <li key={phone.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleViewDetail(phone.id)}
                                        className="group block w-full text-left focus-visible:outline-none"
                                    >
                                        {/* Gambar + status stok */}
                                        <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-white ring-1 ring-[#8A93A0]/30 transition-shadow group-hover:ring-[#0A7C86] group-focus-visible:ring-[3px] group-focus-visible:ring-[#0A7C86]/60">
                                            <img
                                                src={phone.image_url || FALLBACK_IMAGE}
                                                alt={phone.name}
                                                loading="lazy"
                                                className={`h-full w-full object-contain p-5 transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:p-7 ${inStock ? '' : 'opacity-50 grayscale'}`}
                                            />
                                            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#EEF0EB] px-2.5 py-1 text-[11px] font-semibold text-[#131820] sm:left-3 sm:top-3">
                                                <span className={`h-1.5 w-1.5 rounded-full ${inStock ? 'bg-[#0A7C86]' : 'bg-[#B42318]'}`} />
                                                {inStock ? `Stok ${phone.total_stock}` : 'Habis'}
                                            </span>
                                        </span>

                                        {/* Info produk */}
                                        <span className="mt-3 block text-xs font-medium text-[#5A6472]">{phone.brand}</span>
                                        <span className="mt-0.5 block line-clamp-2 text-sm font-bold leading-snug text-[#131820] sm:text-base">
                                            {phone.name}
                                        </span>
                                        {phone.description && (
                                            <span className="mt-1 hidden line-clamp-2 text-sm leading-normal text-[#5A6472] sm:block">
                                                {phone.description}
                                            </span>
                                        )}

                                        <span className="mt-3 flex items-end justify-between gap-2">
                                            <span className="block">
                                                {phone.min_price ? (
                                                    <span className="block text-[11px] text-[#5A6472]">Mulai dari</span>
                                                ) : null}
                                                <span className="block text-sm font-extrabold tracking-[-0.01em] text-[#131820] sm:text-base">
                                                    {formatRupiah(phone.min_price)}
                                                </span>
                                            </span>
                                            <span
                                                aria-hidden="true"
                                                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#131820] text-white transition-colors group-hover:bg-[#0A7C86]"
                                            >
                                                <ArrowIcon size={16} />
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </main>

            {/* ===================== CARA BELANJA ===================== */}
            <section id="cara-belanja" className="scroll-mt-6 bg-[#131820] text-white">
                <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
                        <h2 className="max-w-[14ch] text-3xl font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-4xl lg:col-span-4 lg:text-5xl">
                            Tiga langkah sampai ponsel di tangan.
                        </h2>

                        <ol className="divide-y divide-white/15 border-y border-white/15 lg:col-span-8">
                            {STEPS.map((step, i) => (
                                <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-6 sm:grid-cols-[4.5rem_1fr] sm:py-8">
                                    <span className="text-3xl font-extrabold leading-none tracking-[-0.03em] text-[#3FB6C1] sm:text-5xl">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <h3 className="text-lg font-bold sm:text-xl">{step.title}</h3>
                                        <p className="mt-1 max-w-lg text-base leading-normal text-white/70">{step.text}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </section>

            {/* ===================== FOOTER ===================== */}
            <footer className="bg-[#131820] text-white">
                <div className="mx-auto max-w-7xl border-t border-white/15 px-4 pb-8 pt-10 sm:px-6">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-12 lg:gap-12">
                        <div className="lg:col-span-5">
                            <div className="flex items-center gap-2.5">
                                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3FB6C1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="5" y="2" width="14" height="20" rx="3" />
                                    <line x1="10" y1="18" x2="14" y2="18" />
                                </svg>
                                <span className="text-lg font-extrabold tracking-[-0.02em]">ArliPhone</span>
                            </div>
                            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
                                Toko smartphone resmi dengan unit bergaransi Indonesia dan pilihan pembayaran yang fleksibel.
                            </p>
                        </div>

                        <div className="lg:col-span-4">
                            <h3 className="text-sm font-bold text-white">Metode pembayaran</h3>
                            <ul className="mt-3 space-y-2.5 text-sm text-white/70">
                                <li className="flex items-center gap-2.5">
                                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-bold text-white">COD</span>
                                    Bayar di tempat saat ponsel tiba
                                </li>
                                <li className="flex items-center gap-2.5">
                                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-bold text-white">BCA</span>
                                    Transfer ke <b className="text-white">{BANK_ACCOUNT}</b>
                                </li>
                            </ul>
                        </div>

                        <div className="lg:col-span-3">
                            <h3 className="text-sm font-bold text-white">{user ? 'Akun saya' : 'Bantuan & akun'}</h3>
                            {user ? (
                                <ul className="mt-3 space-y-1 text-sm">
                                    <li>
                                        <Link
                                            to="/orders"
                                            className="inline-flex h-9 items-center rounded font-semibold text-[#3FB6C1] hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3FB6C1]/60"
                                        >
                                            Pesanan saya
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/profile"
                                            className="inline-flex h-9 items-center rounded font-semibold text-[#3FB6C1] hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3FB6C1]/60"
                                        >
                                            Edit profil
                                        </Link>
                                    </li>
                                </ul>
                            ) : (
                                <>
                                    <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
                                        Masuk untuk melihat spesifikasi, checkout, dan mengunggah bukti pembayaran.
                                    </p>
                                    <Link
                                        to="/login"
                                        className="mt-2 inline-flex h-9 items-center rounded text-sm font-semibold text-[#3FB6C1] hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3FB6C1]/60"
                                    >
                                        Sudah punya akun? Masuk
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    <p className="mt-10 border-t border-white/10 pt-6 text-xs text-white/60">
                        © {new Date().getFullYear()} ArliPhone. Hak cipta dilindungi.
                    </p>
                </div>
            </footer>
        </div>
    );
}