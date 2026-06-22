import api from './api';

export const orderService = {
  // paymentMethod: 'cod' | 'jazzcash' | 'easypaisa' | 'bank_transfer'
  // idempotencyKey: a client-generated unique string per checkout attempt,
  // used by the backend to prevent duplicate orders from double-submits.
  checkout: async ({ shippingAddress, paymentMethod, paymentReference, couponCode, idempotencyKey }) => {
    const { data } = await api.post('/orders/checkout', {
      shippingAddress,
      paymentMethod,
      paymentReference,
      couponCode,
      idempotencyKey
    });
    return data;
  },

  getMyOrders: async () => {
    const { data } = await api.get('/orders');
    return data;
  },

  getOrderById: async (orderId) => {
    const { data } = await api.get(`/orders/${orderId}`);
    return data;
  }
};
