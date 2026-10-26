import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/*
  Admin yang membuka halaman utama langsung diarahkan ke panel admin.
  Pengecualian: tombol "Lihat toko" di panel admin membawa state { viewStore: true },
  supaya admin tetap bisa melihat katalog seperti pengunjung.
  Membuka alamat langsung di tab baru tidak membawa state itu, jadi admin kembali ke panel.
*/
export default function AdminHomeRedirect({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const viewingStore = (location.state as { viewStore?: boolean } | null)?.viewStore === true;

  if (user?.role === 'admin' && !viewingStore) {
    return <Navigate to="/admin/products" replace />;
  }
  return <>{children}</>;
}