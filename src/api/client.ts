import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// KR-04: Baca token dari Zustand store (single source of truth)
// Menggunakan lazy import untuk menghindari circular dependency
client.interceptors.request.use((config) => {
  // Import secara lazy untuk hindari circular dep
  const { useAuthStore } = require('../store/authStore');
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// BUG-04: Auto-logout 401 sekarang clear Zustand store, bukan hanya localStorage
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Gunakan Zustand logout() agar seluruh persist store juga ikut di-clear
      const { useAuthStore } = require('../store/authStore');
      useAuthStore.getState().logout();
      window.location.href = '/masuk';
    }
    return Promise.reject(err);
  }
);

export default client;
