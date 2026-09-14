import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
