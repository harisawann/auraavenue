import { BrowserRouter, Routes, Route, useParams, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { initAnalytics, trackPageview } from './utils/analytics';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import ProtectedRoute from './components/ProtectedRoute';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import AdminProducts from './pages/AdminProducts';
import AdminCategories from './pages/AdminCategories';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import AdminCoupons from './pages/AdminCoupons';
import AdminReviews from './pages/AdminReviews';
import AdminShipping from './pages/AdminShipping';
import AdminFAQs from './pages/AdminFAQs';
import AdminHomepage from './pages/AdminHomepage';
import AdminCustomers from './pages/AdminCustomers';
import AdminNotifications from './pages/AdminNotifications';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import PolicyPage from './pages/PolicyPage';
import Account from './pages/Account';
import Help from './pages/Help';

function ProductDetailRoute() {
  const { slug } = useParams();
  return <ProductDetail key={slug} />;
}

function AnalyticsListener() {
  const location = useLocation();
  useEffect(() => { initAnalytics(); }, []);
  useEffect(() => { trackPageview(location.pathname + location.search); }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <AnalyticsListener />
            <Toaster
              position="top-center"
              toastOptions={{
                style: { background: '#1A1A1A', color: '#FFFFFF', fontSize: '14px' }
              }}
            />
            <WhatsAppButton />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/policies/:policy" element={<PolicyPage />} />
              <Route path="/products/:slug" element={<ProductDetailRoute />} />
              <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/orders/:id/confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
              <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
              <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
              <Route path="/help" element={<Help />} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/products" element={<ProtectedRoute adminOnly><AdminProducts /></ProtectedRoute>} />
              <Route path="/admin/categories" element={<ProtectedRoute adminOnly><AdminCategories /></ProtectedRoute>} />
              <Route path="/admin/orders" element={<ProtectedRoute adminOnly><AdminOrders /></ProtectedRoute>} />
              <Route path="/admin/coupons" element={<ProtectedRoute adminOnly><AdminCoupons /></ProtectedRoute>} />
              <Route path="/admin/reviews" element={<ProtectedRoute adminOnly><AdminReviews /></ProtectedRoute>} />
              <Route path="/admin/shipping" element={<ProtectedRoute adminOnly><AdminShipping /></ProtectedRoute>} />
              <Route path="/admin/faqs" element={<ProtectedRoute adminOnly><AdminFAQs /></ProtectedRoute>} />
              <Route path="/admin/homepage" element={<ProtectedRoute adminOnly><AdminHomepage /></ProtectedRoute>} />
              <Route path="/admin/customers" element={<ProtectedRoute adminOnly><AdminCustomers /></ProtectedRoute>} />
              <Route path="/admin/notifications" element={<ProtectedRoute adminOnly><AdminNotifications /></ProtectedRoute>} />
            </Routes>
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
