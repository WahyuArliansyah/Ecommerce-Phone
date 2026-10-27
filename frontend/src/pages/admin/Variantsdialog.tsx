import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
    addVariant,
    deleteVariant,
    getProductDetail,
    updateVariant,
    type Variant,
    type VariantFields,
} from './services/Adminproducts';
import {
    alertClass,
    btnPrimary,
    btnSecondary,
    dialogClass,
    errorMessage,
    fieldBase,
    fieldClass,
    formatRupiah,
    labelClass,
    rowBtnDanger,
    rowBtnNormal,
    useShowModal,
} from './services/Adminui';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

/* ---------- Form satu varian (tambah atau ubah) ---------- */

function VariantForm({
    initial,
    onSubmit,
    onCancel,
}: {
    initial: Variant | null; // null = varian baru
    onSubmit: (values: VariantFields) => Promise<void>;
    onCancel: () => void;
}) {
    const [storage, setStorage] = useState(initial?.storage ?? '');
    const [color, setColor] = useState(initial?.color ?? '');
    const [price, setPrice] = useState(initial ? String(Number(initial.price)) : '');
    const [stock, setStock] = useState(initial ? String(initial.stock) : '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await onSubmit({ storage, color, price: Number(price), stock: Number(stock) });
        } catch (err) {
            setError(errorMessage(err, 'Tidak dapat menyimpan varian. Periksa koneksi internet, lalu coba lagi.'));
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-5 rounded-lg border border-[#D5D9D2] bg-[#EEF0EB]/50 p-4">
            <h3 className="text-base font-bold">{initial ? 'Ubah varian' : 'Tambah varian'}</h3>

            {error && (
                <div role="alert" className={`mt-3 ${alertClass}`}>
                    {error}
                </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="vf-storage" className={labelClass}>
                        Storage
                    </label>
                    <input
                        id="vf-storage"
                        required
                        value={storage}
                        onChange={(e) => setStorage(e.target.value)}
                        placeholder="256GB"
                        className={fieldClass}
                    />
                </div>
                <div>
                    <label htmlFor="vf-color" className={labelClass}>
                        Warna
                    </label>
                    <input
                        id="vf-color"
                        required
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder="Titanium Hitam"
                        className={fieldClass}
                    />
                </div>
                <div>
                    <label htmlFor="vf-price" className={labelClass}>
                        Harga
                    </label>
                    <div className="relative">
                        <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-[#5A6472]"
                        >
                            Rp
                        </span>
                        <input
                            id="vf-price"
                            type="number"
                            inputMode="numeric"
                            required
                            min={1}
                            step={1}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className={`${fieldBase} h-11 pl-11 pr-4`}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor="vf-stock" className={labelClass}>
                        Stok (unit)
                    </label>
                    <input
                        id="vf-stock"
                        type="number"
                        inputMode="numeric"
                        required
                        min={0}
                        step={1}
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        className={fieldClass}
                    />
                </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={onCancel} disabled={saving} className={btnSecondary}>
                    Batal
                </button>
                <button type="submit" disabled={saving} className={btnPrimary}>
                    {saving ? 'Menyimpan…' : initial ? 'Simpan varian' : 'Tambah varian'}
                </button>
            </div>
        </form>
    );
}

/* ---------- Dialog daftar varian ---------- */

interface Props {
    productId: number;
    productName: string;
    onClose: () => void;
}

export default function VariantsDialog({ productId, productName, onClose }: Props) {
    const dialogRef = useShowModal();

    const [variants, setVariants] = useState<Variant[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [editing, setEditing] = useState<Variant | 'new' | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Variant | null>(null);

    const load = useCallback(async () => {
        try {
            const detail = await getProductDetail(productId);
            setVariants(detail.variants);
            setLoadError('');
        } catch (err) {
            setLoadError(errorMessage(err, 'Tidak dapat memuat varian. Periksa koneksi internet, lalu coba lagi.'));
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        load();
    }, [load]);

    const handleSave = async (values: VariantFields) => {
        if (editing && editing !== 'new') await updateVariant(productId, editing.id, values);
        else await addVariant(productId, values);
        setEditing(null);
        await load();
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteVariant(productId, deleteTarget.id);
        setDeleteTarget(null);
        await load();
    };

    return (
        <>
            <dialog
                ref={dialogRef}
                onClose={onClose}
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
                aria-labelledby="variants-title"
                className={`${dialogClass} max-w-[600px]`}
            >
                <div className="p-6">
                    <h2 id="variants-title" className="text-xl font-extrabold tracking-[-0.02em]">
                        Varian {productName}
                    </h2>
                    <p className="mt-1 text-sm text-[#5A6472]">Harga dan stok diatur per varian. Perubahan langsung tersimpan.</p>

                    {loadError && (
                        <div role="alert" className={`mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${alertClass}`}>
                            <p>{loadError}</p>
                            <button type="button" onClick={load} className={`shrink-0 ${btnSecondary}`}>
                                Coba lagi
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <p className="mt-5 text-base text-[#5A6472]">Memuat varian…</p>
                    ) : (
                        !loadError && (
                            <>
                                {variants.length === 0 ? (
                                    <p className="mt-5 text-base text-[#5A6472]">Produk ini belum punya varian.</p>
                                ) : (
                                    <ul className="mt-4 divide-y divide-[#E4E7E0] rounded-lg border border-[#D5D9D2]">
                                        {variants.map((v) => (
                                            <li key={v.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                                                <div className="min-w-0 flex-1 basis-40">
                                                    <p className="text-sm font-semibold">
                                                        {v.storage}, {v.color}
                                                    </p>
                                                    <p className="text-sm tabular-nums text-[#5A6472]">
                                                        {formatRupiah(v.price)}, stok {v.stock} unit
                                                    </p>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditing(v)}
                                                        aria-label={`Ubah varian ${v.storage} ${v.color}`}
                                                        className={rowBtnNormal}
                                                    >
                                                        Ubah
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteTarget(v)}
                                                        aria-label={`Hapus varian ${v.storage} ${v.color}`}
                                                        className={rowBtnDanger}
                                                    >
                                                        Hapus
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {editing ? (
                                    <VariantForm
                                        key={editing === 'new' ? 'new' : editing.id}
                                        initial={editing === 'new' ? null : editing}
                                        onSubmit={handleSave}
                                        onCancel={() => setEditing(null)}
                                    />
                                ) : (
                                    <button type="button" onClick={() => setEditing('new')} className={`mt-4 ${btnSecondary}`}>
                                        Tambah varian
                                    </button>
                                )}
                            </>
                        )
                    )}

                    <div className="mt-6 flex justify-end">
                        <button type="button" onClick={onClose} className={btnPrimary}>
                            Selesai
                        </button>
                    </div>
                </div>
            </dialog>

            {deleteTarget && (
                <ConfirmDeleteDialog
                    title="Hapus varian ini?"
                    confirmLabel="Hapus varian"
                    onConfirm={handleDelete}
                    onClose={() => setDeleteTarget(null)}
                >
                    Varian{' '}
                    <span className="font-semibold text-[#131820]">
                        {deleteTarget.storage}, {deleteTarget.color}
                    </span>{' '}
                    akan dihapus permanen. Varian yang sudah pernah dipesan tidak bisa dihapus.
                </ConfirmDeleteDialog>
            )}
        </>
    );
}