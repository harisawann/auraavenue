import api from './api';

export const categoryService = {
  getCategories: async () => {
    const { data } = await api.get('/categories');
    return data;
  },

  getCategoryBySlug: async (slug) => {
    const { data } = await api.get(`/categories/${slug}`);
    return data;
  },

  // --- Admin-only ---
  createCategory: async (category) => {
    const { data } = await api.post('/categories', category);
    return data;
  },

  updateCategory: async (id, updates) => {
    const { data } = await api.put(`/categories/${id}`, updates);
    return data;
  },

  deleteCategory: async (id) => {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },

  getCategoriesAdmin: async () => {
    const { data } = await api.get('/categories/admin/all');
    return data;
  }
};
