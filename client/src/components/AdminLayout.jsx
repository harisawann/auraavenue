import { Link, useLocation } from 'react-router-dom';
import Header from './Header';

const navItems = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/coupons', label: 'Coupons' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/shipping', label: 'Shipping' },
  { to: '/admin/faqs', label: 'FAQs' },
  { to: '/admin/homepage', label: 'Homepage' },
  { to: '/admin/notifications', label: 'Notifications' }
];

export default function AdminLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-paper">
      <Header />
      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
        <aside className="w-48 flex-shrink-0 hidden md:block">
          <nav className="flex flex-col gap-1 sticky top-24">
            {navItems.map((item) => {
              const isActive = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`text-sm px-3 py-2 rounded-sm transition-colors ${
                    isActive ? 'bg-ink text-paper' : 'text-ink/70 hover:bg-sand'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
