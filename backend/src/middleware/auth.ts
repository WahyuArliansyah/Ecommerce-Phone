import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: 'customer' | 'admin' };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  try {
    const payload = jwt.verify(
      header.split(' ')[1],
      process.env.JWT_SECRET as string
    ) as { id: number; role: 'customer' | 'admin' };
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Hanya admin yang boleh mengakses' });
  }
  next();
}