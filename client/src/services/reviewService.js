import api from './api';

export const reviewService = {
  getProductReviews: async (productId) => {
    const { data } = await api.get(`/reviews/product/${productId}`);
    return data;
  },

  createReview: async (productId, rating, title, comment) => {
    const { data } = await api.post('/reviews', { productId, rating, title, comment });
    return data;
  }
};
