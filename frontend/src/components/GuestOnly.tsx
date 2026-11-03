import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/*
  Pembungkus untuk halaman khusus tamu (mis. /login).
  Kalau user sudah login, langsung dialihkan: admin ke panel admin, customer ke beranda.
*/
export default function GuestOnly({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    if (user) return <Navigate to={user.role === 'admin' ? '/admin/products' : '/'} replace />;

    return <>{children}</>;
}