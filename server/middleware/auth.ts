import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: string;
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Akses ditolak. Silakan login dulu ya!' });
      return;
    }

    const token = authHeader.split(' ')[1];
    // SEC-01: Jangan gunakan fallback — jika JWT_SECRET tidak diset, server harus gagal dengan jelas
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET tidak diset di environment variables!');
    const payload = jwt.verify(token, secret) as { id: string; role: string };

    req.user = { _id: payload.id, role: payload.role };
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Kamu tidak punya akses ke area ini.' });
      return;
    }
    next();
  });
}
