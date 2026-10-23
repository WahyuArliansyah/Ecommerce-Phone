import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', // alamat backend dari .env
});

// Sebelum request dikirim: tempelkan token (kalau ada) ke header Authorization
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Setelah response diterima: kalau 401 (token kedaluwarsa), hapus token lalu arahkan ke login.
// Request login sendiri dikecualikan, supaya pesan "Email atau password salah" tetap tampil.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);