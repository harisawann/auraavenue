import api from './api';

export const adminService = {
  getDashboard: async () => {
    const { data } = await api.get('/admin/dashboard');
    return data;
  },

  getCustomers: async (params = {}) => {
    const { data } = await api.get('/admin/customers', { params });
    return data;
  },

  updateCustomerStatus: async (id, isActive) => {
    const { data } = await api.put(`/admin/customers/${id}/status`, { isActive });
    return data;
  }
};
