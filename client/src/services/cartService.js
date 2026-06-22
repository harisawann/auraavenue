import api from './api';

export const cartService = {
  getCart: async () => {
    const { data } = await api.get('/cart');
    return data;
  },

  addItem: async (productId, quantity = 1) => {
    const { data } = await api.post('/cart/items', { productId, quantity });
    return data;
  },

  updateItem: async (productId, quantity) => {
    const { data } = await api.put(`/cart/items/${productId}`, { quantity });
    return data;
  },

  removeItem: async (productId) => {
    const { data } = await api.delete(`/cart/items/${productId}`);
    return data;
  },

  clearCart: async () => {
    const { data } = await api.delete('/cart');
    return data;
  }
};
