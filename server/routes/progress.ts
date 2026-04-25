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

    // Update XP dan hati user
    const xpGained = level.xpReward;
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      {
        $inc: { totalXp: xpGained },
        $set: { lastActiveDate: new Date() },
        ...(heartsUsed > 0 ? { $inc: { hearts: -heartsUsed } } : {}),
      },
      { new: true }
    ).select('-password');

    res.json({ xpGained, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal simpan progress.' });
  }
});

export default router;
