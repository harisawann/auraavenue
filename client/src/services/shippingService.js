import api from './api';

export const shippingService = {
  getConfig: async () => {
    const { data } = await api.get('/shipping-config');
    return data;
  }
};
