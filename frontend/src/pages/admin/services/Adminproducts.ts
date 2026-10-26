import { api } from '../../../services/api';

export interface Brand {
  id: number;
  name: string;
}

export interface Variant {
  id: number;
  storage: string;
  color: string;
  price: number | string; // kolom DECIMAL dari MySQL bisa datang sebagai string
  stock: number;
}

export interface ProductDetail {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  brand_id: number;
  brand: string;
  variants: Variant[];
}

export interface ProductFields {
  brand_id: number;
  name: string;
  description: string;
  image_url: string;
}

export interface VariantFields {
  storage: string;
  color: string;
  price: number;
  stock: number;
}

// Skema backend memakai z.string().optional(): nilai kosong harus DIHILANGKAN, bukan dikirim null.
const blankToUndefined = (s: string) => s.trim() || undefined;

const toProductBody = (f: ProductFields) => ({
  brand_id: f.brand_id,
  name: f.name.trim(),
  description: blankToUndefined(f.description),
  image_url: blankToUndefined(f.image_url),
});

const toVariantBody = (v: VariantFields) => ({
  storage: v.storage.trim(),
  color: v.color.trim(),
  price: v.price,
  stock: v.stock,
});

/*
  ASUMSI: file route brands tidak ada di berkas yang saya terima.
  Fungsi ini memakai GET /brands dan menerima dua bentuk respons:
  [{ id, name }] atau { data: [{ id, name }] }. Sesuaikan di sini kalau berbeda.
*/
export async function getBrands(): Promise<Brand[]> {
  const res = await api.get<Brand[] | { data: Brand[] }>('/brands');
  return Array.isArray(res.data) ? res.data : (res.data.data ?? []);
}

// Upload image saat tambah produk
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('image', file); // nama 'image' harus sama dengan .single('image') di backend
  const res = await api.post<{ url: string }>('/uploads/product-image', form);
  return res.data.url;
}

export async function getProductDetail(id: number): Promise<ProductDetail> {
  const res = await api.get<ProductDetail>(`/products/${id}`);
  return res.data;
}

// Produk
export const createProduct = (fields: ProductFields, variants: VariantFields[]) =>
  api.post('/products', { ...toProductBody(fields), variants: variants.map(toVariantBody) });

export const updateProduct = (id: number, fields: ProductFields) => api.put(`/products/${id}`, toProductBody(fields));

export const deleteProduct = (id: number) => api.delete(`/products/${id}`);

// Varian
export const addVariant = (productId: number, v: VariantFields) =>
  api.post(`/products/${productId}/variants`, toVariantBody(v));

export const updateVariant = (productId: number, variantId: number, v: VariantFields) =>
  api.put(`/products/${productId}/variants/${variantId}`, toVariantBody(v));

export const deleteVariant = (productId: number, variantId: number) =>
  api.delete(`/products/${productId}/variants/${variantId}`);