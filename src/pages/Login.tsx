import { useState, type CSSProperties, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === 'signup') {
      setNotice('Cuenta creada. Revisa tu correo para confirmar el acceso.');
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#FFFFFF',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ font: '700 26px Outfit, sans-serif', letterSpacing: '-0.02em', color: '#0F1729' }}>
            Fin<span style={{ color: '#0F4CD9' }}>IAN</span>zas
          </span>
          <span style={{ font: '400 14px Outfit, sans-serif', color: '#6B7787' }}>
            {mode === 'signin' ? 'Entra para ver tu cierre' : 'Crea tu cuenta'}
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: '500 13px Outfit, sans-serif', color: '#0F1729' }}>Correo</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ font: '500 13px Outfit, sans-serif', color: '#0F1729' }}>Contraseña</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </label>

          {error && <span style={{ font: '400 13px Outfit, sans-serif', color: '#C23A2B' }}>{error}</span>}
          {notice && <span style={{ font: '400 13px Outfit, sans-serif', color: '#0F7A58' }}>{notice}</span>}

          <button type="submit" disabled={busy} className="btn btn-primary" style={{ marginTop: 6, padding: '13px 18px' }}>
            {busy ? 'Un momento…' : mode === 'signin' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
            setNotice(null);
          }}
          style={{
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            font: '400 13px Outfit, sans-serif',
            color: '#6B7787',
          }}
        >
          {mode === 'signin' ? '¿No tienes cuenta? Créala' : '¿Ya tienes cuenta? Entra'}
        </button>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  border: '1.5px solid #DDE4EE',
  borderRadius: 14,
  padding: '12px 16px',
  font: '400 15px Outfit, sans-serif',
  outline: 'none',
};
