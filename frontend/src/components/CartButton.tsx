import { useEffect, useState } from 'react';
import { api } from '../services/api';

interface CartLine {
  quantity?: number;
}

export default function CartButton() {
  const [count, setCount] = useState(0);

  // ⚠ Bentuk respons GET /cart saya tebak (array, atau objek berisi "items"). Akan saya sesuaikan setelah melihat cart.controller.
  useEffect(() => {
    let ignore = false;
    api
      .get<CartLine[] | { items?: CartLine[] }>('/cart')
      .then((res) => {
        const lines = Array.isArray(res.data) ? res.data : (res.data.items ?? []);
        if (!ignore) setCount(lines.reduce((sum, l) => sum + (Number(l.quantity) || 1), 0));
      })
      .catch(() => {
        /* gagal memuat: badge tidak ditampilkan */
      });
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <button
      type="button"
      aria-disabled="true"
      title="Keranjang (segera hadir)"
      aria-label={count > 0 ? `Keranjang, ${count} barang (segera hadir)` : 'Keranjang (segera hadir)'}
      className="relative flex h-10 w-10 cursor-default items-center justify-center rounded-full text-slate-600"
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
    </button>
  );
}