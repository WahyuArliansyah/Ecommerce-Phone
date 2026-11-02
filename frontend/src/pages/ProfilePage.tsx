import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth, type User } from '../context/AuthContext';
import UserAvatar from '../components/UserAvatar';
import { apiError, missingFields } from '../utils/profile';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function ProfilePage() {
    const { user, updateUser } = useAuth();

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [avatarBusy, setAvatarBusy] = useState(false);
    const [avatarError, setAvatarError] = useState('');

    // Ambil data terbaru dari server dulu, supaya form tidak terisi data lama
    useEffect(() => {
        let ignore = false;
        api
            .get<User>('/auth/me')
            .then((res) => {
                if (ignore) return;
                setName(res.data.name ?? '');
                setPhone(res.data.phone ?? '');
                setAddress(res.data.address ?? '');
                updateUser(res.data);
                setLoading(false);
            })
            .catch((err) => {
                if (ignore) return;
                setLoadError(apiError(err, 'Tidak dapat memuat profil. Periksa koneksi internet, lalu coba lagi.'));
                setLoading(false);
            });
        return () => {
            ignore = true;
        };
    }, [updateUser]);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(''), 4000);
        return () => clearTimeout(t);
    }, [notice]);

    const handleAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // supaya file yang sama bisa dipilih ulang
        if (!file) return;
        if (!IMAGE_TYPES.includes(file.type)) {
            setAvatarError('Format foto harus JPG, PNG, atau WEBP.');
            return;
        }
        if (file.size > MAX_AVATAR_BYTES) {
            setAvatarError('Ukuran foto maksimal 5 MB.');
            return;
        }
        setAvatarError('');
        setAvatarBusy(true);
        try {
            const form = new FormData();
            form.append('avatar', file); // nama field harus sama dengan .single('avatar') di backend
            const res = await api.post<{ avatar: string }>('/auth/me/avatar', form);
            updateUser({ avatar: res.data.avatar });
            setNotice('Foto profil diperbarui.');
        } catch (err) {
            setAvatarError(apiError(err, 'Tidak dapat mengunggah foto. Periksa koneksi internet, lalu coba lagi.'));
        } finally {
            setAvatarBusy(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setNotice('');
        setSaving(true);
        try {
            const res = await api.put<{ name: string; phone: string | null; address: string | null }>('/auth/me', {
                name: name.trim(),
                phone: phone.trim(),
                address: address.trim(),
            });
            updateUser(res.data); // header (titik badge, nama) ikut diperbarui
            setNotice('Profil berhasil disimpan.');
        } catch (err) {
            setError(apiError(err, 'Tidak dapat menyimpan profil. Periksa koneksi internet, lalu coba lagi.'));
        } finally {
            setSaving(false);
        }
    };

    const missing = user ? missingFields(user) : [];

    /* ── Shared input classes ── */
    const inputBase =
        'h-12 w-full rounded-xl border bg-white px-4 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400';
    const inputNormal =
        `${inputBase} border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10`;
    const inputDisabled =
        `${inputBase} border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed`;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
            {/* ── Sticky header ── */}
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-2xl items-center gap-3 px-4 sm:px-6">
                    <Link
                        to="/"
                        className="group -ml-2 flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    >
                        <svg
                            aria-hidden="true"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="transition-transform duration-200 group-hover:-translate-x-0.5"
                        >
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Kembali
                    </Link>
                    <div className="h-5 w-px bg-slate-200" />
                    <h1 className="text-sm font-semibold tracking-tight text-slate-900">Edit Profil</h1>
                </div>
            </header>

            {/* ── Main content ── */}
            <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
                {/* Pemberitahuan profil belum lengkap */}
                {!loading && missing.length > 0 && (
                    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                        <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p>
                            Lengkapi <b className="font-semibold">{missing.join(', ')}</b> agar profil Anda lengkap dan bisa dipakai saat checkout.
                        </p>
                    </div>
                )}

                <div role="status" aria-live="polite">
                    {notice && (
                        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
                            <svg className="h-5 w-5 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {notice}
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600" />
                        <p className="mt-4 text-sm text-slate-500">Memuat profil…</p>
                    </div>
                ) : loadError ? (
                    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                        <svg className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {loadError}
                    </div>
                ) : (
                    user && (
                        <div className="space-y-6">
                            {/* ── Foto profil card ── */}
                            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5">
                                <div className="border-b border-slate-100 px-6 py-4">
                                    <h2 className="text-sm font-semibold text-slate-900">Foto Profil</h2>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Foto ini akan ditampilkan di profil dan pesanan Anda.
                                    </p>
                                </div>

                                <div className="flex flex-col items-center gap-5 px-6 py-8 sm:flex-row sm:items-center sm:gap-8">
                                    {/* Avatar preview */}
                                    <div className="relative">
                                        <div className="rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 p-1">
                                            <UserAvatar user={user} className="h-28 w-28 text-3xl" />
                                        </div>
                                        {avatarBusy && (
                                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                                                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-white/40 border-t-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload controls */}
                                    <div className="flex flex-col items-center gap-2 sm:items-start">
                                        <label
                                            htmlFor="avatar-input"
                                            className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow focus-within:ring-4 focus-within:ring-indigo-500/10 active:scale-[0.98] ${avatarBusy ? 'pointer-events-none opacity-50' : ''}`}
                                        >
                                            <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {avatarBusy ? 'Mengunggah…' : user.avatar ? 'Ganti foto' : 'Pilih foto'}
                                        </label>
                                        <input
                                            id="avatar-input"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleAvatar}
                                            disabled={avatarBusy}
                                            className="sr-only"
                                        />
                                        <p className="text-xs text-slate-400">JPG, PNG, atau WEBP · Maks 5 MB</p>
                                        {avatarError && (
                                            <p role="alert" className="text-xs font-medium text-rose-600">
                                                {avatarError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* ── Data diri form card ── */}
                            <form
                                onSubmit={handleSubmit}
                                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/5"
                            >
                                <div className="border-b border-slate-100 px-6 py-4">
                                    <h2 className="text-sm font-semibold text-slate-900">Informasi Pribadi</h2>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Data ini digunakan untuk pengiriman dan komunikasi.
                                    </p>
                                </div>

                                <div className="px-6 py-6 sm:py-8">
                                    {error && (
                                        <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                            <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-5">
                                        {/* Email (read‑only) */}
                                        <div>
                                            <label htmlFor="pf-email" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                                Email
                                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                                    Tidak dapat diubah
                                                </span>
                                            </label>
                                            <input
                                                id="pf-email"
                                                value={user.email}
                                                readOnly
                                                disabled
                                                className={inputDisabled}
                                            />
                                        </div>

                                        {/* Nama lengkap */}
                                        <div>
                                            <label htmlFor="pf-name" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Nama lengkap
                                            </label>
                                            <input
                                                id="pf-name"
                                                required
                                                minLength={2}
                                                maxLength={100}
                                                autoComplete="name"
                                                placeholder="Masukkan nama lengkap"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className={inputNormal}
                                            />
                                        </div>

                                        {/* Nomor HP */}
                                        <div>
                                            <label htmlFor="pf-phone" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                Nomor HP
                                            </label>
                                            <input
                                                id="pf-phone"
                                                type="tel"
                                                inputMode="tel"
                                                required
                                                autoComplete="tel"
                                                placeholder="081234567890"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                className={inputNormal}
                                            />
                                        </div>

                                        {/* Alamat pengiriman */}
                                        <div>
                                            <label htmlFor="pf-address" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Alamat pengiriman
                                            </label>
                                            <textarea
                                                id="pf-address"
                                                required
                                                rows={4}
                                                minLength={10}
                                                maxLength={255}
                                                autoComplete="street-address"
                                                placeholder="Jalan, nomor rumah, kelurahan, kecamatan, kota, kode pos"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                                            />
                                            <p className="mt-2 text-xs text-slate-400">Minimal 10 karakter.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Form footer */}
                                <div className="flex items-center justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-8 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition-all duration-200 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-600/25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                Menyimpan…
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Simpan perubahan
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )
                )}
            </main>
        </div>
    );
}
