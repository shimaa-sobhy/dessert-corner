import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const NAV_LINKS = [
  { to: '/shop', label: 'Shop' },
  { to: '/categories', label: 'Categories' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { itemCount } = useCart();
  const { products: wishlistProducts } = useWishlist();
  const { isAuthenticated } = useAuth();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.classList.add('menu-open');
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMobile(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('menu-open');
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen, closeMobile]);

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          SUCR<em>É</em>
        </NavLink>

        <nav className="navbar-links">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-icons">
          <NavLink to={isAuthenticated ? '/account' : '/login'} className="navbar-icon-btn" aria-label="Account">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
            </svg>
          </NavLink>
          <NavLink to="/wishlist" className="navbar-icon-btn" aria-label="Wishlist">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {wishlistProducts.length > 0 ? <span className="navbar-badge">{wishlistProducts.length}</span> : null}
          </NavLink>
          <NavLink to="/cart" className="navbar-icon-btn" aria-label="Cart">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6h15l-1.5 9h-12z" />
              <path d="M6 6L5 3H2" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            {itemCount > 0 ? <span className="navbar-badge">{itemCount}</span> : null}
          </NavLink>
          <button
            type="button"
            className="navbar-icon-btn navbar-mobile-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen &&
        createPortal(
          <>
            <div className="mobile-menu-backdrop" onClick={closeMobile} />
            <div className="mobile-menu">
              <button type="button" className="mobile-menu-close" onClick={closeMobile} aria-label="Close menu">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
              <nav className="mobile-menu-links">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => (isActive ? 'active' : '')}
                    onClick={closeMobile}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </>,
          document.body
        )}
    </header>
  );
}
