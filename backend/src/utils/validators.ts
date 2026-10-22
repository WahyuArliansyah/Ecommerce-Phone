import { z } from 'zod';

// Aturan alamat yang dipakai bersama (profil & checkout)
export const addressSchema = z
  .string()
  .trim()
  .min(10, 'Alamat minimal 10 karakter')
  .max(255, 'Alamat maksimal 255 karakter')
  .regex(
    /^[\p{L}\p{N} .,\-/#()\n]+$/u,
    'Alamat mengandung karakter yang tidak diperbolehkan'
  );