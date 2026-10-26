import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
    createProduct,
    deleteProduct,
    getBrands,
    updateProduct,
    type Brand,
    type ProductFields,
    type VariantFields,
} from './services/Adminproducts';
import type { ProductItem } from '../HomePage';
import ConfirmDeleteDialog from '../admin/Confirmdeletedialog ';
import ProductFormDialog from '../admin/Productformdialog';
import VariantsDialog from '../admin/Variantsdialog';
import {
    alertClass,
    btnPrimary,
    btnSecondary,
    errorMessage,
    fieldClass,
    formatRupiah,
    rowBtnDanger,
    rowBtnNormal,
} from './services/Adminui';

const PAGE_SIZE = 10;
const LOW_STOCK = 5; // total stok sama dengan atau di bawah angka ini dianggap menipis

type StockState = 'habis' | 'menipis' | 'tersedia';

function stockState(stock?: number | string): StockState {
    const s = Number(stock ?? 0);
    if (s <= 0) return 'habis';
    if (s <= LOW_STOCK) return 'menipis';
    return 'tersedia';
}

// Status stok selalu berupa teks + titik, tidak hanya warna
const STOCK_STYLE: Record<StockState, { label: string; text: string; dot: string }> = {
    habis: { label: 'Habis', text: 'text-[#B42318]', dot: 'bg-[#B42318]' },
    menipis: { label: 'Menipis', text: 'text-[#946200]', dot: 'bg-[#C98A00]' },
    tersedia: { label: 'Tersedia', text: 'text-[#1B7F4B]', dot: 'bg-[#1B7F4B]' },
};

