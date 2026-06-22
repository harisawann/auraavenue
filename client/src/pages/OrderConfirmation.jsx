import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { trackEvent } from '../utils/analytics';
import Header from '../components/Header';
import Button from '../components/Button';

const paymentMethodLabels = {
  cod: 'Cash on Delivery',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  bank_transfer: 'Bank Transfer'
};

// Confetti burst component
function Confetti() {
  const pieces = Array.from({ length: 30 });
  const colors = ['#B8860B', '#1A1A1A', '#4A5D4F', '#E2DDD4', '#FAF8F5'];
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((_, i) => {
        const color = colors[i % colors.length];
        const left = `${Math.random() * 100}%`;
        const delay = `${Math.random() * 0.8}s`;
        const duration = `${0.8 + Math.random() * 1.2}s`;
        const size = `${6 + Math.random() * 8}px`;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left,
              top: '-10px',
              width: size,
              height: size,
              background: color,
              borderRadius: Math.random() > 0.5 ? '50%' : '0',
              animationName: 'confettiFall',
              animationDuration: duration,
              animationDelay: delay,
              animationTimingFunction: 'linear',
              animationFillMode: 'forwards',
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    let cancelled = false;
    orderService
      .getOrderById(id)
      .then((data) => {
        if (cancelled) return;
        setOrder(data.order);
        trackEvent(
          'purchase',
          {
            transaction_id: data.order._id,
            value: data.order.totalAmount,
            currency: 'PKR',
            items: data.order.items?.map((it) => ({ item_id: it.product, quantity: it.quantity, price: it.price }))
          },
          'Purchase'
        );
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Auto-hide confetti after 2.5s
  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Success Popup Modal */}
      {showPopup && (
        <div
          className="fixed inset-0 bg-ink/50 z-40 flex items-center justify-center p-4"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-paper rounded-sm border border-sand-dark p-8 max-w-sm w-full text-center shadow-xl"
            style={{ animation: 'popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated checkmark */}
            <div
              className="h-20 w-20 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-5 text-4xl"
              style={{ animation: 'bounceIn 0.6s 0.2s both' }}
            >
              ✓
            </div>
            <h2 className="font-display text-2xl text-ink mb-2">Order Confirmed!</h2>
            <p className="text-ink/60 text-sm mb-1">
              {order ? `Order #${order._id.slice(-8).toUpperCase()}` : 'Your order has been placed.'}
            </p>
            <p className="text-ink/50 text-xs mb-6">
              Thank you for shopping with Aura Avenue. We'll process your order shortly.
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setShowPopup(false)}>View Order Details</Button>
              <Link to="/shop">
                <Button variant="ghost" className="w-full">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-6 py-20">
        {/* Page header */}
        <div className="text-center mb-10" style={{ animation: 'fadeSlideUp 0.5s 0.1s both' }}>
          <div className="h-16 w-16 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-6 text-3xl">
            ✓
          </div>
          <h1 className="font-display text-3xl text-ink mb-2">Thank you for your order</h1>
          <p className="text-ink/60">
            {order ? `Confirmation for order #${order._id.slice(-8).toUpperCase()}` : 'Loading order details...'}
          </p>
        </div>

        {!loading && order && (
          <div
            className="bg-white border border-sand-dark rounded-sm p-6 text-left mb-8"
            style={{ animation: 'fadeSlideUp 0.5s 0.25s both' }}
          >
            <div className="flex flex-col gap-3 mb-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-ink/70">
                    {item.name} <span className="text-ink/40">× {item.quantity}</span>
                  </span>
                  <span className="text-ink">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-sand-dark pt-3 flex flex-col gap-1 text-sm">
              <div className="flex justify-between text-ink/60">
                <span>Subtotal</span>
                <span>Rs. {order.itemsTotal?.toLocaleString()}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount {order.coupon?.code ? `(${order.coupon.code})` : ''}</span>
                  <span>−Rs. {order.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-ink/60">
                <span>Shipping</span>
                <span>{order.shippingCost === 0 ? 'Free' : `Rs. ${order.shippingCost?.toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between font-display text-base text-ink mt-1">
                <span>Total</span>
                <span>Rs. {order.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="border-t border-sand-dark mt-4 pt-4 text-sm text-ink/60">
              <p className="font-medium text-ink mb-1">Payment method</p>
              <p>{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</p>
              {order.paymentMethod !== 'cod' && (
                <p className="text-xs text-ink/40 mt-1">
                  We'll verify your payment and update your order status shortly.
                </p>
              )}
            </div>

            <div className="border-t border-sand-dark mt-4 pt-4 text-sm text-ink/60">
              <p className="font-medium text-ink mb-1">Shipping to</p>
              <p>{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center" style={{ animation: 'fadeSlideUp 0.5s 0.4s both' }}>
          <Link to="/orders"><Button variant="secondary">View order history</Button></Link>
          <Link to="/shop"><Button variant="ghost">Continue shopping</Button></Link>
        </div>
      </main>
    </div>
  );
}
