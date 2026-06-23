import { Link } from 'react-router-dom';
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

  const handleLogout = () => {
    logout();
    clearLocalCart();
    clearLocalWishlist();
  };

  return (
    <header className="flex items-center justify-between px-6 py-5 border-b border-sand-dark bg-paper sticky top-0 z-10">
      <Link to="/">
        <Logo />
      </Link>

      <nav className="flex items-center gap-5 text-sm">
        <Link to="/help" className="text-ink/70 hover:text-ink transition-colors hidden md:inline">Help</Link>
        <Link to="/shop" className="text-ink/70 hover:text-ink transition-colors">
          Shop
        </Link>

        {isAuthenticated && (
          <>
            <NotificationBell />
            <Link to="/wishlist" className="relative text-ink/70 hover:text-ink transition-colors hidden sm:inline">
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
            {isAdmin && (
              <Link to="/admin" className="text-ink/70 hover:text-ink transition-colors hidden sm:inline">
                Admin
              </Link>
            )}
            <Link to="/orders" className="text-ink/70 hover:text-ink transition-colors hidden sm:inline">
              Orders
            </Link>
            <Link to="/account" className="text-ink/60 hidden sm:inline hover:text-ink transition-colors">
              Hi, {user.name.split(' ')[0]}
            </Link>
            <Button variant="ghost" onClick={handleLogout}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-ink/70 hover:text-ink transition-colors">
              Sign in
            </Link>
            <Link to="/register">
              <Button variant="secondary">Create account</Button>
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
