import { useState, useEffect } from 'react';
import api from '../services/api';
import AdminLayout from '../components/AdminLayout';
import Button from '../components/Button';

const STATUS_COLORS = {
  processing: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const ORDER_STATUSES = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/admin/all');
      setOrders(data.orders || []);
    } catch {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
    } catch {
      alert('Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl text-ink mb-8">Orders</h1>

      {loading ? (
        <p className="text-sm text-ink/60 animate-pulse">Loading orders...</p>
      ) : error ? (
        <p className="text-sm text-error">{error}</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-ink/50">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white border border-sand-dark rounded-sm overflow-hidden transition-all duration-200"
            >
              {/* Order Header Row */}
              <div
                className="flex flex-wrap items-center gap-4 p-4 cursor-pointer hover:bg-sand/30 transition-colors"
                onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink/40 font-mono">#{order._id.slice(-8).toUpperCase()}</p>
                  <p className="text-sm font-medium text-ink truncate">
                    {order.shippingAddress?.fullName || 'Customer'}
                  </p>
                  <p className="text-xs text-ink/50">{order.user?.email || ''}</p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-medium text-ink">Rs. {order.totalAmount?.toLocaleString()}</p>
                  <p className="text-xs text-ink/40">{new Date(order.createdAt).toLocaleDateString('en-PK')}</p>
                </div>

                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.orderStatus] || 'bg-sand text-ink'}`}>
                  {order.orderStatus}
                </span>

                <select
                  value={order.orderStatus}
                  onChange={(e) => { e.stopPropagation(); updateStatus(order._id, e.target.value); }}
                  disabled={updatingId === order._id}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs border border-sand-dark rounded-sm px-2 py-1 bg-paper text-ink focus:outline-none focus:border-gold disabled:opacity-50"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>

                <span className="text-ink/30 text-xs">{expandedId === order._id ? '▲' : '▼'}</span>
              </div>

              {/* Expanded Order Details */}
              {expandedId === order._id && (
                <div className="border-t border-sand-dark p-4 bg-cream/40 animate-fadeIn">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-ink/40 mb-2">Items</h3>
                      <div className="flex flex-col gap-1">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-ink/70">{item.name} × {item.quantity}</span>
                            <span className="text-ink">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-sand-dark mt-2 pt-2 flex flex-col gap-1 text-xs text-ink/50">
                        <div className="flex justify-between"><span>Shipping</span><span>Rs. {order.shippingCost?.toLocaleString()}</span></div>
                        {order.discountAmount > 0 && (
                          <div className="flex justify-between text-success"><span>Discount</span><span>−Rs. {order.discountAmount?.toLocaleString()}</span></div>
                        )}
                        <div className="flex justify-between font-medium text-ink text-sm"><span>Total</span><span>Rs. {order.totalAmount?.toLocaleString()}</span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-ink/40 mb-2">Shipping Address</h3>
                      <div className="text-sm text-ink/70 leading-relaxed">
                        <p>{order.shippingAddress?.fullName}</p>
                        <p>{order.shippingAddress?.line1}</p>
                        {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                        <p>{order.shippingAddress?.postalCode}</p>
                        <p>{order.shippingAddress?.phone}</p>
                      </div>
                      <div className="mt-3">
                        <h3 className="text-xs uppercase tracking-wider text-ink/40 mb-1">Payment</h3>
                        <p className="text-sm text-ink/70 capitalize">{order.paymentMethod?.replace('_', ' ')}</p>
                        {order.paymentReference && (
                          <p className="text-xs text-ink/40">Ref: {order.paymentReference}</p>
                        )}
                        <p className="text-xs mt-1">
                          <span className={`px-2 py-0.5 rounded-full ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {order.paymentStatus}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
