import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string | null;
  address?: string | null;
  avatar?: string | null;
}

interface AuthContextValue {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void; // perbarui sebagian data user (mis. setelah edit profil)
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Baca data user yang tersimpan, supaya tetap login setelah halaman di-refresh
function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('user', JSON.stringify(next));
      } catch {
        /* abaikan jika penyimpanan penuh/diblokir */
      }
      return next;
    });
  }, []);

  // Sinkronkan data user dari server sekali saat aplikasi dibuka (phone, address, avatar bisa sudah berubah)
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    let ignore = false;
    api
      .get<User>('/auth/me')
      .then((res) => {
        if (!ignore) updateUser(res.data);
      })
      .catch(() => {
        /* gagal sinkron tidak perlu logout; pakai data tersimpan */
      });
    return () => {
      ignore = true;
    };
  }, [updateUser]);

  return <AuthContext.Provider value={{ user, login, logout, updateUser }}>{children}</AuthContext.Provider>;
}

// Cara memakainya di halaman mana pun: const { user, login, logout, updateUser } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}