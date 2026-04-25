import jwt from 'jsonwebtoken';
export async function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Akses ditolak. Silakan login dulu ya!' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const payload = jwt.verify(token, secret);
        req.user = { _id: payload.id, role: payload.role };
        next();
    }
    catch {
        res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
    }
}
export async function requireAdmin(req, res, next) {
    await requireAuth(req, res, async () => {
        if (req.user?.role !== 'admin') {
            res.status(403).json({ message: 'Kamu tidak punya akses ke area ini.' });
            return;
        }
        next();
    });
}
