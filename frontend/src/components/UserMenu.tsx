import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { missingFields } from '../utils/profile';
import { needsPayment, type OrderStatus, type PaymentMethod } from '../utils/orders';
import UserAvatar from './UserAvatar';
import ChangePasswordDialog from './ChangePasswordDialog';

interface OrderRow {
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_proof: string | null;
}

const itemClass =
  'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none';

export default function UserMenu() {
  const { user, logout, syncing } = useAuth();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0); // pesanan transfer yang belum ada bukti pembayarannya
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Hitung pesanan yang menunggu pembayaran: saat tampil, saat menu dibuka/ditutup,
  // dan saat ada perubahan pesanan di halaman lain (event "orders:changed")
  useEffect(() => {
    let ignore = false;
    const load = () =>
      api
        .get<OrderRow[]>('/orders')
        .then((res) => {
          if (!ignore) setPendingCount(res.data.filter(needsPayment).length);
        })
        .catch(() => {
          /* gagal memuat: penanda tidak ditampilkan */
        });

    load();
    window.addEventListener('orders:changed', load);
    return () => {
      ignore = true;
      window.removeEventListener('orders:changed', load);
    };
  }, [open]);

  // Tutup dropdown saat klik di luar atau menekan Esc
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const missing = missingFields(user);
  const incomplete = !syncing && missing.length > 0; // jangan tampilkan titik berdasarkan data lama
  const hasPending = pendingCount > 0;
  const showDot = incomplete || hasPending;

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu akun"
        className="relative flex h-10 w-10 items-center justify-center rounded-full transition-shadow hover:ring-2 hover:ring-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <UserAvatar user={user} className="h-9 w-9" />
        {showDot && (
          <>
            <span aria-hidden="true" className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
            <span className="sr-only">
              {[incomplete && 'Profil belum lengkap', hasPending && 'Ada pesanan menunggu pembayaran']
                .filter(Boolean)
                .join('. ')}
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Menu akun"
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          <div className="px-3 pb-2 pt-2">
            <p className="truncate text-sm font-bold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-slate-100" />

          <Link to="/orders" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <span className="flex-1">
              Pesanan Saya
              {hasPending && (
                <span className="block text-xs font-normal text-amber-600">
                  {pendingCount} pesanan menunggu pembayaran
                </span>
              )}
            </span>
            {hasPending && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
          </Link>

          <Link to="/profile" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <span className="flex-1">
              Edit Profil
              {incomplete && (
                <span className="block text-xs font-normal text-amber-600">Lengkapi {missing.join(', ')}</span>
              )}
            </span>
            {incomplete && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setPasswordOpen(true);
            }}
            className={itemClass}
          >
            Ganti Password
          </button>

          <div className="my-1 h-px bg-slate-100" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className={`${itemClass} text-rose-600 hover:bg-rose-50 focus-visible:bg-rose-50`}
          >
            Logout
          </button>
        </div>
      )}

      {passwordOpen && <ChangePasswordDialog onClose={() => setPasswordOpen(false)} />}
    </div>
  );
}