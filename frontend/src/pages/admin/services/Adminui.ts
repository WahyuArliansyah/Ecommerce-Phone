import { useEffect, useRef } from 'react';
import { isAxiosError } from 'axios';

/*
  Token desain admin: Tinta #131820 · Stone #EEF0EB · Abu #5A6472 · Teal #0A7C86
  Teal tua #086872 (teks tautan) · Garis input #8A93A0 · Galat #B42318
*/

export const fieldBase =
  'w-full rounded-lg border border-[#8A93A0] bg-white text-base text-[#131820] outline-none transition-colors placeholder:text-[#6B7480] focus:border-[#0A7C86] focus:ring-[3px] focus:ring-[#0A7C86]/25';
export const fieldClass = `${fieldBase} h-11 px-4`;
export const labelClass = 'mb-1.5 block text-sm font-semibold';

export const btnPrimary =
  'h-11 rounded-lg bg-[#0A7C86] px-5 text-sm font-bold text-white transition-colors hover:bg-[#086872] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
export const btnSecondary =
  'h-11 rounded-lg border border-[#8A93A0] bg-white px-5 text-sm font-semibold transition-colors hover:bg-[#EEF0EB] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50 disabled:cursor-not-allowed disabled:opacity-60';
export const btnDanger =
  'h-11 rounded-lg bg-[#B42318] px-5 text-sm font-bold text-white transition-colors hover:bg-[#8F1C13] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#B42318]/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

// Tombol teks kecil di baris daftar
export const rowBtn =
  'h-11 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#0A7C86]/50 md:h-9';
export const rowBtnNormal = `${rowBtn} text-[#086872] hover:bg-[#EEF0EB]`;
export const rowBtnDanger = `${rowBtn} text-[#B42318] hover:bg-[#B42318]/10`;

export const alertClass = 'rounded-lg border border-[#B42318]/30 bg-[#B42318]/10 px-4 py-3 text-sm text-[#B42318]';

// <dialog> native: lebar maksimum ditambahkan per dialog
export const dialogClass =
  'm-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border border-[#D5D9D2] bg-white p-0 text-[#131820] backdrop:bg-[#131820]/60';

export const formatRupiah = (val?: number | string | null) =>
  val
    ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val))
    : '—';

// Ambil pesan dari backend ({ message }), atau pakai pesan cadangan
export const errorMessage = (err: unknown, fallback: string) =>
  isAxiosError(err) ? (err.response?.data?.message ?? fallback) : 'Terjadi kesalahan. Coba lagi.';

// Membuka <dialog> sebagai modal begitu komponen tampil: focus terkunci, Esc menutup, latar tidak bisa diklik
export function useShowModal() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return ref;
}