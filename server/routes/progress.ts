import { Router, Response } from 'express';
import Progress from '../models/Progress.js';
import Level from '../models/Level.js';
import User from '../models/User.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';

const router = Router();

// ── POST /api/progress/complete ──────────────────────────────────────────────
router.post('/complete', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { levelId, score, heartsUsed } = req.body;
    if (!levelId) {
      res.status(400).json({ message: 'levelId wajib ada.' });
      return;
    }

    const level = await Level.findById(levelId);
    if (!level) {
      res.status(404).json({ message: 'Level tidak ditemukan.' });
      return;
    }

    // Upsert progress
    await Progress.findOneAndUpdate(
      { userId: req.user!._id, levelId },
      { score: score ?? 100, heartsUsed: heartsUsed ?? 0, completedAt: new Date() },
      { upsert: true, new: true }
    );

    // Update XP dan hati user — BUG-01: gabungkan $inc agar tidak saling menimpa
    const xpGained = level.xpReward;
    const userBefore = await User.findById(req.user!._id);
    const updatedUser = await User.findByIdAndUpdate(
      req.user!._id,
      {
        $inc: {
          totalXp: xpGained,
          ...(heartsUsed > 0 ? { hearts: -heartsUsed } : {}),
        },
        $set: { lastActiveDate: new Date() },
      },
      { new: true }
    ).select('-password');

    // GAP-02: Update streak saat selesai level (bukan hanya saat login)
    if (updatedUser && userBefore) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const last = userBefore.lastActiveDate
        ? new Date(userBefore.lastActiveDate)
        : null;
      if (last) {
        last.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - last.getTime()) / 86400000);
        if (diff === 1) {
          await User.findByIdAndUpdate(req.user!._id, { $inc: { streakDays: 1 } });
          updatedUser.streakDays = (updatedUser.streakDays ?? 0) + 1;
        } else if (diff > 1) {
          await User.findByIdAndUpdate(req.user!._id, { $set: { streakDays: 1 } });
          updatedUser.streakDays = 1;
        }
      } else {
        await User.findByIdAndUpdate(req.user!._id, { $set: { streakDays: 1 } });
        updatedUser.streakDays = 1;
      }
    }

    res.json({ xpGained, user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal simpan progress.' });
  }
});

export default router;
