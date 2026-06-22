import api from './api';

export const authService = {
  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    return data;
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  googleLogin: async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  updateMe: async (updates) => {
    const { data } = await api.put('/auth/me', updates);
    return data;
  }
};
