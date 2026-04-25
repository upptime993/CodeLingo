import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Chapter from '../models/Chapter.js';
import Level from '../models/Level.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';
import type { ImportPayload } from '../../src/types/index.js';

const router = Router();

// Semua route di sini butuh role admin
router.use(requireAdmin);

// ── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', async (_req, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [totalUsers, totalCourses, totalLevels, completionsToday] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Course.countDocuments(),
      Level.countDocuments(),
      Progress.countDocuments({ completedAt: { $gte: today } }),
    ]);
    res.json({ totalUsers, totalCourses, totalLevels, completionsToday });
  } catch {
    res.status(500).json({ message: 'Gagal ambil statistik.' });
  }
});

// ── COURSES CRUD ──────────────────────────────────────────────────────────────
router.get('/courses', async (_req, res) => {
  const courses = await Course.find().sort({ order: 1 });
  res.json(courses);
});

router.post('/courses', async (req, res: Response) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (err: unknown) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Gagal membuat kelas.' });
  }
});

router.put('/courses/:id', async (req, res: Response) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!course) { res.status(404).json({ message: 'Kelas tidak ditemukan.' }); return; }
    res.json(course);
  } catch (err: unknown) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Gagal memperbarui kelas.' });
  }
});

router.delete('/courses/:id', async (req, res: Response) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    // Cascade delete chapters & levels
    const chapters = await Chapter.find({ courseId: req.params.id });
    const chapterIds = chapters.map(c => c._id);
    await Level.deleteMany({ chapterId: { $in: chapterIds } });
    await Chapter.deleteMany({ courseId: req.params.id });
    res.json({ message: 'Kelas berhasil dihapus.' });
  } catch {
    res.status(500).json({ message: 'Gagal hapus kelas.' });
  }
});

// ── CHAPTERS CRUD ─────────────────────────────────────────────────────────────
router.get('/chapters', async (req, res: Response) => {
  const courseId = req.query.courseId as string | undefined;
  const filter = courseId ? { courseId } : {};
  const chapters = await Chapter.find(filter).sort({ orderIndex: 1 });
  res.json(chapters);
});

router.post('/chapters', async (req, res: Response) => {
  try {
    const chapter = await Chapter.create(req.body);
    res.status(201).json(chapter);
  } catch (err: unknown) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Gagal membuat bab.' });
  }
});

router.put('/chapters/:id', async (req, res: Response) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!chapter) { res.status(404).json({ message: 'Bab tidak ditemukan.' }); return; }
    res.json(chapter);
  } catch (err: unknown) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Gagal memperbarui bab.' });
  }
});

router.delete('/chapters/:id', async (req, res: Response) => {
  try {
    await Level.deleteMany({ chapterId: req.params.id });
    await Chapter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bab berhasil dihapus.' });
  } catch {
    res.status(500).json({ message: 'Gagal hapus bab.' });
  }
});

// ── LEVELS CRUD ───────────────────────────────────────────────────────────────
router.get('/levels', async (req, res: Response) => {
  const chapterId = req.query.chapterId as string | undefined;
  const filter = chapterId ? { chapterId } : {};
  const levels = await Level.find(filter).sort({ orderIndex: 1 });
  res.json(levels);
});

router.post('/levels', async (req, res: Response) => {
  try {
    const level = await Level.create(req.body);
    res.status(201).json(level);
  } catch (err: unknown) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Gagal membuat level.' });
  }
});

router.put('/levels/:id', async (req, res: Response) => {
  try {
    const level = await Level.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!level) { res.status(404).json({ message: 'Level tidak ditemukan.' }); return; }
    res.json(level);
  } catch (err: unknown) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Gagal memperbarui level.' });
  }
});

router.delete('/levels/:id', async (req, res: Response) => {
  try {
    await Level.findByIdAndDelete(req.params.id);
    res.json({ message: 'Level berhasil dihapus.' });
  } catch {
    res.status(500).json({ message: 'Gagal hapus level.' });
  }
});

// ── USERS ─────────────────────────────────────────────────────────────────────
router.get('/users', async (_req, res: Response) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

router.put('/users/:id', async (req, res: Response) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) { res.status(404).json({ message: 'User tidak ditemukan.' }); return; }
    res.json(user);
  } catch (err: unknown) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Gagal memperbarui user.' });
  }
});

// ── JSON IMPORT ───────────────────────────────────────────────────────────────
router.post('/import', async (req, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const payload: ImportPayload = req.body;

    if (!payload.course || !payload.chapters) {
      res.status(400).json({ message: 'Format JSON tidak valid. Butuh "course" dan "chapters".' });
      return;
    }

    // Upsert course berdasarkan slug
    const course = await Course.findOneAndUpdate(
      { slug: payload.course.slug },
      { ...payload.course },
      { upsert: true, new: true, session }
    );

    let totalLevels = 0;
    let totalQuestions = 0;

    for (let ci = 0; ci < payload.chapters.length; ci++) {
      const chData = payload.chapters[ci];

      // Hitung orderIndex bab
      const existingCount = await Chapter.countDocuments({ courseId: course._id });
      const chapter = await Chapter.findOneAndUpdate(
        { courseId: course._id, title: chData.title },
        { courseId: course._id, title: chData.title, description: chData.description || '', orderIndex: ci },
        { upsert: true, new: true, session }
      );

      for (let li = 0; li < (chData.levels || []).length; li++) {
        const lvData = chData.levels[li];
        await Level.findOneAndUpdate(
          { chapterId: chapter._id, title: lvData.title },
          {
            chapterId: chapter._id,
            title: lvData.title,
            type: lvData.type,
            orderIndex: li,
            xpReward: lvData.xpReward ?? (lvData.type === 'exercise' ? 50 : 10),
            theory: lvData.theory || undefined,
            questions: lvData.questions?.map(q => ({
              ...q,
              xpReward: q.xpReward ?? 10,
            })) || [],
          },
          { upsert: true, new: true, session }
        );
        totalLevels++;
        totalQuestions += lvData.questions?.length || 0;
      }
    }

    await session.commitTransaction();
    res.json({
      message: `Berhasil impor ${payload.chapters.length} bab, ${totalLevels} level, dan ${totalQuestions} soal!`,
      courseId: course._id,
    });
  } catch (err: unknown) {
    await session.abortTransaction();
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ message: `Gagal impor: ${message}` });
  } finally {
    session.endSession();
  }
});

export default router;
