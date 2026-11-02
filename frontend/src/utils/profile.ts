import { isAxiosError } from 'axios';
import { api } from '../services/api';
import type { User } from '../context/AuthContext';

// Daftar data wajib yang belum diisi (nama, nomor HP, alamat). Foto tidak dihitung.
export function missingFields(u: Pick<User, 'name' | 'phone' | 'address'>): string[] {
  const missing: string[] = [];
  if (!u.name?.trim()) missing.push('nama');
  if (!u.phone?.trim()) missing.push('nomor HP');
  if (!u.address?.trim()) missing.push('alamat');
  return missing;
}

export const isProfileComplete = (u: Pick<User, 'name' | 'phone' | 'address'>) => missingFields(u).length === 0;

// Foto disajikan backend di /uploads/avatars/<nama-file> (di luar prefix /api)
export function avatarUrl(filename?: string | null): string | null {
  if (!filename) return null;
  const origin = (api.defaults.baseURL ?? '').replace(/\/api\/?$/, '');
  return `${origin}/uploads/avatars/${filename}`;
}

export const initialOf = (name: string) => (name.trim().charAt(0) || '?').toUpperCase();

// Ambil pesan error dari backend, atau pakai pesan cadangan
export function apiError(err: unknown, fallback: string): string {
  if (isAxiosError(err)) return err.response?.data?.message ?? fallback;
  return fallback;
}