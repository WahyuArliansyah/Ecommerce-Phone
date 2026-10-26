import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { api } from '../services/api';
import { useAuth, type User } from '../context/AuthContext';

/*
  Token desain halaman ini (ditulis sebagai arbitrary value Tailwind):
  Tinta      #131820  panel kiri, teks utama
  Stone      #EEF0EB  latar sisi form
  Abu        #5A6472  teks pendukung
  Teal       #0A7C86  tombol utama, focus ring
  Teal tua   #086872  teks tautan (kontras AA di atas Stone)
  Garis      #8A93A0  border input (kontras 3:1 di atas putih)
  Galat      #B42318  pesan error
*/

export default function LoginPage() {
  // State = data yang berubah-ubah di halaman ini
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate(); // untuk pindah halaman lewat kode

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // cegah browser me-refresh halaman saat form dikirim
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
      login(res.data.token, res.data.user); // simpan token & user
      // jika admin langsung ke admin, jika customer ke home
      navigate(res.data.user.role === 'admin' ? '/admin/products' : '/');
    } catch (err) {
      // Ambil pesan dari backend  (contoh: "Email atau password salah")
      if (isAxiosError(err)) {
        setError(
          err.response?.data?.message ??
            'Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.',
        );
      } else {
        setError('Terjadi kesalahan. Coba lagi.');
      }
    } finally {
      setLoading(false); // apa pun hasilnya, tombol aktif lagi
    }
  };

  return (
    <div
      className="flex min-h-[100dvh] flex-col lg:grid lg:grid-cols-[5fr_6fr]"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* ── Panel merek: header ringkas di mobile, panel penuh di desktop ── */}
      <aside className="relative overflow-hidden bg-[#131820] px-6 py-4 text-white lg:px-12 lg:py-10">
        <div className="relative z-10 flex items-center gap-2.5">
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3FB6C1"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="2" width="14" height="20" rx="3" />
            <line x1="10" y1="18" x2="14" y2="18" />
          </svg>
          <span className="text-lg font-extrabold tracking-[-0.02em]">ArliPhone</span>
        </div>

        <p className="relative z-10 mt-20 hidden max-w-[12ch] text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em] lg:block xl:text-5xl">
          Temukan ponsel berikutnya.
        </p>

        {/* Satu-satunya elemen visual yang menonjol: halaman produk di layar ponsel, terpotong di tepi bawah */}
        <svg
          aria-hidden="true"
          viewBox="0 0 240 480"
          fill="none"
          className="pointer-events-none absolute -bottom-36 left-12 hidden w-60 lg:block"
        >
          <rect x="2" y="2" width="236" height="476" rx="40" stroke="#1F9AA5" strokeWidth="3" />
          <rect x="86" y="16" width="68" height="18" rx="9" fill="#1F9AA5" fillOpacity="0.35" />
          <rect x="20" y="56" width="200" height="190" rx="22" fill="#1B2430" />
          <circle cx="120" cy="151" r="44" stroke="#1F9AA5" strokeWidth="3" />
          <rect x="20" y="266" width="130" height="12" rx="6" fill="#2B3646" />
          <rect x="20" y="290" width="80" height="12" rx="6" fill="#2B3646" />
          <rect x="20" y="326" width="200" height="48" rx="14" fill="#0A7C86" />
        </svg>
      </aside>

      {/* ── Sisi form ── */}
      <main className="flex flex-1 flex-col bg-[#EEF0EB] px-6 py-10 sm:px-12 lg:px-16">
        <div className="mx-auto my-auto w-full max-w-[400px]">
          <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.03em] text-[#131820]">
            Masuk ke ArliPhone
          </h1>
          <p className="mt-2 text-base leading-normal text-[#5A6472]">
            Masukkan email dan password akun Anda.
          </p>

          {/* ── Pesan error ── */}
          {error && (
            <div
              id="login-error"
              role="alert"
              className="mt-6 rounded-lg border border-[#B42318]/30 bg-[#B42318]/10 px-4 py-3 text-sm leading-normal text-[#B42318]"
            >
              {error}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} aria-busy={loading} className="mt-8">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-[#131820]">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-describedby={error ? 'login-error' : undefined}
                className="h-12 w-full rounded-lg border border-[#8A93A0] bg-white px-4 text-base text-[#131820] outline-none transition-colors placeholder:text-[#6B7480] focus:border-[#0A7C86] focus:ring-[3px] focus:ring-[#0A7C86]/25"
              />
            </div>

            {/* Password */}
            <div className="mt-5">
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-semibold text-[#131820]">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="h-12 w-full rounded-lg border border-[#8A93A0] bg-white pl-4 pr-12 text-base text-[#131820] outline-none transition-colors placeholder:text-[#6B7480] focus:border-[#0A7C86] focus:ring-[3px] focus:ring-[#0A7C86]/25"
                />
                {/* Toggle visibility */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Tampilkan password"
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-[#5A6472] transition-colors hover:text-[#131820] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-[#0A7C86]/50"
                >
                  {showPassword ? (
                    // Eye-off icon
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                    </svg>
                  ) : (
                    // Eye icon
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-7 h-12 w-full rounded-lg bg-[#0A7C86] text-base font-bold text-white transition-[background-color,transform] hover:bg-[#086872] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EEF0EB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sedang masuk…' : 'Masuk'}
            </button>
          </form>

          {/* ── Tautan daftar ── */}
          <p className="mt-8 text-sm text-[#5A6472]">
            Belum punya akun?{' '}
            <Link
              to="/register"
              className="rounded font-semibold text-[#086872] underline underline-offset-4 hover:text-[#131820] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50"
            >
              Daftar
            </Link>
          </p>
        </div>

        <p className="mx-auto mt-12 w-full max-w-[400px] text-xs text-[#5A6472]">
          © 2026 ArliPhone. Hak cipta dilindungi.
        </p>
      </main>
    </div>
  );
}