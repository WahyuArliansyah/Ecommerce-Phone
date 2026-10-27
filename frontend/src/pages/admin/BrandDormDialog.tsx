import { useRef, useState, type FormEvent } from 'react';
import { api } from '../../services/api';
import {
    alertClass,
    btnPrimary,
    btnSecondary,
    dialogClass,
    errorMessage,
    fieldClass,
    labelClass,
    useShowModal,
} from './services/Adminui';

interface Props {
    onClose: () => void;
}

export default function BrandFormDialog({ onClose }: Props) {
    const dialogRef = useShowModal();
    const inputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const value = name.trim();
        if (!value) {
            setError('Nama merek wajib diisi');
            return;
        }
        setError('');
        setSuccess('');
        setSaving(true);
        try {
            await api.post('/brands', { name: value });
            setSuccess(`Brand "${value}" ditambahkan.`);
            setName('');
            // Beri tahu halaman produk supaya daftar brand (filter & form) dimuat ulang
            window.dispatchEvent(new Event('brands:changed'));
        } catch (err) {
            setError(errorMessage(err, 'Tidak dapat menambahkan brand. Periksa koneksi internet, lalu coba lagi.'));
        } finally {
            setSaving(false);
            inputRef.current?.focus(); // siap mengetik brand berikutnya
        }
    };

    return (
        <dialog
            ref={dialogRef}
            onClose={onClose}
            onCancel={(e) => {
                if (saving) e.preventDefault();
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !saving) onClose();
            }}
            aria-labelledby="brand-dialog-title"
            className={`${dialogClass} max-w-[440px]`}
        >
            <form onSubmit={handleSubmit} className="p-6">
                <h2 id="brand-dialog-title" className="text-xl font-extrabold tracking-[-0.02em]">
                    Tambah brand
                </h2>

                <div role="status" aria-live="polite">
                    {success && (
                        <p className="mt-4 rounded-lg border border-[#1B7F4B]/30 bg-[#1B7F4B]/10 px-4 py-3 text-sm font-semibold text-[#1B7F4B]">
                            {success}
                        </p>
                    )}
                </div>

                {error && (
                    <div role="alert" className={`mt-4 ${alertClass}`}>
                        {error}
                    </div>
                )}

                <div className="mt-5">
                    <label htmlFor="bf-name" className={labelClass}>
                        Nama brand
                    </label>
                    <input
                        id="bf-name"
                        ref={inputRef}
                        required
                        maxLength={100}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Samsung"
                        className={fieldClass}
                    />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onClose} disabled={saving} className={btnSecondary}>
                        Tutup
                    </button>
                    <button type="submit" disabled={saving} className={btnPrimary}>
                        {saving ? 'Menyimpan…' : 'Tambah brand'}
                    </button>
                </div>
            </form>
        </dialog>
    );
}