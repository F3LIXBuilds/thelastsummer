import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';

function Shell({ title, children, footer }) {
  return (
    <main className="auth">
      <Link to="/" className="eyebrow">The Last Summer</Link>
      <h1 className="display">{title}</h1>
      {children}
      <div className="auth-foot">{footer}</div>
    </main>
  );
}

function useSubmit(fn) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await fn(Object.fromEntries(new FormData(e.target))); }
    catch (err) { setError([err.message, ...(err.details ?? [])].join(' · ')); }
    finally { setBusy(false); }
  };
  return { error, busy, submit };
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const { state } = useLocation();
  const { error, busy, submit } = useSubmit(async (b) => { await login(b); nav('/home'); });
  return (
    <Shell title="Welcome back" footer={<><Link to="/forgot">Forgot password?</Link> · <Link to="/register">Create account</Link></>}>
      {state?.expired && <p className="notice">Your session expired. Please sign in again.</p>}
      <form onSubmit={submit} className="stack">
        <input className="input" name="email" type="email" placeholder="Email" required autoComplete="email" />
        <input className="input" name="password" type="password" placeholder="Password" required autoComplete="current-password" />
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const { error, busy, submit } = useSubmit(async (b) => { await register(b); nav('/create'); });
  return (
    <Shell title="Create your account" footer={<>Already playing? <Link to="/login">Sign in</Link></>}>
      <form onSubmit={submit} className="stack">
        <input className="input" name="email" type="email" placeholder="Email" required autoComplete="email" />
        <input className="input" name="username" placeholder="Username" required minLength={3} maxLength={20} autoComplete="username" />
        <input className="input" name="password" type="password" placeholder="Password (8+ characters)" required minLength={8} autoComplete="new-password" />
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Creating…' : 'Start playing'}</button>
      </form>
    </Shell>
  );
}

export function Forgot() {
  const [sent, setSent] = useState(false);
  const { error, busy, submit } = useSubmit(async (b) => { await api('/auth/forgot', { method: 'POST', body: b }); setSent(true); });
  return (
    <Shell title="Reset password" footer={<Link to="/login">Back to sign in</Link>}>
      {sent ? <p className="notice">If that email exists, a reset link is on its way. (In development, check the server console.)</p> : (
        <form onSubmit={submit} className="stack">
          <input className="input" name="email" type="email" placeholder="Email" required />
          {error && <p className="error">{error}</p>}
          <button className="btn primary" disabled={busy}>Send reset link</button>
        </form>
      )}
    </Shell>
  );
}

export function Reset() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { error, busy, submit } = useSubmit(async (b) => { await api('/auth/reset', { method: 'POST', body: { token: sp.get('token') ?? '', password: b.password } }); nav('/login'); });
  return (
    <Shell title="Choose a new password">
      <form onSubmit={submit} className="stack">
        <input className="input" name="password" type="password" placeholder="New password (8+ characters)" required minLength={8} />
        {error && <p className="error">{error}</p>}
        <button className="btn primary" disabled={busy}>Save password</button>
      </form>
    </Shell>
  );
}
