import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabaseConfigured } from './lib/supabase';
import { AuthProvider } from './contexts/AuthContext';
import { MonthProvider } from './contexts/MonthContext';
import { CierreProvider } from './contexts/CierreContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Inicio } from './pages/Inicio';
import { Mes } from './pages/Mes';
import { Estados } from './pages/Estados';
import { Metas } from './pages/Metas';
import { Proyecciones } from './pages/Proyecciones';
import { Cuentas } from './pages/Cuentas';
import { Hogar } from './pages/Hogar';

export default function App() {
  if (!supabaseConfigured) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
          <span style={{ font: '700 22px Outfit, sans-serif' }}>
            Fin<span style={{ color: '#0F4CD9' }}>IAN</span>zas
          </span>
          <span style={{ font: '600 16px Outfit, sans-serif' }}>Falta conectar la base de datos</span>
          <span style={{ font: '400 14px/1.6 Outfit, sans-serif', color: '#6B7787' }}>
            No están configuradas <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>. En Vercel se agregan en
            Settings → Environment Variables y hay que volver a desplegar; en local van en un archivo <code>.env</code>.
          </span>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <MonthProvider>
                  <CierreProvider>
                    <Layout />
                  </CierreProvider>
                </MonthProvider>
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Inicio />} />
            <Route path="/mes" element={<Mes />} />
            <Route path="/estados" element={<Estados />} />
            <Route path="/metas" element={<Metas />} />
            <Route path="/proyecciones" element={<Proyecciones />} />
            <Route path="/cuentas" element={<Cuentas />} />
            <Route path="/hogar" element={<Hogar />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
