import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import Logo from './Logo';
import Button from './Button';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount, clearLocalCart } = useCart();
  const { count: wishlistCount, clearLocalWishlist } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    clearLocalCart();
    clearLocalWishlist();
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="flex items-center justify-between px-6 py-5 border-b border-sand-dark bg-paper sticky top-0 z-40">
      <Link to="/" onClick={closeMenu}>
        <Logo />
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-5 text-sm">
        <Link to="/help" className="text-ink/70 hover:text-ink transition-colors">Help</Link>
        <Link to="/shop" className="text-ink/70 hover:text-ink transition-colors">Shop</Link>

        {isAuthenticated && (
          <>
            <NotificationBell />
            <Link to="/wishlist" className="relative text-ink/70 hover:text-ink transition-colors">
              Wishlist
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-3 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-gold text-paper text-[10px] font-medium">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative text-ink/70 hover:text-ink transition-colors">
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-3 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-gold text-paper text-[10px] font-medium">
                  {itemCount}
                </span>
              )}
            </Link>
          </>
        )}

        {isAuthenticated ? (
          <>
            {isAdmin && <Link to="/admin" className="text-ink/70 hover:text-ink transition-colors">Admin</Link>}
            <Link to="/orders" className="text-ink/70 hover:text-ink transition-colors">Orders</Link>
            <Link to="/account" className="text-ink/60 hover:text-ink transition-colors">Hi, {user.name.split(' ')[0]}</Link>
            <Button variant="ghost" onClick={handleLogout}>Sign out</Button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-ink/70 hover:text-ink transition-colors">Sign in</Link>
            <Link to="/register"><Button variant="secondary">Create account</Button></Link>
          </>
        )}
      </nav>

      {/* Mobile right side: cart icon + hamburger */}
      <div className="flex items-center gap-4 md:hidden">
        {isAuthenticated && (
          <Link to="/cart" className="relative text-ink/70 hover:text-ink transition-colors" onClick={closeMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/>
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-gold text-paper text-[10px] font-medium">
                {itemCount}
              </span>
            )}
          </Link>
        )}

        {/* Hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-ink p-1"
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>
      </div>

      {/* Mobile slide-down menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-paper border-b border-sand-dark shadow-lg z-50 md:hidden">
          <nav className="flex flex-col px-6 py-4 gap-4 text-sm">
            <Link to="/shop" onClick={closeMenu} className="text-ink/70 hover:text-ink transition-colors py-2 border-b border-sand-dark">Shop</Link>
            <Link to="/help" onClick={closeMenu} className="text-ink/70 hover:text-ink transition-colors py-2 border-b border-sand-dark">Help & Support</Link>

            {isAuthenticated ? (
              <>
                <Link to="/wishlist" onClick={closeMenu} className="text-ink/70 hover:text-ink transition-colors py-2 border-b border-sand-dark">
                  Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                </Link>
                <Link to="/orders" onClick={closeMenu} className="text-ink/70 hover:text-ink transition-colors py-2 border-b border-sand-dark">My Orders</Link>
                <Link to="/account" onClick={closeMenu} className="text-ink/70 hover:text-ink transition-colors py-2 border-b border-sand-dark">My Account</Link>
                {isAdmin && <Link to="/admin" onClick={closeMenu} className="text-ink/70 hover:text-ink transition-colors py-2 border-b border-sand-dark">Admin Panel</Link>}
                <button onClick={handleLogout} className="text-left text-ink/70 hover:text-ink transition-colors py-2">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu} className="text-ink/70 hover:text-ink transition-colors py-2 border-b border-sand-dark">Sign in</Link>
                <Link to="/register" onClick={closeMenu} className="py-2">
                  <Button variant="secondary" className="w-full">Create account</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
