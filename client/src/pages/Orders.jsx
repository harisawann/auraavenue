import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import Header from '../components/Header';
import Button from '../components/Button';

const statusStyles = {
  processing: 'bg-sand text-ink/70',
  shipped: 'bg-success/15 text-success',
  delivered: 'bg-success/25 text-success',
  cancelled: 'bg-error/15 text-error'
};

const paymentStyles = {
  pending: 'text-ink/50',
  paid: 'text-success',
  failed: 'text-error',
  refunded: 'text-ink/50'
};

const paymentMethodLabels = {
  cod: 'COD',
  jazzcash: 'JazzCash',
  easypaisa: 'Easypaisa',
  bank_transfer: 'Bank Transfer'
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    orderService
      .getMyOrders()
      .then((data) => {
        if (!cancelled) setOrders(data.orders);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-3xl text-ink mb-8">Order History</h1>

        {loading ? (
          <p className="text-sm text-ink/60">Loading...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-xl text-ink mb-2">No orders yet</p>
            <p className="text-sm text-ink/60 mb-6">Your past orders will show up here.</p>
            <Link to="/shop">
              <Button>Browse the shop</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white border border-sand-dark rounded-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-ink">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-ink/50">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {' · '}
                      {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-sm capitalize ${statusStyles[order.orderStatus] || 'bg-sand text-ink/70'}`}>
                      {order.orderStatus}
                    </span>
                    <span className={`text-xs capitalize ${paymentStyles[order.paymentStatus] || 'text-ink/50'}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 mb-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-ink/70">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center border-t border-sand-dark pt-3">
                  <span className="text-sm text-ink/50">Total</span>
                  <span className="font-display text-lg text-ink">Rs. {order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
