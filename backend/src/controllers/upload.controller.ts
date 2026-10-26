import { Request, Response } from 'express';

export function uploadImage(req: Request, res: Response) {
  // req.file diisi oleh multer. Kalau kosong, berarti tidak ada file yang valid
  if (!req.file) {
    return res.status(400).json({ message: 'File gambar wajib diisi (JPG, PNG, atau WEBP)' });
  }

  // URL harus lengkap (http://...) karena frontend dan backend jalan di alamat berbeda
  const base = process.env.PUBLIC_URL ?? `${req.protocol}://${req.get('host')}`;
  res.status(201).json({ url: `${base}/uploads/products/${req.file.filename}` });
}