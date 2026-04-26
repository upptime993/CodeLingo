import { Router } from 'express';
import Course from '../models/Course.js';
import Chapter from '../models/Chapter.js';
import Level from '../models/Level.js';
import Progress from '../models/Progress.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
// ── GET /api/courses ─────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
    try {
        const courses = await Course.find({ isPublished: true }).sort({ order: 1 });
        // Hitung jumlah bab dan level per kelas
        const enriched = await Promise.all(courses.map(async (c) => {
            const chapters = await Chapter.find({ courseId: c._id });
            const chapterIds = chapters.map((ch) => ch._id);
            const levelsCount = await Level.countDocuments({ chapterId: { $in: chapterIds } });
            return { ...c.toObject(), chaptersCount: chapters.length, levelsCount };
        }));
        res.json(enriched);
    }
    catch {
        res.status(500).json({ message: 'Gagal ambil data kelas.' });
    }
});
// ── GET /api/courses/:slug/chapters ─────────────────────────────────────────
// Butuh auth untuk menampilkan progress user
// @ts-ignore
router.get('/:slug/chapters', requireAuth, async (req, res) => {
    try {
        const course = await Course.findOne({ slug: req.params.slug });
        if (!course) {
            res.status(404).json({ message: 'Kelas tidak ditemukan.' });
            return;
        }
        const chapters = await Chapter.find({ courseId: course._id }).sort({ orderIndex: 1 });
        // Ambil semua level untuk kelas ini
        const chapterIds = chapters.map((c) => c._id);
        const allLevels = await Level.find({ chapterId: { $in: chapterIds } })
            .select('_id chapterId title type orderIndex xpReward')
            .sort({ orderIndex: 1 });
        // Ambil progress user
        const levelIds = allLevels.map((l) => l._id);
        const progressList = await Progress.find({
            userId: req.user._id,
            levelId: { $in: levelIds },
        });
        const completedSet = new Set(progressList.map((p) => p.levelId.toString()));
        // Hitung status per level (locked/unlocked/completed)
        // Logic: level pertama dari bab pertama selalu unlocked
        //        level N unlocked kalau level N-1 completed
        //        bab N unlocked kalau semua level bab N-1 completed
        let previousChapterCompleted = true;
        const chaptersWithProgress = chapters.map((ch) => {
            const levels = allLevels
                .filter((l) => l.chapterId.toString() === ch._id.toString())
                .sort((a, b) => a.orderIndex - b.orderIndex);
            let previousLevelCompleted = previousChapterCompleted;
            const levelsWithStatus = levels.map((level) => {
                const isCompleted = completedSet.has(level._id.toString());
                let status;
                if (isCompleted) {
                    status = 'completed';
                }
                else if (previousLevelCompleted) {
                    status = 'unlocked';
                }
                else {
                    status = 'locked';
                }
                previousLevelCompleted = isCompleted;
                return { ...level.toObject(), status };
            });
            // Bab ini dianggap selesai kalau semua level-nya selesai
            const allCompleted = levels.every((l) => completedSet.has(l._id.toString()));
            previousChapterCompleted = allCompleted;
            return {
                ...ch.toObject(),
                levels: levelsWithStatus,
                completedCount: levels.filter((l) => completedSet.has(l._id.toString())).length,
                totalCount: levels.length,
            };
        });
        res.json({ course, chapters: chaptersWithProgress });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal ambil data bab.' });
    }
});
// ── GET /api/courses/levels/:id ───────────────────────────────────────────────
// @ts-ignore
router.get('/levels/:id', requireAuth, async (req, res) => {
    try {
        const level = await Level.findById(req.params.id);
        if (!level) {
            res.status(404).json({ message: 'Level tidak ditemukan.' });
            return;
        }
        res.json(level);
    }
    catch {
        res.status(500).json({ message: 'Gagal ambil data level.' });
    }
});
// ── GET /api/courses/leaderboard ─────────────────────────────────────────────
router.get('/leaderboard/top', async (_req, res) => {
    try {
        const User = (await import('../models/User.js')).default;
        const users = await User.find({ role: 'student' })
            .sort({ totalXp: -1 })
            .limit(20)
            .select('username avatar totalXp streakDays');
        res.json(users.map((u, i) => ({ ...u.toObject(), rank: i + 1 })));
    }
    catch {
        res.status(500).json({ message: 'Gagal ambil leaderboard.' });
    }
});
export default router;
