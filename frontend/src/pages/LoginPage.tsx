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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow">

        {/* Kotak error hanya tampil kalau error tidak kosong */}
        {error && (
          <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Tombol dinonaktifkan saat loading; teksnya berubah memakai ternary */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Belum punya akun?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}