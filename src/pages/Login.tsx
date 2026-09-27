import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/account';

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (login(email.trim(), password)) {
      navigate(from, { replace: true });
    }
  }

  return (
    <section className="section" style={{ paddingTop: 80, paddingBottom: 100 }}>
      <div className="container" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="eyebrow">Welcome back</span>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 32, margin: '8px 0', color: 'var(--ink)' }}>Sign In</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
            No account yet, or want to test it out?{' '}
            <Link to="/register" style={{ color: 'var(--accent-deep)', fontWeight: 700 }}>
              Create one
            </Link>
            .
          </p>
        </div>
        <form className="surface" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required maxLength={72} minLength={4} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button block type="submit">
            Sign In
          </Button>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 16, textAlign: 'center' }}>
            This is a demo store — create an account first via the Register page, then sign in with those credentials.
          </p>
        </form>
      </div>
    </section>
  );
}
