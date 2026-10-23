import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { api } from '../services/api';
import { useAuth, type User } from '../context/AuthContext';

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
      navigate('/');                        // pindah ke halaman utama
    } catch (err) {
      // Ambil pesan dari backend (contoh: "Email atau password salah")
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Tidak dapat terhubung ke server');
      } else {
        setError('Terjadi kesalahan');
      }
    } finally {
      setLoading(false); // apa pun hasilnya, tombol aktif lagi
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-5"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        backgroundColor: '#0f172a',
      }}
    >
      {/* ── Card ── */}
      <div
        className="w-full"
        style={{
          maxWidth: 420,
          backgroundColor: '#1e293b',
          borderRadius: 16,
          border: '1px solid #334155',
          padding: '40px 36px 36px',
        }}
      >
        {/* ── Brand ── */}
        <div style={{ marginBottom: 28 }}>
          <div className="flex items-center gap-2.5" style={{ marginBottom: 20 }}>
            {/* Ikon sederhana sebagai pengganti logo */}
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#f1f5f9',
                letterSpacing: '-0.02em',
              }}
            >
              ArliPhone
            </span>
          </div>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: '#f1f5f9',
              lineHeight: 1.25,
              letterSpacing: '-0.025em',
              margin: 0,
            }}
          >
            Masuk ke akun Anda
          </h1>
          <p
            style={{
              fontSize: 14,
              color: '#94a3b8',
              marginTop: 8,
              lineHeight: 1.5,
            }}
          >
            Belanja gadget impian jadi lebih mudah.
          </p>
        </div>

        {/* ── Error message ── */}
        {error && (
          <div
            role="alert"
            style={{
              backgroundColor: 'rgba(127, 29, 29, 0.3)',
              border: '1px solid rgba(248, 113, 113, 0.25)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 20,
              fontSize: 13,
              color: '#fca5a5',
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="login-email"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#cbd5e1',
                marginBottom: 6,
              }}
            >
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
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 10,
                padding: '11px 14px',
                fontSize: 14,
                color: '#f1f5f9',
                outline: 'none',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#334155';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="login-password"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 500,
                color: '#cbd5e1',
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 10,
                  padding: '11px 42px 11px 14px',
                  fontSize: 14,
                  color: '#f1f5f9',
                  outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {/* Toggle visibility */}
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                }}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            style={{
              width: '100%',
              padding: '12px 0',
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              background: loading
                ? '#4f46e5'
                : 'linear-gradient(135deg, #6366f1, #818cf8)',
              border: 'none',
              borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.65 : 1,
              transition: 'opacity 0.2s, transform 0.1s',
              letterSpacing: '-0.01em',
            }}
            onMouseDown={(e) => {
              if (!loading) (e.currentTarget.style.transform = 'scale(0.985)');
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        {/* ── Footer link ── */}
        <p
          style={{
            marginTop: 24,
            textAlign: 'center',
            fontSize: 13,
            color: '#94a3b8',
          }}
        >
          Belum punya akun?{' '}
          <Link
            to="/register"
            style={{
              color: '#818cf8',
              fontWeight: 500,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            Daftar sekarang
          </Link>
        </p>
      </div>

      {/* ── Bottom copyright ── */}
      <p
        style={{
          marginTop: 32,
          fontSize: 12,
          color: '#475569',
          textAlign: 'center',
        }}
      >
        © 2026 ArliPhone. Hak cipta dilindungi.
      </p>
    </div>
  );
}