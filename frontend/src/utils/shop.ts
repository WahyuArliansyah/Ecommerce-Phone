// Format angka ke Rupiah. Harga dari MySQL (DECIMAL) bisa berupa string, jadi dikonversi dulu.
export function formatRupiah(val?: number | string | null): string {
  const n = Number(val);
  if (!val || Number.isNaN(n)) return 'Hubungi Toko';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

// Beri tahu komponen lain (badge keranjang di header) bahwa isi keranjang berubah
export const notifyCartChanged = () => window.dispatchEvent(new Event('cart:changed'));

// Beri tahu menu akun (titik merah "Pesanan Saya") bahwa data pesanan berubah
export const notifyOrdersChanged = () => window.dispatchEvent(new Event('orders:changed'));