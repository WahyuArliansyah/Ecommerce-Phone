import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import CartButton from './CartButton';
import UserMenu from './UserMenu';

export default function SiteHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-xs backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3.5">
        {/* Logo & Branding Toko */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-100 sm:h-10 sm:w-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={3} strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
              Arli<span className="text-indigo-600">Phone</span>
            </span>
            <span className="hidden text-[10px] font-semibold tracking-wider text-slate-500 uppercase sm:block">
              Official Phone Store
            </span>
          </div>
        </Link>

        {/* Area User / Tombol Login */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user?.role === 'customer' ? (
            <>
              <CartButton />
              <UserMenu />
            </>
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right">
                <p className="max-w-[120px] truncate text-xs font-bold text-slate-900 sm:max-w-none sm:text-sm">{user.name}</p>
                <span className="hidden rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 capitalize sm:inline-block">
                  {user.role}
                </span>
              </div>
              <Link to="/admin" className="rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 sm:px-3 sm:py-1.5">
                Panel admin
              </Link>
              <button
                onClick={logout}
                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100 sm:px-3 sm:py-1.5"
                title="Keluar dari akun"
              >
                Keluar
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95 sm:rounded-xl sm:px-5 sm:py-2 sm:text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Masuk</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}