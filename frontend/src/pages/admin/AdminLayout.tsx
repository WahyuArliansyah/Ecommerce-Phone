import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BrandFormDialog from './Brandformdialog';

/*
  Kerangka (layout) semua halaman admin: navbar di atas + isi halaman di bawahnya.
  Halaman admin lain (misalnya daftar produk) tampil di dalam <Outlet />.
*/
export default function AdminLayout() {
    // logout = hapus token & data user. Setelah itu RequireRole otomatis memindahkan ke /login
    const { logout } = useAuth();
    const [brandOpen, setBrandOpen] = useState(false);

    return (
        // Pembungkus seluruh halaman. Font diatur di sini supaya berlaku untuk semua isi di dalamnya
        <div
            className="min-h-[100dvh] bg-[#EEF0EB] text-[#131820]"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
            {/* Navbar: sticky = tetap menempel di atas layar saat halaman di-scroll */}
            <header className="sticky top-0 z-30 bg-[#131820] text-white">
                {/* Lebar dan jarak tepi dibuat sama dengan isi halaman supaya sejajar */}
                <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-5 sm:px-8 lg:px-10">
                    {/* Kiri: ikon + nama toko + label Admin */}
                    <div className="flex items-center gap-2.5">
                        {/* aria-hidden = ikon hanya hiasan, tidak perlu dibacakan screen reader */}
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
                        <span className="text-sm text-[#AEB6C2]">Admin</span>
                    </div>

                    {/* Kanan: tombol keluar.
              cursor-pointer = kursor berubah jadi tangan saat diarahkan ke tombol.
              -mr-3 = menggeser tombol ke kanan agar teksnya sejajar dengan tepi isi halaman */}
                    <div className="-mr-3 flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setBrandOpen(true)}
                            className="h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold text-[#3FB6C1] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3FB6C1]/60"
                        >
                            Brands
                        </button>
                        <button
                            type="button"
                            onClick={logout}
                            className="h-11 cursor-pointer rounded-lg px-3 text-sm font-semibold text-[#AEB6C2] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3FB6C1]/60"
                        >
                            Keluar
                        </button>
                    </div>
                </div>
            </header>

            {/* Di sinilah halaman anak ditampilkan (sesuai route di App.tsx) */}
            <main>
                <Outlet />
            </main>
            {brandOpen && <BrandFormDialog onClose={() => setBrandOpen(false)} />}
        </div>
    );
}