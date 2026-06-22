import api from './api';

export const productService = {
  // params: { search, category (id), sort, page, limit, minPrice, maxPrice, tags }
  getProducts: async (params = {}) => {
    const { data } = await api.get('/products', { params });
    return data;
  },

  getFeaturedProducts: async (limit = 8) => {
    const { data } = await api.get('/products/featured', { params: { limit } });
    return data;
  },

  getNewArrivals: async (limit = 8) => {
    const { data } = await api.get('/products/new-arrivals', { params: { limit } });
    return data;
  },

  getBestSellers: async (limit = 8) => {
    const { data } = await api.get('/products/best-sellers', { params: { limit } });
    return data;
  },

  getRelatedProducts: async (slug) => {
    const { data } = await api.get(`/products/${slug}/related`);
    return data;
  },

  getProductBySlug: async (slug) => {
    const { data } = await api.get(`/products/${slug}`);
    return data;
  },

  // --- Admin-only ---
  createProduct: async (product) => {
    const { data } = await api.post('/products', product);
    return data;
  },

  updateProduct: async (id, updates) => {
    const { data } = await api.put(`/products/${id}`, updates);
    return data;
  },

  deleteProduct: async (id) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  getProductsAdmin: async (params = {}) => {
    const { data } = await api.get('/products/admin/all', { params });
    return data;
  }
};
