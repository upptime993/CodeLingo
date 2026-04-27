import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// KR-04: Baca token langsung dari localStorage key 'cl-auth' (Zustand persist key)
// Ini menghindari circular dependency:
//   client.ts → authStore → authApi → client.ts
// Zustand persist menyimpan state sebagai JSON di key 'cl-auth',
// sehingga kita bisa baca token tanpa import store sama sekali.
function getToken(): string | null {
  try {
    const raw = localStorage.getItem('cl-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

// Request interceptor — inject token ke setiap request
client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// BUG-04: Response interceptor — auto-logout saat 401
// Clear localStorage langsung (key 'cl-auth' dan 'cl-game')
// agar Zustand persist store juga ikut ter-reset saat app reload
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cl-auth');
      localStorage.removeItem('cl-game');
      window.location.href = '/masuk';
    }
    return Promise.reject(err);
  }
);

export default client;
