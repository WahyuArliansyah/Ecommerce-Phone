import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  getProductDetail,
  uploadImage,
  type Brand,
  type ProductFields,
  type VariantFields,
} from '../admin/services/Adminproducts';
import {
  alertClass,
  btnPrimary,
  btnSecondary,
  dialogClass,
  errorMessage,
  fieldBase,
  fieldClass,
  labelClass,
  useShowModal,
} from './services/Adminui';


interface VariantRow {
  key: number;
  storage: string;
  color: string;
  price: string;
  stock: string;
}

let rowCounter = 0;
const newRow = (): VariantRow => ({ key: ++rowCounter, storage: '', color: '', price: '', stock: '' });
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

interface Props {
  productId: number | null; // null = tambah produk baru, angka = ubah produk itu
  brands: Brand[];
  onSubmit: (fields: ProductFields, variants: VariantFields[]) => Promise<void>; // melempar error kalau gagal
  onClose: () => void;
}

export default function ProductFormDialog({ productId, brands, onSubmit, onClose }: Props) {
  const dialogRef = useShowModal();
  const isEdit = productId !== null;

  const [brandId, setBrandId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  // file yang baru dipilih, belum diunggah
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<VariantRow[]>(() => [newRow()]);

  const [loadingDetail, setLoadingDetail] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Pratinjau gambar yang baru dipilih, dibersihkan otomatis agar tidak boros memori
  const preview = useMemo(() => (imageFile ? URL.createObjectURL(imageFile) : ''), [imageFile]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Dijalankan saat admin memilih file: cek format dan ukuran dulu
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError('Format gambar harus JPG, PNG, atau WEBP.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Ukuran gambar maksimal 2 MB.');
      e.target.value = '';
      return;
    }
    setImageError('');
    setImageFile(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl('');
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  // Mode ubah: ambil detail produk (daftar produk tidak memuat deskripsi dan brand_id)
  useEffect(() => {
    if (productId === null) return;
    let ignore = false;
    getProductDetail(productId)
      .then((d) => {
        if (ignore) return;
        setBrandId(String(d.brand_id));
        setName(d.name);
        setDescription(d.description ?? '');
        setImageUrl(d.image_url ?? '');
        setLoadingDetail(false);
      })
      .catch((err) => {
        if (ignore) return;
        setLoadError(errorMessage(err, 'Tidak dapat memuat data produk.'));
        setLoadingDetail(false);
      });
    return () => {
      ignore = true;
    };
  }, [productId]);

  const updateRow = (key: number, patch: Partial<VariantRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      // Kalau admin memilih file baru, unggah dulu untuk mendapatkan URL-nya
      let finalUrl = imageUrl;
      if (imageFile) {
        finalUrl = await uploadImage(imageFile);
        setImageUrl(finalUrl); // disimpan agar kalau simpan produk gagal lalu dicoba lagi, tidak upload ulang
        setImageFile(null);
      }
      await onSubmit(
        { brand_id: Number(brandId), name, description, image_url: finalUrl },
        isEdit
          ? []
          : rows.map((r) => ({
            storage: r.storage,
            color: r.color,
            price: Number(r.price),
            stock: Number(r.stock),
          })),
      );
    } catch (err) {
      console.error(err);
      setError(errorMessage(err, 'Tidak dapat menyimpan produk. Periksa koneksi internet, lalu coba lagi.'));
      setSaving(false);
    }
  };

  const showForm = !loadingDetail && !loadError;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(e) => {
        if (saving) e.preventDefault();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      aria-labelledby="product-dialog-title"
      className={`${dialogClass} max-w-[560px]`}
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 id="product-dialog-title" className="text-xl font-extrabold tracking-[-0.02em]">
          {isEdit ? 'Ubah produk' : 'Tambah produk'}
        </h2>

        {loadingDetail && <p className="mt-4 text-base text-[#5A6472]">Memuat data produk…</p>}

        {loadError && (
          <div role="alert" className={`mt-4 ${alertClass}`}>
            {loadError}
          </div>
        )}

        {showForm && (
          <>
            {error && (
              <div role="alert" className={`mt-4 ${alertClass}`}>
                {error}
              </div>
            )}
            {brands.length === 0 && (
              <div role="alert" className={`mt-4 ${alertClass}`}>
                Daftar brand tidak dapat dimuat, jadi produk belum bisa disimpan.
              </div>
            )}

            <div className="mt-5 space-y-5">
              <div>
                <label htmlFor="pf-name" className={labelClass}>
                  Nama produk
                </label>
                <input
                  id="pf-name"
                  required
                  maxLength={150}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="iPhone 15 Pro Max"
                  className={fieldClass}
                />
              </div>

              <div>
                <label htmlFor="pf-brand" className={labelClass}>
                  Brand
                </label>
                <select
                  id="pf-brand"
                  required
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Pilih brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Image Fiel */}
              <div>
                <label htmlFor="pf-image" className={labelClass}>
                  Gambar produk (opsional)
                </label>

                {(preview || imageUrl) && (
                  <div className="mb-3 flex items-center gap-3">
                    <img
                      src={preview || imageUrl}
                      alt="Pratinjau gambar produk"
                      className="h-20 w-20 rounded-lg border border-[#D5D9D2] bg-[#EEF0EB] object-contain"
                    />
                    <button type="button" onClick={removeImage} disabled={saving} className={btnSecondary}>
                      Hapus gambar
                    </button>
                  </div>
                )}

                <input
                  id="pf-image"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFile}
                  aria-describedby="pf-image-hint"
                  className={`${fieldBase} cursor-pointer px-3 py-2 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-[#131820] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white`}
                />
                <p id="pf-image-hint" className="mt-1.5 text-sm text-[#5A6472]">
                  JPG, PNG, atau WEBP, maksimal 2 MB.
                </p>
                {imageError && (
                  <p role="alert" className="mt-1.5 text-sm font-semibold text-[#B42318]">
                    {imageError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="pf-desc" className={labelClass}>
                  Deskripsi (opsional)
                </label>
                <textarea
                  id="pf-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${fieldBase} min-h-24 resize-y px-4 py-3`}
                />
              </div>

              {isEdit ? (
                <p className="text-sm text-[#5A6472]">
                  Harga dan stok diatur per varian. Gunakan tombol Varian di daftar produk.
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-semibold">Varian (minimal satu)</p>
                  {rows.map((r, i) => (
                    <fieldset key={r.key} className="rounded-lg border border-[#D5D9D2] p-4">
                      <legend className="px-1 text-sm font-semibold text-[#5A6472]">Varian {i + 1}</legend>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor={`pf-v${r.key}-storage`} className={labelClass}>
                            Storage
                          </label>
                          <input
                            id={`pf-v${r.key}-storage`}
                            required
                            value={r.storage}
                            onChange={(e) => updateRow(r.key, { storage: e.target.value })}
                            placeholder="256GB"
                            className={fieldClass}
                          />
                        </div>
                        <div>
                          <label htmlFor={`pf-v${r.key}-color`} className={labelClass}>
                            Warna
                          </label>
                          <input
                            id={`pf-v${r.key}-color`}
                            required
                            value={r.color}
                            onChange={(e) => updateRow(r.key, { color: e.target.value })}
                            placeholder="Titanium Hitam"
                            className={fieldClass}
                          />
                        </div>
                        <div>
                          <label htmlFor={`pf-v${r.key}-price`} className={labelClass}>
                            Harga
                          </label>
                          <div className="relative">
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-base text-[#5A6472]"
                            >
                              Rp
                            </span>
                            <input
                              id={`pf-v${r.key}-price`}
                              type="number"
                              inputMode="numeric"
                              required
                              min={1}
                              step={1}
                              value={r.price}
                              onChange={(e) => updateRow(r.key, { price: e.target.value })}
                              className={`${fieldBase} h-11 pl-11 pr-4`}
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor={`pf-v${r.key}-stock`} className={labelClass}>
                            Stok (unit)
                          </label>
                          <input
                            id={`pf-v${r.key}-stock`}
                            type="number"
                            inputMode="numeric"
                            required
                            min={0}
                            step={1}
                            value={r.stock}
                            onChange={(e) => updateRow(r.key, { stock: e.target.value })}
                            className={fieldClass}
                          />
                        </div>
                      </div>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                          className="mt-3 h-11 rounded-lg px-3 text-sm font-semibold text-[#B42318] transition-colors hover:bg-[#B42318]/10 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[#B42318]/40"
                        >
                          Hapus varian {i + 1}
                        </button>
                      )}
                    </fieldset>
                  ))}
                  <button type="button" onClick={() => setRows((rs) => [...rs, newRow()])} className={btnSecondary}>
                    Tambah varian
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={saving} className={btnSecondary}>
            {showForm ? 'Batal' : 'Tutup'}
          </button>
          {showForm && (
            <button type="submit" disabled={saving || brands.length === 0} className={btnPrimary}>
              {saving ? 'Menyimpan…' : isEdit ? 'Simpan perubahan' : 'Tambah produk'}
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}