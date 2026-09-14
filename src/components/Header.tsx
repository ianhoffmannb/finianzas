import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCierre } from '../contexts/CierreContext';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  to: string;
  label: string;
  hint: string;
}

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Mes en curso',
    items: [
      { to: '/', label: 'Inicio', hint: 'patrimonio y flujo' },
      { to: '/mes', label: 'Mes', hint: 'presupuesto y cierre' },
      { to: '/estados', label: 'Estados financieros', hint: 'resultado y balance' },
    ],
  },
  {
    title: 'Largo plazo',
    items: [
      { to: '/metas', label: 'Metas', hint: '1, 3, 5 y 10 años' },
      { to: '/proyecciones', label: 'Proyecciones', hint: 'tres escenarios a 2031' },
      { to: '/cuentas', label: 'Cuentas', hint: 'todas tus cuentas' },
    ],
  },
  {
    title: 'Plata que no es mía',
    items: [{ to: '/hogar', label: 'Hogar', hint: 'gastos de la casa' }],
  },
];

const ALL_ITEMS = GROUPS.flatMap((g) => g.items);

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cierre = useCierre();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const currentLabel = ALL_ITEMS.find((i) => i.to === window.location.pathname)?.label ?? 'Inicio';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: '#FFFFFFF2',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #EFF3F8',
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '16px 40px',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            borderRadius: 99,
            font: "700 21px Outfit, sans-serif",
            letterSpacing: '-0.02em',
            color: '#0F1729',
          }}
        >
          Fin<span style={{ color: '#0F4CD9' }}>IAN</span>zas
        </button>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              font: "500 14.5px Outfit, sans-serif",
              background: menuOpen ? '#EDF3FE' : '#F4F7FB',
              color: '#0F1729',
              border: 0,
              borderRadius: 99,
              padding: '10px 18px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 14 }}>
              <span style={{ height: 2, background: 'currentColor', borderRadius: 2 }} />
              <span style={{ height: 2, background: 'currentColor', borderRadius: 2 }} />
              <span style={{ height: 2, background: 'currentColor', borderRadius: 2 }} />
            </span>
            <span>{currentLabel}</span>
            <span style={{ font: "500 11px Outfit, sans-serif", opacity: 0.6 }}>▾</span>
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                left: 0,
                width: 296,
                background: '#FFFFFF',
                border: '1px solid #EAEFF5',
                borderRadius: 20,
                boxShadow: '0 18px 44px #0F172914',
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                animation: 'dropIn 0.14s ease-out',
              }}
            >
              {GROUPS.map((group) => (
                <div key={group.title}>
                  <span
                    style={{
                      display: 'block',
                      font: "500 12.5px Outfit, sans-serif",
                      color: '#8C99AA',
                      padding: '8px 14px 6px',
                    }}
                  >
                    {group.title}
                  </span>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={() => setMenuOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        font: `${isActive ? 600 : 400} 15px Outfit, sans-serif`,
                        textAlign: 'left',
                        background: isActive ? '#EDF3FE' : 'transparent',
                        color: isActive ? '#0F4CD9' : '#0F1729',
                        border: 0,
                        borderRadius: 14,
                        padding: '11px 14px',
                        cursor: 'pointer',
                        width: '100%',
                      })}
                    >
                      {item.label}
                      <span style={{ font: "400 12.5px Outfit, sans-serif", color: '#8C99AA' }}>{item.hint}</span>
                    </NavLink>
                  ))}
                </div>
              ))}
              <div style={{ height: 1, background: '#EFF3F8', margin: '8px 6px' }} />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                style={{
                  display: 'flex',
                  font: "400 14px Outfit, sans-serif",
                  color: '#6B7787',
                  background: 'transparent',
                  border: 0,
                  borderRadius: 14,
                  padding: '11px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <NavLink to="/mes" className="btn btn-ghost" style={{ color: '#0F4CD9', borderColor: '#D7E2FA' }}>
          Registrar
        </NavLink>
        <button onClick={cierre.open} className="btn btn-primary">
          Cerrar el mes
        </button>
      </div>
    </header>
  );
}
