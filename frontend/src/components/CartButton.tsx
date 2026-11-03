import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface CartLine {
  quantity?: number;
}

export default function CartButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    const load = () =>
      api
        .get<{ items?: CartLine[] }>('/cart')
        .then((res) => {
          const lines = res.data.items ?? [];
          if (!ignore) setCount(lines.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0));
        })
        .catch(() => {
          /* gagal memuat: badge tidak ditampilkan */
        });
    // panggil fungsi load saat komponen di-mount
    load();
    window.addEventListener('cart:changed', load);
    return () => {
      ignore = true;
      window.removeEventListener('cart:changed', load);
    };
  }, []);

  return (
    <Link
      to="/cart"
      aria-label={count > 0 ? `Keranjang, ${count} barang` : 'Keranjang'}
      title="Keranjang"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold leading-none text-white"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}