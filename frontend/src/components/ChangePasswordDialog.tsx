import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../services/api';
import { apiError } from '../utils/profile';

const fieldClass =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';

export default function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Buka sebagai modal (latar gelap, fokus terkunci di dialog)
  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) el.showModal();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    // Aturan yang sama dengan backend, supaya pesan error langsung muncul tanpa menunggu server
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) {
      setError('Password baru minimal 8 karakter dan harus mengandung huruf dan angka.');
      return;
    }
    if (next !== confirm) {
      setError('Konfirmasi password tidak sama dengan password baru.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/auth/me/password', { current_password: current, new_password: next });
      setDone(true);
    } catch (err) {
      setError(apiError(err, 'Tidak dapat mengganti password. Periksa koneksi internet, lalu coba lagi.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        if (saving) e.preventDefault();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) e.currentTarget.close();
      }}
      aria-labelledby="pw-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-900/50"
    >
      <div className="p-6">
        <h2 id="pw-title" className="text-lg font-extrabold tracking-tight text-slate-900">
          Ganti Password
        </h2>

        {done ? (
          <>
            <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              Password berhasil diganti.
            </p>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="mt-5 h-11 w-full rounded-lg bg-indigo-600 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Tutup
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="pw-current" className="mb-1.5 block text-sm font-semibold text-slate-900">
                Password lama
              </label>
              <input
                id="pw-current"
                type="password"
                required
                autoComplete="current-password"
                maxLength={72}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label htmlFor="pw-new" className="mb-1.5 block text-sm font-semibold text-slate-900">
                Password baru
              </label>
              <input
                id="pw-new"
                type="password"
                required
                autoComplete="new-password"
                maxLength={72}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                aria-describedby="pw-hint"
                className={fieldClass}
              />
              <p id="pw-hint" className="mt-1.5 text-xs text-slate-500">
                Minimal 8 karakter, mengandung huruf dan angka.
              </p>
            </div>

            <div>
              <label htmlFor="pw-confirm" className="mb-1.5 block text-sm font-semibold text-slate-900">
                Ulangi password baru
              </label>
              <input
                id="pw-confirm"
                type="password"
                required
                autoComplete="new-password"
                maxLength={72}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => ref.current?.close()}
                disabled={saving}
                className="cursor-pointer h-11 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="cursor-pointer h-11 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? 'Menyimpan…' : 'Simpan password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}