function StockBadge({ stock }: { stock?: number }) {
    const s = STOCK_STYLE[stockState(stock)];
    return (
        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${s.text}`}>
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

// Kalau gambar gagal dimuat (URL salah), tampilkan ikon ponsel
function Thumb({ src }: { src?: string | null }) {
    const [failed, setFailed] = useState(false);
    return (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#EEF0EB]">
            {src && !failed ? (
                <img
                    src={src}
                    alt=""
                    loading="lazy"
                    onError={() => setFailed(true)}
                    className="max-h-full max-w-full object-contain"
                />
            ) : (
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A93A0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="3" />
                    <line x1="10" y1="18" x2="14" y2="18" />
                </svg>
            )}
        </div>
    );
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [page, setPage] = useState(1);
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState(''); // query yang sudah ditunda (debounce)
    const [brandId, setBrandId] = useState('');
    const [brands, setBrands] = useState<Brand[]>([]);

    const [formTarget, setFormTarget] = useState<'new' | number | null>(null); // 'new' = tambah, angka = id produk yang diubah
    const [variantsTarget, setVariantsTarget] = useState<ProductItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
    const [notice, setNotice] = useState('');

    // Pencarian ditunda 350 ms supaya server tidak dipanggil di setiap ketikan
    useEffect(() => {
        const t = setTimeout(() => {
            setSearch(query.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(t);
    }, [query]);

    // Daftar brand untuk filter dan form. Kalau gagal, filter disembunyikan dan form memberi tahu.
    useEffect(() => {
        const loadBrands = () =>
            getBrands()
                .then(setBrands)
                .catch(() => setBrands([]));
        loadBrands();
        window.addEventListener('brands:changed', loadBrands);
        return () => window.removeEventListener('brands:changed', loadBrands);
    }, []);

    // Admin hanya melihat data asli dari server (tanpa data contoh)
    const load = useCallback(
        async (silent = false) => {
            if (!silent) setLoading(true);
            setError('');
            try {
                const res = await api.get<{ data: ProductItem[]; total: number }>('/products', {
                    params: { page, limit: PAGE_SIZE, search: search || undefined, brand_id: brandId || undefined },
                });
                setProducts(res.data?.data ?? []);
                setTotal(Number(res.data?.total) || 0);
            } catch (err) {
                setError(errorMessage(err, 'Periksa koneksi internet dan pastikan server berjalan.'));
            } finally {
                setLoading(false);
            }
        },
        [page, search, brandId],
    );

    useEffect(() => {
        load();
    }, [load]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Kalau halaman terakhir jadi kosong (misalnya setelah hapus), mundur satu halaman
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(''), 4000);
        return () => clearTimeout(t);
    }, [notice]);

    const filtering = search !== '' || brandId !== '';

    const resetFilter = () => {
        setQuery('');
        setSearch('');
        setBrandId('');
        setPage(1);
    };

    /* ---------- Aksi CRUD ---------- */

    const handleSaveProduct = async (fields: ProductFields, variants: VariantFields[]) => {
        if (formTarget === 'new') {
            await createProduct(fields, variants);
            setNotice('Produk ditambahkan.');
            setFormTarget(null);
            if (page !== 1) setPage(1); // produk baru tampil di halaman pertama
            else await load(true);
        } else if (typeof formTarget === 'number') {
            await updateProduct(formTarget, fields);
            setNotice('Perubahan disimpan.');
            setFormTarget(null);
            await load(true);
        }
    };

    const handleDeleteProduct = async () => {
        if (!deleteTarget) return;
        await deleteProduct(deleteTarget.id);
        setDeleteTarget(null);
        setNotice('Produk dihapus.');
        await load(true);
    };

    return (
        <div className="mx-auto w-full max-w-[1100px] px-5 py-6 sm:px-8 lg:px-10 lg:py-9">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.03em]">Produk</h1>
                    {!loading && !error && (
                        <p className="mt-1.5 text-base text-[#5A6472]">
                            {total} produk{filtering ? ' cocok dengan filter' : ''}.
                        </p>
                    )}
                </div>
                <button type="button" onClick={() => setFormTarget('new')} className={btnPrimary + ' cursor-pointer -mr-3'}>
                    Tambah Produk
                </button>
            </div>

            <div role="status" aria-live="polite">
                {notice && (
                    <p className="mt-4 rounded-lg border border-[#1B7F4B]/30 bg-[#1B7F4B]/10 px-4 py-3 text-sm font-semibold text-[#1B7F4B]">
                        {notice}
                    </p>
                )}
            </div>

            {error && (
                <div
                    role="alert"
                    className={`mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${alertClass}`}
                >
                    <p>Tidak dapat memuat produk. {error}</p>
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
                    {/* Cari & filter (diproses server) */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                        <div className="flex-1">
                            <label htmlFor="admin-search" className="sr-only">
                                Cari produk
                            </label>
                            <input
                                id="admin-search"
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Cari nama produk"
                                className={fieldClass}
                            />
                        </div>
                        {brands.length > 0 && (
                            <div className="sm:w-48">
                                <label htmlFor="admin-brand" className="sr-only">
                                    Filter brand
                                </label>
                                <select
                                    id="admin-brand"
                                    value={brandId}
                                    onChange={(e) => {
                                        setBrandId(e.target.value);
                                        setPage(1);
                                    }}
                                    className={fieldClass}
                                >
                                    <option value="">Semua brand</option>
                                    {brands.map((b) => (
                                        <option key={b.id} value={b.id}>
                                            {b.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 overflow-hidden rounded-xl border border-[#D5D9D2] bg-white">
                        {loading ? (
                            <ul aria-busy="true" aria-label="Memuat produk" className="divide-y divide-[#E4E7E0]">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <li key={i} className="flex items-center gap-3 px-4 py-3 motion-safe:animate-pulse">
                                        <div className="h-12 w-12 rounded-lg bg-[#E4E7E0]" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3.5 w-1/2 rounded bg-[#E4E7E0]" />
                                            <div className="h-3 w-1/4 rounded bg-[#E4E7E0]" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : products.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                {filtering ? (
                                    <>
                                        <p className="text-base font-semibold">Tidak ada produk yang cocok</p>
                                        <p className="mt-1 text-sm text-[#5A6472]">Ubah kata kunci atau pilih brand lain.</p>
                                        <button type="button" onClick={resetFilter} className={`mt-4 ${btnSecondary}`}>
                                            Hapus filter
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-base font-semibold">Belum ada produk</p>
                                        <p className="mt-1 text-sm text-[#5A6472]">Tambahkan produk pertama untuk mulai berjualan.</p>
                                        <button type="button" onClick={() => setFormTarget('new')} className={`mt-4 ${btnPrimary}`}>
                                            Tambah produk
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Mobile: baris bertumpuk */}
                                <ul className="divide-y divide-[#E4E7E0] md:hidden">
                                    {products.map((p) => (
                                        <li key={p.id} className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Thumb key={p.image_url ?? ''} src={p.image_url} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold">{p.name}</p>
                                                    <p className="text-sm text-[#5A6472]">{p.brand}</p>
                                                    <p className="text-sm tabular-nums">{formatRupiah(p.min_price)}</p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="text-sm font-bold tabular-nums">{p.total_stock ?? 0} unit</p>
                                                    <StockBadge stock={Number(p.total_stock ?? 0)} />
                                                </div>
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <button type="button" onClick={() => setVariantsTarget(p)} aria-label={`Kelola varian ${p.name}`} className={`flex-1 border border-[#8A93A0] ${rowBtnNormal}`}>
                                                    Varian
                                                </button>
                                                <button type="button" onClick={() => setFormTarget(p.id)} aria-label={`Ubah ${p.name}`} className={`flex-1 border border-[#8A93A0] ${rowBtnNormal}`}>
                                                    Ubah
                                                </button>
                                                <button type="button" onClick={() => setDeleteTarget(p)} aria-label={`Hapus ${p.name}`} className={`flex-1 border border-[#B42318]/40 ${rowBtnDanger}`}>
                                                    Hapus
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {/* Desktop: tabel */}
                                <div className="hidden overflow-x-auto md:block">
                                    <table className="w-full text-left">
                                        <caption className="sr-only">Daftar produk</caption>
                                        <thead className="border-b border-[#D5D9D2] text-sm text-[#5A6472]">
                                            <tr>
                                                <th scope="col" className="px-5 py-3 font-semibold">Produk</th>
                                                <th scope="col" className="px-5 py-3 font-semibold">Brand</th>
                                                <th scope="col" className="px-5 py-3 text-right font-semibold">Harga mulai</th>
                                                <th scope="col" className="px-5 py-3 text-right font-semibold">Stok</th>
                                                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                                                <th scope="col" className="px-5 py-3 text-right font-semibold">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E4E7E0]">
                                            {products.map((p) => (
                                                <tr key={p.id}>
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Thumb key={p.image_url ?? ''} src={p.image_url} />
                                                            <span className="text-sm font-semibold">{p.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-sm text-[#5A6472]">{p.brand}</td>
                                                    <td className="px-5 py-3 text-right text-sm tabular-nums">{formatRupiah(p.min_price)}</td>
                                                    <td className="px-5 py-3 text-right text-sm font-bold tabular-nums">{p.total_stock ?? 0}</td>
                                                    <td className="px-5 py-3">
                                                        <StockBadge stock={Number(p.total_stock ?? 0)} />
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <div className="flex justify-end gap-1">
                                                            <button type="button" onClick={() => setVariantsTarget(p)} aria-label={`Kelola varian ${p.name}`} className={rowBtnNormal}>
                                                                Varian
                                                            </button>
                                                            <button type="button" onClick={() => setFormTarget(p.id)} aria-label={`Ubah ${p.name}`} className={rowBtnNormal}>
                                                                Ubah
                                                            </button>
                                                            <button type="button" onClick={() => setDeleteTarget(p)} aria-label={`Hapus ${p.name}`} className={rowBtnDanger}>
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <nav aria-label="Halaman produk" className="mt-4 flex items-center justify-between gap-3">
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

            {/* Dialog */}
            {formTarget !== null && (
                <ProductFormDialog
                    productId={formTarget === 'new' ? null : formTarget}
                    brands={brands}
                    onSubmit={handleSaveProduct}
                    onClose={() => setFormTarget(null)}
                />
            )}

            {variantsTarget && (
                <VariantsDialog
                    productId={variantsTarget.id}
                    productName={variantsTarget.name}
                    onClose={() => {
                        setVariantsTarget(null);
                        load(true); // harga mulai dan total stok di daftar ikut diperbarui
                    }}
                />
            )}

            {deleteTarget && (
                <ConfirmDeleteDialog
                    title="Hapus produk ini?"
                    confirmLabel="Hapus produk"
                    onConfirm={handleDeleteProduct}
                    onClose={() => setDeleteTarget(null)}
                >
                    <span className="font-semibold text-[#131820]">{deleteTarget.name}</span> akan disembunyikan dari toko. Riwayat
                    pesanan yang sudah ada tetap tersimpan.
                </ConfirmDeleteDialog>
            )}
        </div>
    );
}