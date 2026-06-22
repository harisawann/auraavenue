import api from './api';

export const notificationService = {
  getMyNotifications: async () => {
    const { data } = await api.get('/notifications');
    return data;
  },

  markAsRead: async (id) => {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data;
  },

  markAllAsRead: async () => {
    const { data } = await api.put('/notifications/read-all');
    return data;
  },

  // Admin only
  getAllNotifications: async () => {
    const { data } = await api.get('/notifications/admin/all');
    return data;
  },

  // Admin only — send an announcement to all customers, all admins, or one user
  send: async ({ title, message, audience, recipientId, link, type }) => {
    const { data } = await api.post('/notifications', { title, message, audience, recipientId, link, type });
    return data;
  }
};
