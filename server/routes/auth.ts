import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ message: 'Semua field wajib diisi ya!' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: 'Password minimal 6 karakter.' });
      return;
    }

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      res.status(400).json({ message: 'Email atau username sudah dipakai.' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });

    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '30d' });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (err: any) {
    res.status(500).json({ message: 'Duh, ada error server. Coba lagi ya!' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email dan password wajib diisi!' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Email atau password salah.' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ message: 'Email atau password salah.' });
      return;
    }

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = user.lastActiveDate ? new Date(user.lastActiveDate) : null;
    if (last) {
      last.setHours(0, 0, 0, 0);
      const diff = Math.floor((today.getTime() - last.getTime()) / 86400000);
      if (diff === 1) user.streakDays += 1;
      else if (diff > 1) user.streakDays = 1;
    } else {
      user.streakDays = 1;
    }
    user.lastActiveDate = new Date();
    // Pulihkan hati setiap hari login
    user.hearts = Math.min(5, user.hearts + 1);
    await user.save();

    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '30d' });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ token, user: userWithoutPassword });
  } catch {
    res.status(500).json({ message: 'Ada error server. Coba lagi ya!' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!._id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User tidak ditemukan.' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Ada error server.' });
  }
});

export default router;
