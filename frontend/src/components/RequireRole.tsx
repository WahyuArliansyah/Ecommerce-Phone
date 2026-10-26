import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/*
  Penjaga rute: hanya user dengan role tertentu yang boleh melihat halaman di dalamnya.
  - Belum login            -> diarahkan ke /login
  - Login tapi role salah  -> diarahkan ke halaman utama
  Catatan: ini hanya mengatur tampilan. Pembatasan akses sebenarnya tetap harus
  dilakukan di backend (middleware yang memeriksa role pada endpoint admin).
*/
export default function RequireRole({ role, children }: { role: string; children: ReactNode }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;

  return <>{children}</>;
}