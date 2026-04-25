import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth store
import { useAuthStore } from './store/authStore';

// Views
import SplashView from './views/SplashView';
import LoginView from './views/auth/LoginView';
import RegisterView from './views/auth/RegisterView';
import MapView from './views/learn/MapView';
import LessonView from './views/learn/LessonView';
import ResultView from './views/learn/ResultView';
import ProfileView from './views/ProfileView';
import BottomNav from './components/BottomNav';

// Admin views
import AdminLayout from './views/admin/AdminLayout';
import DashboardView from './views/admin/DashboardView';
import CoursesView from './views/admin/CoursesView';
import ChaptersView from './views/admin/ChaptersView';
import LevelsView from './views/admin/LevelsView';
import ImportView from './views/admin/ImportView';
import UsersView from './views/admin/UsersView';

// ─── Guards ───────────────────────────────────────────────────────────────────
function RequireAuth() {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/masuk" replace />;
  return <Outlet />;
}

function RequireAdmin() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/masuk" replace />;
  if (user.role !== 'admin') return <Navigate to="/belajar" replace />;
  return <Outlet />;
}

function StudentLayout() {
  return (
    <div>
      <Outlet />
      <BottomNav />
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { token, fetchMe } = useAuthStore();

  // Refresh user data on mount
  useEffect(() => {
    if (token) fetchMe();
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface-2)',
            color: 'var(--color-text)',
            border: '1.5px solid var(--color-border)',
            fontFamily: 'var(--font-body)',
            borderRadius: '14px',
          },
          success: { iconTheme: { primary: '#C3F377', secondary: '#1A2D00' } },
          error: { iconTheme: { primary: '#FF6B6B', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* ─── Public ─────────────────────────────────────────── */}
        <Route path="/" element={<SplashView />} />
        <Route path="/masuk" element={<LoginView />} />
        <Route path="/daftar" element={<RegisterView />} />

        {/* ─── Student (auth required) ─────────────────────────── */}
        <Route element={<RequireAuth />}>
          <Route element={<StudentLayout />}>
            <Route path="/belajar" element={<MapView />} />
            <Route path="/profil" element={<ProfileView />} />
          </Route>
          <Route path="/belajar/:levelId" element={<LessonView />} />
          <Route path="/hasil/:levelId" element={<ResultView />} />
        </Route>

        {/* ─── Admin ──────────────────────────────────────────── */}
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardView />} />
            <Route path="kelas" element={<CoursesView />} />
            <Route path="bab" element={<ChaptersView />} />
            <Route path="soal" element={<LevelsView />} />
            <Route path="impor" element={<ImportView />} />
            <Route path="pengguna" element={<UsersView />} />
          </Route>
        </Route>

        {/* ─── Fallback ─────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
