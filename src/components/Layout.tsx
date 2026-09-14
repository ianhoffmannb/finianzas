import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { CierreWizard } from './cierre/CierreWizard';
import { useCierre } from '../contexts/CierreContext';

export function Layout() {
  const cierre = useCierre();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', minHeight: '100vh', background: '#FFFFFF' }}>
      <Header />
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Outlet />
      </main>
      {cierre.isOpen && <CierreWizard onClose={cierre.close} />}
    </div>
  );
}
