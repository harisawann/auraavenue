import api from './api';

export const couponService = {
  validate: async (code, subtotal) => {
    const { data } = await api.post('/coupons/validate', { code, subtotal });
    return data;
  }
};
