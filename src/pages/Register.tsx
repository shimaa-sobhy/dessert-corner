import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (!EMAIL_RE.test(trimmedEmail)) return;
    if (register(trimmedName, trimmedEmail, password)) {
      navigate('/account', { replace: true });
    }
  }

  return (
    <section className="section" style={{ paddingTop: 80, paddingBottom: 100 }}>
      <div className="container" style={{ maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="eyebrow">Join the list</span>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 32, margin: '8px 0', color: 'var(--ink)' }}>Create Account</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
            Already have one?{' '}
            <Link to="/login" style={{ color: 'var(--accent-deep)', fontWeight: 700 }}>
              Sign in
            </Link>
            .
          </p>
        </div>
        <form className="surface" onSubmit={handleSubmit}>
          <div className="field">
            <label>Full Name</label>
            <input required maxLength={60} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required minLength={4} maxLength={72} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button block type="submit">
            Create Account
          </Button>
        </form>
      </div>
    </section>
  );
}
