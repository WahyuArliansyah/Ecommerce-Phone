import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminHomeRedirect from '../src/components/AdminHomeRedirect';
import RequireRole from './components/RequireRole';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminProductsPage from './pages/admin/AdminProductsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Halaman untuk pengunjung dan user (admin dialihkan ke panel admin) */}
          <Route
            path="/"
            element={
              <AdminHomeRedirect>
                <HomePage />
              </AdminHomeRedirect>
            }
          />
          <Route path="/login" element={<LoginPage />} />

          {/* Halaman admin: hanya role "admin" */}
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<AdminProductsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}