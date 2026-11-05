import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/*
  Kerangka halaman autentikasi (daftar / masuk): panel gelap bermerek di kiri (jadi latar blur di HP),
  dan kartu form di kanan. Isi kartu dikirim lewat children.
*/
export default function AuthShell({ children }: { children: ReactNode }) {
    return (
        <div
            className="relative flex min-h-[100dvh] flex-col overflow-x-clip bg-[#131820] lg:grid lg:grid-cols-[5fr_6fr]"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
            {/* Bar atas: tombol kembali + logo */}
            <header className="login-fade relative z-20 flex items-center gap-3 px-5 pt-4 text-white sm:px-8 lg:fixed lg:left-5 lg:top-10 lg:px-0 lg:pt-0">
                <Link
                    to="/"
                    aria-label="Kembali ke beranda"
                    className="-ml-2 flex h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#3FB6C1]/60"
                >
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Kembali
                </Link>

                <span aria-hidden="true" className="h-5 w-px bg-white/25" />

                <div className="flex items-center gap-2.5">
                    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3FB6C1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="3" />
                        <line x1="10" y1="18" x2="14" y2="18" />
                    </svg>
                    <span className="text-lg font-extrabold tracking-[-0.02em]">ArliPhone</span>
                </div>
            </header>

            {/* Panel merek: latar blur di HP, kolom kiri di desktop */}
            <aside className="absolute inset-0 overflow-hidden text-white lg:sticky lg:inset-auto lg:top-0 lg:h-[100dvh] lg:self-start lg:px-12 lg:py-10">
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(31,154,165,0.28),transparent_65%)] lg:hidden"
                />
                <div aria-hidden="true" className="login-settle absolute inset-0 blur-[3px] lg:blur-none">
                    <p
                        className="login-slide relative z-10 hidden max-w-[12ch] text-[44px] font-extrabold leading-[1.05] tracking-[-0.035em] lg:ml-5 lg:mt-[108px] lg:block xl:text-5xl"
                        style={{ animationDelay: '200ms' }}
                    >
                        Temukan ponsel berikutnya.
                    </p>

                    <svg
                        viewBox="0 0 240 480"
                        fill="none"
                        className="login-phone pointer-events-none absolute left-1/2 top-[14%] w-64 -translate-x-1/2 opacity-70 sm:w-72 lg:-bottom-36 lg:left-12 lg:top-auto lg:w-60 lg:translate-x-0 lg:opacity-100"
                    >
                        <rect x="2" y="2" width="236" height="476" rx="40" stroke="#1F9AA5" strokeWidth="3" />
                        <rect x="86" y="16" width="68" height="18" rx="9" fill="#1F9AA5" fillOpacity="0.35" />
                        <rect x="20" y="56" width="200" height="190" rx="22" fill="#1B2430" />
                        <circle cx="120" cy="151" r="44" stroke="#1F9AA5" strokeWidth="3" />
                        <rect x="20" y="266" width="130" height="12" rx="6" fill="#2B3646" />
                        <rect x="20" y="290" width="80" height="12" rx="6" fill="#2B3646" />
                        <rect x="20" y="326" width="200" height="48" rx="14" fill="#0A7C86" />
                    </svg>
                </div>
            </aside>

            {/* Sisi form */}
            <main className="relative z-10 flex flex-1 flex-col px-5 py-8 sm:px-12 lg:bg-[#EEF0EB] lg:px-16 lg:py-10">
                <div className="mx-auto my-auto w-full max-w-[400px]">
                    <p
                        className="login-rise mb-5 max-w-[14ch] text-[32px] font-extrabold leading-[1.05] tracking-[-0.035em] text-white lg:hidden"
                        style={{ animationDelay: '200ms' }}
                    >
                        Temukan ponsel berikutnya.
                    </p>

                    <div
                        className="login-rise rounded-2xl bg-[#EEF0EB]/95 p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.55)] ring-1 ring-white/20 sm:p-8 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none lg:ring-0"
                        style={{ animationDelay: '380ms' }}
                    >
                        {children}
                    </div>
                </div>

                <p className="mx-auto mt-8 w-full max-w-[400px] text-xs text-white/60 lg:mt-12 lg:text-[#5A6472]">
                    © 2026 ArliPhone. Hak cipta dilindungi.
                </p>
            </main>
        </div>
    );
}