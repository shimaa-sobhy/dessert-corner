import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 7 11 7a18.45 18.45 0 0 1-5.06 5.94" />
      <path d="M6.61 6.61A18.45 18.45 0 0 0 1 12s4 8 11 8a10.7 10.7 0 0 0 4.1-.79" />
      <path d="m1 1 22 22" />
    </svg>
  );
}

function PasswordField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      <label>{label}</label>
      <div className="pw-wrap">
        <input type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="new-password" />
        <button type="button" className="pw-toggle" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

export default function Account() {
  const { user, addresses, addAddress, removeAddress, updateProfile, updatePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);
  const [newAddr, setNewAddr] = useState({ label: 'Home', fullName: user?.name ?? '', line1: '', city: '', postalCode: '', phone: '' });

  function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    updateProfile({ name });
  }

  function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newPassword && !confirmPassword) {
      setPwError(null);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    setPwError(null);
    updatePassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
  }

  function handleAddressSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newAddr.line1 || !newAddr.city) return;
    addAddress(newAddr);
    setNewAddr({ label: 'Home', fullName: user?.name ?? '', line1: '', city: '', postalCode: '', phone: '' });
  }

  return (
    <>
      <PageHero title="My Account" subtitle={`Signed in as ${user?.email}`} />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Account' }]} />

          <div style={{ display: 'flex', gap: 14, marginBottom: 36, flexWrap: 'wrap' }}>
            <Button to="/account/orders" variant="outline">
              My Orders
            </Button>
            <Button to="/wishlist" variant="outline">
              My Wishlist
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Sign Out
            </Button>
          </div>

          <div className="account-grid">
            <div className="surface">
              <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, marginBottom: 18, color: 'var(--ink)' }}>Profile</h3>
              <form onSubmit={handleProfileSubmit}>
                <div className="field">
                  <label>Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input value={user?.email ?? ''} disabled />
                </div>
                <Button type="submit" size="sm">
                  Save Changes
                </Button>
              </form>

              <h4 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 16, marginTop: 28, marginBottom: 14, color: 'var(--ink)' }}>Change Password</h4>
              <form onSubmit={handlePasswordSubmit}>
                <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} placeholder="Leave blank to keep current" />
                <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter new password" />
                {pwError ? (
                  <p className="field-error" style={{ margin: 0, marginBottom: 14 }}>
                    {pwError}
                  </p>
                ) : null}
                <Button type="submit" variant="outline" size="sm">
                  Update Password
                </Button>
              </form>
            </div>

            <div>
              <div className="surface" style={{ marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, marginBottom: 18, color: 'var(--ink)' }}>Saved Addresses</h3>
                {addresses.length === 0 ? (
                  <p style={{ color: 'var(--ink-soft)', fontSize: 13.5 }}>No saved addresses yet.</p>
                ) : (
                  <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                    {addresses.map((a) => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid var(--line)', borderRadius: 14, padding: 12, fontSize: 13 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{a.label}</div>
                          <div style={{ color: 'var(--ink-soft)' }}>
                            {a.line1}, {a.city} {a.postalCode}
                          </div>
                        </div>
                        <button type="button" onClick={() => removeAddress(a.id)} style={{ background: 'none', border: 'none', color: '#C4432B', cursor: 'pointer', fontWeight: 700 }}>
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <form onSubmit={handleAddressSubmit} style={{ display: 'grid', gap: 10 }}>
                  <input
                    placeholder="Label (e.g. Home)"
                    value={newAddr.label}
                    onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                    style={{ border: '1.5px solid var(--line)', borderRadius: 12, padding: '10px 14px', fontSize: 13 }}
                  />
                  <input
                    placeholder="Street address"
                    value={newAddr.line1}
                    onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                    style={{ border: '1.5px solid var(--line)', borderRadius: 12, padding: '10px 14px', fontSize: 13 }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <input
                      placeholder="City"
                      value={newAddr.city}
                      onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                      style={{ flex: 1, border: '1.5px solid var(--line)', borderRadius: 12, padding: '10px 14px', fontSize: 13 }}
                    />
                    <input
                      placeholder="Postal code"
                      value={newAddr.postalCode}
                      onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                      style={{ flex: 1, border: '1.5px solid var(--line)', borderRadius: 12, padding: '10px 14px', fontSize: 13 }}
                    />
                  </div>
                  <button type="submit" className="btn btn-ghost btn-sm">
                    Add Address
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}