import api from './api';

export const wishlistService = {
  getWishlist: async () => {
    const { data } = await api.get('/wishlist');
    return data;
  },

  addItem: async (productId) => {
    const { data } = await api.post('/wishlist/items', { productId });
    return data;
  },

  removeItem: async (productId) => {
    const { data } = await api.delete(`/wishlist/items/${productId}`);
    return data;
  }
};
